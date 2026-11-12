import mongoose from 'mongoose';
import RendelesModel from '../../models/Rendeles.mjs';
import TermekModel from '../../models/Termek.mjs';

const EMAIL_MINTA = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MENNYISEG = 999;
const cimValid = (cim) => cim &&
    /^\d{4}$/.test(cim.iranyitoszam) &&
    cim.telepules.length >= 2 && cim.telepules.length <= 100 &&
    cim.utca.length >= 3 && cim.utca.length <= 200;

const szoveg = (ertek) => typeof ertek === 'string' ? ertek.trim() : '';

const postRendeles = async (req, res) => {
    try {
        const { email, atvetelModja, tetelek } = req.body ?? {};
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
        if (!['maganszemely', 'ceg'].includes(szamlazasiTipus) || szamlazasiNev.length < 2 || szamlazasiNev.length > 120 || !cimValid(szamlazasiAdatok)) {
            return res.status(400).json({ msg: 'Töltsd ki helyesen a számlázási nevet és címet.' });
        }
        if (szamlazasiTipus === 'ceg' && (adoszam.length < 5 || adoszam.length > 32)) {
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
            if (szallitasiAdatok.atvevoNev.length < 2 || szallitasiAdatok.atvevoNev.length > 120 || !cimValid(szallitasiAdatok)) {
                return res.status(400).json({ msg: 'Töltsd ki helyesen a szállítási nevet és címet.' });
            }
        }
        if (!Array.isArray(tetelek) || tetelek.length === 0 || tetelek.length > 100) {
            return res.status(400).json({ msg: 'A kosár üres vagy túl sok terméket tartalmaz.' });
        }

        const egyediTetelek = new Map();
        for (const tetel of tetelek) {
            if (!tetel || !mongoose.isValidObjectId(tetel.termekId) || !Number.isFinite(tetel.mennyiseg) || tetel.mennyiseg <= 0 || tetel.mennyiseg > MAX_MENNYISEG) {
                return res.status(400).json({ msg: 'A kosár egyik termékadata érvénytelen.' });
            }
            if (egyediTetelek.has(String(tetel.termekId))) {
                return res.status(400).json({ msg: 'A kosár ugyanazt a terméket többször tartalmazza.' });
            }
            egyediTetelek.set(String(tetel.termekId), tetel.mennyiseg);
        }

        const termekek = await TermekModel.find({ _id: { $in: [...egyediTetelek.keys()] } });
        if (termekek.length !== egyediTetelek.size) {
            return res.status(400).json({ msg: 'A kosár egyik terméke már nem érhető el.' });
        }

        const rendelesTetelek = [];
        for (const termek of termekek) {
            const mennyiseg = egyediTetelek.get(String(termek._id));
            if (mennyiseg > termek.keszlet || (termek.egyseg === 'db' && !Number.isInteger(mennyiseg))) {
                return res.status(400).json({ msg: `A(z) „${termek.nev}” kért mennyisége nem elérhető.` });
            }
            rendelesTetelek.push({
                termekId: termek._id,
                nev: termek.nev,
                mennyiseg,
                egyseg: termek.egyseg,
                egysegar: termek.ar,
            });
        }

        const vegosszeg = Math.round(rendelesTetelek.reduce(
            (osszeg, tetel) => osszeg + tetel.egysegar * tetel.mennyiseg,
            0,
        ) * 100) / 100;
        const normalizaltCim = szallitasiAdatok
            ? `${szallitasiAdatok.iranyitoszam} ${szallitasiAdatok.telepules}, ${szallitasiAdatok.utca}`
            : '';
        const rendeles = await RendelesModel.create({
            email: normalizaltEmail,
            teljesNev: szamlazasiNev,
            atvetelModja,
            szallitasiCim: normalizaltCim,
            szallitasiEgyezik: atvetelModja === 'hazhozszallitas' && szallitasiEgyezik,
            szallitasiAdatok,
            szamlazasiAdatok,
            tetelek: rendelesTetelek,
            vegosszeg,
        });

        return res.status(201).json({
            msg: 'A rendelésedet rögzítettük.',
            rendeles: { id: rendeles._id, vegosszeg: rendeles.vegosszeg },
        });
    } catch (error) {
        console.error('Rendelésmentési hiba:', error);
        return res.status(500).json({ msg: 'A rendelést most nem sikerült rögzíteni. Próbáld újra később.' });
    }
};

export { postRendeles };