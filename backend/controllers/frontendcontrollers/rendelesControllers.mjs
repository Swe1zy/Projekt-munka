import mongoose from 'mongoose';
import Stripe from 'stripe';
import RendelesModel, { fizetesPotolhato, vevoLemondhatja } from '../../models/Rendeles.mjs';
import TermekModel from '../../models/Termek.mjs';
import { KISZALLITAS, STRIPE_FIZETESI_IDO_PERC, boltErtesitesiEmail } from '../../config/uzlet.mjs';
import { rendelesOsszesites } from '../../utils/arazas.mjs';
import { adoszamValid, cimValid, nevValid, szoveg } from '../../utils/cimek.mjs';
import { dijbekeroFajlnev, dijbekeroPdf } from '../../utils/dijbekero.mjs';
import { emailKuldes } from '../../utils/email.mjs';
import { hatterben, keszletRiasztas, rendelesErtesitesek } from '../../utils/ertesitesek.mjs';
import { keszletLevonas, keszletVisszaadas } from '../../utils/keszlet.mjs';
import { lemondasLevel } from '../../utils/levelek.mjs';
import { valaszthatoNapok } from '../../utils/naptar.mjs';
import { raklapEgyenleg, rendelesValasz } from '../../utils/rendelesFormazas.mjs';
import { fuggoFizetesLezarasa } from './stripeFizetesControllers.mjs';

const SAJAT_RENDELESEK_LIMIT = 50;

const EMAIL_MINTA = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MENNYISEG = 999;

/**
 * A kosár tételeinek ellenőrzése és betöltése az adatbázisból. Az árat, nevet és
 * egységet mindig a termékből vesszük, sosem a kliens adataiból.
 * Eredmény: { hiba } vagy { termekTetelek: [{ termek, mennyiseg }] }.
 */
const tetelekBetoltese = async (tetelek, { keszletEllenorzes = true } = {}) => {
    if (!Array.isArray(tetelek) || tetelek.length === 0 || tetelek.length > 100) {
        return { hiba: 'A kosár üres vagy túl sok terméket tartalmaz.' };
    }

    const egyediTetelek = new Map();
    for (const tetel of tetelek) {
        if (!tetel || !mongoose.isValidObjectId(tetel.termekId) || !Number.isFinite(tetel.mennyiseg) || tetel.mennyiseg <= 0 || tetel.mennyiseg > MAX_MENNYISEG) {
            return { hiba: 'A kosár egyik termékadata érvénytelen.' };
        }
        if (egyediTetelek.has(String(tetel.termekId))) {
            return { hiba: 'A kosár ugyanazt a terméket többször tartalmazza.' };
        }
        egyediTetelek.set(String(tetel.termekId), tetel.mennyiseg);
    }

    const termekek = await TermekModel.find({ _id: { $in: [...egyediTetelek.keys()] } }).lean();
    if (termekek.length !== egyediTetelek.size) {
        return { hiba: 'A kosár egyik terméke már nem érhető el.' };
    }

    const termekTetelek = [];
    for (const termek of termekek) {
        const mennyiseg = egyediTetelek.get(String(termek._id));
        if (termek.egyseg === 'db' && !Number.isInteger(mennyiseg)) {
            return { hiba: `A(z) „${termek.nev}” csak egész darabszámban rendelhető.` };
        }
        if (keszletEllenorzes && mennyiseg > termek.keszlet) {
            return { hiba: `A(z) „${termek.nev}” kért mennyisége nem elérhető.` };
        }
        termekTetelek.push({ termek, mennyiseg });
    }
    return { termekTetelek };
};

const postRendeles = async (req, res) => {
    try {
        const { email, atvetelModja, tetelek } = req.body ?? {};
        const fizetesiMod = req.body?.fizetesiMod === 'stripe' ? 'stripe' : 'atutalas';
        if (fizetesiMod === 'stripe' && !process.env.STRIPE_SECRET_KEY) {
            return res.status(503).json({ msg: 'Az online bankkártyás fizetés nincs beállítva a szerveren.' });
        }
        const normalizaltEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const bejovoSzamlazasiAdatok = req.body?.szamlazasiAdatok ?? {};
        const szamlazasiTipus = bejovoSzamlazasiAdatok.tipus;
        const szamlazasiNev = szoveg(bejovoSzamlazasiAdatok.nev);
        const adoszam = szoveg(bejovoSzamlazasiAdatok.adoszam);
        const szamlazasiAdatok = {
            tipus: szamlazasiTipus,
            nev: szamlazasiNev,
            adoszam,
            iranyitoszam: szoveg(bejovoSzamlazasiAdatok.iranyitoszam),
            telepules: szoveg(bejovoSzamlazasiAdatok.telepules),
            utca: szoveg(bejovoSzamlazasiAdatok.utca),
            megjegyzes: szoveg(bejovoSzamlazasiAdatok.megjegyzes).slice(0, 500),
        };
        const szallitasiEgyezik = req.body?.szallitasiEgyezik === true;

        if (!EMAIL_MINTA.test(normalizaltEmail)) {
            return res.status(400).json({ msg: 'Adj meg érvényes e-mail-címet.' });
        }
        if (!['maganszemely', 'ceg'].includes(szamlazasiTipus) || !nevValid(szamlazasiNev) || !cimValid(szamlazasiAdatok)) {
            return res.status(400).json({ msg: 'Töltsd ki helyesen a számlázási nevet és címet.' });
        }
        if (szamlazasiTipus === 'ceg' && !adoszamValid(adoszam)) {
            return res.status(400).json({ msg: 'Céges számlázásnál add meg az érvényes adószámot.' });
        }
        if (!['hazhozszallitas', 'szemelyes_atvetel'].includes(atvetelModja)) {
            return res.status(400).json({ msg: 'Válassz érvényes átvételi módot.' });
        }

        let szallitasiAdatok;
        if (atvetelModja === 'hazhozszallitas') {
            const bejovoSzallitasiAdatok = req.body?.szallitasiAdatok ?? {};
            szallitasiAdatok = {
                atvevoNev: szallitasiEgyezik ? szamlazasiNev : szoveg(bejovoSzallitasiAdatok.atvevoNev),
                iranyitoszam: szallitasiEgyezik ? szamlazasiAdatok.iranyitoszam : szoveg(bejovoSzallitasiAdatok.iranyitoszam),
                telepules: szallitasiEgyezik ? szamlazasiAdatok.telepules : szoveg(bejovoSzallitasiAdatok.telepules),
                utca: szallitasiEgyezik ? szamlazasiAdatok.utca : szoveg(bejovoSzallitasiAdatok.utca),
                megjegyzes: szoveg(bejovoSzallitasiAdatok.megjegyzes).slice(0, 500),
            };
            if (!nevValid(szallitasiAdatok.atvevoNev) || !cimValid(szallitasiAdatok)) {
                return res.status(400).json({ msg: 'Töltsd ki helyesen a szállítási nevet és címet.' });
            }
        }
        const hazhoz = atvetelModja === 'hazhozszallitas';
        const valaszthato = valaszthatoNapok(atvetelModja).map((nap) => nap.datum);
        const atvetelNapja = szoveg(req.body?.atvetelNapja);
        if (!valaszthato.includes(atvetelNapja)) {
            return res.status(400).json({
                msg: hazhoz ? 'Válassz érvényes kiszállítási napot.' : 'Válassz érvényes átvételi napot.',
            });
        }
        const idosav = hazhoz ? szoveg(req.body?.idosav) : undefined;
        if (hazhoz && !KISZALLITAS.idosavok.some((sav) => sav.kulcs === idosav)) {
            return res.status(400).json({ msg: 'Válassz kiszállítási idősávot.' });
        }
        const darus = hazhoz && req.body?.darus === true;

        const betoltes = await tetelekBetoltese(tetelek);
        if (betoltes.hiba) {
            return res.status(400).json({ msg: betoltes.hiba });
        }

        const osszesites = rendelesOsszesites({
            tetelek: betoltes.termekTetelek,
            atvetelModja,
            iranyitoszam: szallitasiAdatok?.iranyitoszam,
            darus,
            szamlazasiAdatok,
        });
        if (!osszesites.szallitasSzamolhato) {
            return res.status(400).json({ msg: 'Ehhez az irányítószámhoz nem tudunk szállítási díjat számolni.' });
        }
        if (osszesites.minimumHiany > 0) {
            return res.status(400).json({
                msg: `Házhozszállítás ${osszesites.minimumRendelesiErtek.toLocaleString('hu-HU')} Ft termékérték felett kérhető.`,
            });
        }
        if (fizetesiMod === 'stripe' && Math.round(osszesites.vegosszeg) <= 0) {
            return res.status(400).json({ msg: 'Bankkártyás fizetéshez a végösszegnek pozitívnak kell lennie.' });
        }
        const rendelesTetelek = osszesites.sorok.map(({ termekId, nev, mennyiseg, egyseg, egysegar }) => (
            { termekId, nev, mennyiseg, egyseg, egysegar }
        ));
        const normalizaltCim = szallitasiAdatok
            ? `${szallitasiAdatok.iranyitoszam} ${szallitasiAdatok.telepules}, ${szallitasiAdatok.utca}`
            : '';

        // A fenti ellenőrzés óta más is vásárolhatott: a levonás atomi és feltételes,
        // így csak akkor sikerül, ha a rendelés pillanatában is van elég készlet.
        const levonas = await keszletLevonas(rendelesTetelek);
        if (!levonas.siker) {
            return res.status(409).json({
                msg: `A(z) „${levonas.hianyzoTetel.nev}” kért mennyisége közben elfogyott. Frissítsd a kosarat, és próbáld újra.`,
            });
        }

        let rendeles;
        let checkoutSession;
        try {
            rendeles = await RendelesModel.create({
                userId: req.authUser?._id ?? null,
                email: normalizaltEmail,
                teljesNev: szamlazasiNev,
                atvetelModja,
                szallitasiCim: normalizaltCim,
                szallitasiEgyezik: atvetelModja === 'hazhozszallitas' && szallitasiEgyezik,
                szallitasiAdatok,
                szamlazasiAdatok,
                tetelek: rendelesTetelek,
                // A Stripe HUF-ban egész forintot fogad el; online fizetésnél a
                // rendelés végösszegét is ehhez igazítjuk.
                vegosszeg: fizetesiMod === 'stripe' ? Math.round(osszesites.vegosszeg) : osszesites.vegosszeg,
                fizetesiMod,
                fizetesiAllapot: fizetesiMod === 'stripe' ? 'fizetesre_var' : 'atutalasra_var',
                osszesites: {
                    termekOsszeg: osszesites.termekOsszeg,
                    kedvezmenySzazalek: osszesites.kedvezmenySzazalek,
                    kedvezmeny: osszesites.kedvezmeny,
                    szallitasiDij: osszesites.szallitasiDij,
                    sulyKg: osszesites.sulyKg,
                    raklapok: osszesites.raklapok,
                    raklapBetetdij: osszesites.raklapBetetdij,
                    szallitas: osszesites.szallitas ?? undefined,
                },
                atvetelNapja,
                idosav,
            });

            if (fizetesiMod === 'stripe') {
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
                const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
                checkoutSession = await stripe.checkout.sessions.create({
                    mode: 'payment',
                    customer_email: normalizaltEmail,
                    line_items: [{
                        price_data: {
                            currency: 'huf',
                            product_data: {
                                name: `Tüzép rendelés ${String(rendeles._id).slice(-6).toUpperCase()}`,
                                description: `${rendeles.tetelek.length} terméktétel, szállítással és díjakkal együtt`,
                            },
                            unit_amount: Math.round(rendeles.vegosszeg),
                        },
                        quantity: 1,
                    }],
                    metadata: { orderId: String(rendeles._id) },
                    success_url: `${frontendUrl}/fizetes/sikeres?session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${frontendUrl}/fizetes/megszakitva?session_id={CHECKOUT_SESSION_ID}`,
                    expires_at: Math.floor(Date.now() / 1000) + STRIPE_FIZETESI_IDO_PERC * 60,
                });
                rendeles.stripeSessionId = checkoutSession.id;
                await rendeles.save();
            }
        } catch (error) {
            // Ha a rendelés vagy a Stripe-munkamenet nem jött létre, visszaállítjuk a készletet.
            if (checkoutSession?.status === 'open') {
                try {
                    await new Stripe(process.env.STRIPE_SECRET_KEY).checkout.sessions.expire(checkoutSession.id);
                } catch (expireError) {
                    console.error('Félbemaradt Stripe-munkamenet lezárási hiba:', expireError.message);
                }
            }
            if (rendeles) await RendelesModel.deleteOne({ _id: rendeles._id });
            await keszletVisszaadas(rendelesTetelek);
            throw error;
        }

        // Online rendelésnél értesítünk csak a Stripe fizetési visszaigazolása után.
        if (fizetesiMod === 'atutalas') {
            hatterben(() => rendelesErtesitesek(rendeles._id), 'Rendelés-értesítés');
        }
        hatterben(() => keszletRiasztas(levonas.valtozasok), 'Készletriasztás');

        return res.status(201).json({
            msg: 'A rendelésedet rögzítettük.',
            rendeles: { id: rendeles._id, vegosszeg: rendeles.vegosszeg },
            ...(checkoutSession ? { fizetesiUrl: checkoutSession.url } : {}),
        });
    } catch (error) {
        console.error('Rendelésmentési hiba:', error);
        return res.status(500).json({ msg: 'A rendelést most nem sikerült rögzíteni. Próbáld újra később.' });
    }
};

const getSajatRendelesek = async (req, res) => {
    try {
        const [rendelesek, raklaposRendelesek] = await Promise.all([
            RendelesModel.find({ userId: req.authUser._id })
                .sort({ createdAt: -1 })
                .limit(SAJAT_RENDELESEK_LIMIT)
                .lean(),
            // Az egyenleg a lista korlátjától függetlenül az összes átvett rendelésből számol.
            RendelesModel.find(
                { userId: req.authUser._id, allapot: 'teljesitve', 'osszesites.raklapok': { $gt: 0 } },
                { allapot: 1, 'osszesites.raklapok': 1, 'osszesites.raklapBetetdij': 1, visszahozottRaklapok: 1 },
            ).lean(),
        ]);

        return res.status(200).json({
            rendelesek: rendelesek.map((rendeles) => rendelesValasz(rendeles)),
            raklapEgyenleg: raklapEgyenleg(raklaposRendelesek),
        });
    } catch (error) {
        console.error('Saját rendelések lekérési hiba:', error);
        return res.status(500).json({ msg: 'A rendeléseidet most nem sikerült betölteni.' });
    }
};

// A vevő a saját rendelését addig mondhatja le, amíg az feldolgozásra vár és nincs kifizetve.
const postRendelesLemondas = async (req, res) => {
    try {
        const { id } = req.params;
        const sajatSzuro = { _id: id, userId: req.authUser._id };
        const rendeles = mongoose.isValidObjectId(id) ? await RendelesModel.findOne(sajatSzuro).lean() : null;
        if (!rendeles) {
            return res.status(404).json({ msg: 'A rendelés nem található.' });
        }
        if (!vevoLemondhatja(rendeles)) {
            const msg = rendeles.allapot === 'lemondva'
                ? 'Ez a rendelés már le van mondva.'
                : rendeles.allapot !== 'feldolgozasra_var'
                    ? 'A rendelés feldolgozása már megkezdődött, ezért online nem mondható le. Kérjük, keresd a telephelyet.'
                    : 'A már kifizetett rendelést a telephellyel egyeztetve tudod lemondani.';
            return res.status(409).json({ msg });
        }

        // Félbehagyott bankkártyás fizetésnél előbb a fizetési oldalt zárjuk le,
        // hogy a lemondott rendelést utólag már ne lehessen kifizetni.
        if (fizetesPotolhato(rendeles)) {
            const { fizetve } = await fuggoFizetesLezarasa(rendeles);
            if (fizetve) {
                return res.status(409).json({
                    msg: 'Közben megérkezett a bankkártyás fizetésed, ezért a rendelést a telephellyel egyeztetve tudod lemondani.',
                });
            }
        }

        // Feltételes frissítés: ha az állapot közben megváltozott (pl. a bolt visszaigazolta),
        // nem mondjuk le, így a készlet sem kerülhet vissza kétszer.
        const frissitett = await RendelesModel.findOneAndUpdate(
            { ...sajatSzuro, allapot: 'feldolgozasra_var', fizetesiAllapot: { $ne: 'fizetve' } },
            {
                $set: {
                    allapot: 'lemondva',
                    ...(rendeles.fizetesiAllapot === 'fizetesre_var' ? { fizetesiAllapot: 'fizetes_lejart' } : {}),
                },
                $push: { allapotTortenet: { allapot: 'lemondva', datum: new Date(), megjegyzes: 'A vevő lemondta a rendelést.' } },
            },
            { returnDocument: 'after', runValidators: true, lean: true },
        );
        if (!frissitett) {
            // A fizetési oldal lezárása miatt a Stripe értesítése megelőzhetett minket.
            const aktualis = await RendelesModel.findOne(sajatSzuro).lean();
            if (aktualis?.allapot === 'lemondva') {
                return res.status(200).json({ msg: 'A rendelést lemondtuk.', rendeles: rendelesValasz(aktualis) });
            }
            return res.status(409).json({ msg: 'A rendelés állapota közben megváltozott. Frissítsd az oldalt, és nézd meg az aktuális állapotot.' });
        }

        await keszletVisszaadas(rendeles.tetelek);
        hatterben(
            () => emailKuldes({ cimzett: boltErtesitesiEmail(), ...lemondasLevel(frissitett) }),
            'Lemondás-értesítés',
        );

        return res.status(200).json({
            msg: 'A rendelést lemondtuk, a lefoglalt tételeket felszabadítottuk.',
            rendeles: rendelesValasz(frissitett),
        });
    } catch (error) {
        console.error('Vevői rendeléslemondási hiba:', error);
        return res.status(500).json({ msg: 'A rendelést most nem sikerült lemondani. Próbáld újra később.' });
    }
};

// Díj-előnézet a kosárhoz és a pénztárhoz: ugyanaz a számítás, mint rendeléskor,
// de készletet nem foglal és a címet nem követeli meg.
const postOsszesito = async (req, res) => {
    try {
        const { tetelek, atvetelModja, iranyitoszam, darus, szamlazasiTipus, adoszam } = req.body ?? {};
        const betoltes = await tetelekBetoltese(tetelek, { keszletEllenorzes: false });
        if (betoltes.hiba) {
            return res.status(400).json({ msg: betoltes.hiba });
        }

        const modja = atvetelModja === 'hazhozszallitas' ? 'hazhozszallitas' : 'szemelyes_atvetel';
        const osszesites = rendelesOsszesites({
            tetelek: betoltes.termekTetelek,
            atvetelModja: modja,
            iranyitoszam: szoveg(iranyitoszam),
            darus: modja === 'hazhozszallitas' && darus === true,
            szamlazasiAdatok: { tipus: szamlazasiTipus, adoszam: szoveg(adoszam) },
        });
        const keszlethiany = betoltes.termekTetelek
            .filter(({ termek, mennyiseg }) => mennyiseg > termek.keszlet)
            .map(({ termek }) => ({ termekId: termek._id, nev: termek.nev, keszlet: termek.keszlet }));

        return res.status(200).json({ osszesites: { ...osszesites, sorok: undefined }, keszlethiany });
    } catch (error) {
        console.error('Összesítő-hiba:', error);
        return res.status(500).json({ msg: 'A díjakat most nem sikerült kiszámolni.' });
    }
};

// Díjbekérő PDF: a saját rendeléséhez a vásárló, bármelyikhez az admin töltheti le.
const getDijbekero = async (req, res) => {
    try {
        const { id } = req.params;
        const rendeles = mongoose.isValidObjectId(id) ? await RendelesModel.findById(id).lean() : null;
        const sajat = rendeles?.userId && String(rendeles.userId) === String(req.authUser._id);
        // Idegen rendelésnél is 404, hogy ne derüljön ki, létezik-e az azonosító.
        if (!rendeles || (!sajat && req.authUser.role !== 'admin')) {
            return res.status(404).json({ msg: 'A rendelés nem található.' });
        }

        const pdf = await dijbekeroPdf(rendeles);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${dijbekeroFajlnev(rendeles)}"`);
        res.setHeader('Cache-Control', 'private, no-store');
        return res.status(200).send(pdf);
    } catch (error) {
        console.error('Díjbekérő-hiba:', error);
        return res.status(500).json({ msg: 'A díjbekérőt most nem sikerült elkészíteni.' });
    }
};

export { postRendeles, getSajatRendelesek, postRendelesLemondas, postOsszesito, getDijbekero };