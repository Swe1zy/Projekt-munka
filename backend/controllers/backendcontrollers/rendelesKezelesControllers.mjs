import mongoose from 'mongoose';
import RendelesModel, { FIZETESI_ALLAPOTOK, RENDELES_ALLAPOTOK, fizetesPotolhato, kovetkezoAllapotok } from '../../models/Rendeles.mjs';
import { fuggoFizetesLezarasa } from '../frontendcontrollers/stripeFizetesControllers.mjs';
import { allapotErtesites, hatterben } from '../../utils/ertesitesek.mjs';
import { keszletVisszaadas } from '../../utils/keszlet.mjs';
import { rendelesValasz } from '../../utils/rendelesFormazas.mjs';

const OLDALMERET = 20;
const MAX_KERESES_HOSSZ = 100;
const MAX_MEGJEGYZES_HOSSZ = 300;

// Átutalásos, még ki nem fizetett rendelés. A régi rendeléseknél a fizetési mód hiányozhat
// (alapértéke átutalás; a null a hiányzót is lefedi), az állapot pedig régi értékű is lehet.
const ATUTALASRA_VAR = {
    fizetesiMod: { $in: ['atutalas', null] },
    fizetesiAllapot: { $ne: 'fizetve' },
};

// Fizetési állapot szerinti szűrés (a dashboard linkjeihez).
const fizetesSzuro = (fizetes) => (fizetes === 'atutalasra_var' ? ATUTALASRA_VAR : { fizetesiAllapot: fizetes });

const regexEscape = (szoveg) => szoveg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const keresesiFeltetel = (kereses) => {
    const minta = regexEscape(kereses);
    return {
        $or: [
            { teljesNev: { $regex: minta, $options: 'i' } },
            { email: { $regex: minta, $options: 'i' } },
            { telefon: { $regex: minta, $options: 'i' } },
            { 'szallitasiAdatok.telepules': { $regex: minta, $options: 'i' } },
            // A felületen a rövid (utolsó 6 karakteres) azonosító látszik, arra is lehet keresni.
            { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: minta, options: 'i' } } },
        ],
    };
};

const getRendelesek = async (req, res) => {
    try {
        const allapot = typeof req.query.allapot === 'string' ? req.query.allapot : 'osszes';
        if (allapot !== 'osszes' && !Object.hasOwn(RENDELES_ALLAPOTOK, allapot)) {
            return res.status(400).json({ msg: 'Érvénytelen állapotszűrő.' });
        }

        const fizetes = typeof req.query.fizetes === 'string' && req.query.fizetes ? req.query.fizetes : null;
        if (fizetes && !Object.hasOwn(FIZETESI_ALLAPOTOK, fizetes)) {
            return res.status(400).json({ msg: 'Érvénytelen fizetési szűrő.' });
        }

        const kereses = typeof req.query.kereses === 'string'
            ? req.query.kereses.trim().slice(0, MAX_KERESES_HOSSZ)
            : '';
        const kertOldal = Number.parseInt(req.query.oldal, 10);
        const oldal = Number.isInteger(kertOldal) && kertOldal > 0 ? kertOldal : 1;

        const keresesSzuro = {
            ...(kereses ? keresesiFeltetel(kereses) : {}),
            ...(fizetes ? fizetesSzuro(fizetes) : {}),
        };
        const szuro = allapot === 'osszes' ? keresesSzuro : { ...keresesSzuro, allapot };

        const [rendelesek, talalatok, allapotSzamok] = await Promise.all([
            RendelesModel.find(szuro)
                .sort({ createdAt: -1 })
                .skip((oldal - 1) * OLDALMERET)
                .limit(OLDALMERET)
                .lean(),
            RendelesModel.countDocuments(szuro),
            // A fülek számlálói a keresésre és a fizetési szűrőre igen, az állapotszűrőre nem szűkülnek.
            RendelesModel.aggregate([
                { $match: keresesSzuro },
                { $group: { _id: '$allapot', db: { $sum: 1 } } },
            ]),
        ]);

        const szamok = Object.fromEntries(Object.keys(RENDELES_ALLAPOTOK).map((kulcs) => [kulcs, 0]));
        for (const sor of allapotSzamok) {
            if (Object.hasOwn(szamok, sor._id)) szamok[sor._id] = sor.db;
        }
        szamok.osszes = Object.values(szamok).reduce((osszeg, db) => osszeg + db, 0);

        return res.status(200).json({
            rendelesek: rendelesek.map((rendeles) => rendelesValasz(rendeles, { admin: true })),
            talalatok,
            oldal,
            oldalak: Math.max(1, Math.ceil(talalatok / OLDALMERET)),
            allapotSzamok: szamok,
            allapotok: Object.entries(RENDELES_ALLAPOTOK).map(([kulcs, cimke]) => ({ allapot: kulcs, cimke })),
        });
    } catch (error) {
        console.error('Rendeléslista-hiba:', error);
        return res.status(500).json({ msg: 'A rendeléseket most nem sikerült betölteni.' });
    }
};

const patchRendelesAllapot = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(404).json({ msg: 'A rendelés nem található.' });
        }

        const ujAllapot = req.body?.allapot;
        const megjegyzes = typeof req.body?.megjegyzes === 'string'
            ? req.body.megjegyzes.trim().slice(0, MAX_MEGJEGYZES_HOSSZ)
            : '';
        if (!Object.hasOwn(RENDELES_ALLAPOTOK, ujAllapot)) {
            return res.status(400).json({ msg: 'Érvénytelen állapot.' });
        }

        const rendeles = await RendelesModel.findById(id).lean();
        if (!rendeles) {
            return res.status(404).json({ msg: 'A rendelés nem található.' });
        }

        if (!kovetkezoAllapotok(rendeles.allapot, rendeles.atvetelModja).includes(ujAllapot)) {
            return res.status(400).json({
                msg: `„${RENDELES_ALLAPOTOK[rendeles.allapot]}” állapotú rendelés nem állítható „${RENDELES_ALLAPOTOK[ujAllapot]}” állapotba.`,
            });
        }

        // Félbehagyott bankkártyás fizetésnél a lemondás előtt lezárjuk a Stripe fizetési
        // oldalát, különben a vevő a már lemondott (és készletre visszaírt) rendelést is kifizethetné.
        const fuggoFizetes = ujAllapot === 'lemondva' && fizetesPotolhato(rendeles);
        if (fuggoFizetes) {
            const { fizetve } = await fuggoFizetesLezarasa(rendeles);
            if (fizetve) {
                return res.status(409).json({
                    msg: 'Közben megérkezett a vevő bankkártyás fizetése. Frissítsd a listát; a kifizetett rendelés lemondásához visszatérítés kell.',
                });
            }
        }

        // Csak akkor módosítunk, ha az állapot közben nem változott (pl. egy másik
        // admin már lemondta) – így a készlet sem kerülhet vissza kétszer.
        const frissitett = await RendelesModel.findOneAndUpdate(
            { _id: id, allapot: rendeles.allapot },
            {
                $set: { allapot: ujAllapot, ...(fuggoFizetes ? { fizetesiAllapot: 'fizetes_lejart' } : {}) },
                $push: { allapotTortenet: { allapot: ujAllapot, datum: new Date(), megjegyzes } },
            },
            { returnDocument: 'after', runValidators: true, lean: true },
        );
        if (!frissitett) {
            // A fizetési oldal lezárása miatt a Stripe lejárati értesítése megelőzhetett
            // minket: a rendelést az már lemondta és a készletet is visszaírta.
            const aktualis = fuggoFizetes ? await RendelesModel.findById(id).lean() : null;
            if (aktualis?.allapot === 'lemondva') {
                return res.status(200).json({
                    msg: 'A rendelést lemondtad, a tételek visszakerültek a készletbe.',
                    rendeles: rendelesValasz(aktualis, { admin: true }),
                });
            }
            return res.status(409).json({
                msg: 'A rendelés állapotát közben valaki más módosította. Frissítsd a listát, és próbáld újra.',
            });
        }

        if (ujAllapot === 'lemondva') {
            await keszletVisszaadas(rendeles.tetelek);
        }
        hatterben(() => allapotErtesites(frissitett, megjegyzes), 'Állapotváltozás-értesítés');

        return res.status(200).json({
            msg: ujAllapot === 'lemondva'
                ? 'A rendelést lemondtad, a tételek visszakerültek a készletbe.'
                : `A rendelés új állapota: ${RENDELES_ALLAPOTOK[ujAllapot]}.`,
            rendeles: rendelesValasz(frissitett, { admin: true }),
        });
    } catch (error) {
        console.error('Rendelésállapot-módosítási hiba:', error);
        return res.status(500).json({ msg: 'Az állapotot most nem sikerült módosítani.' });
    }
};

// A vevő által visszahozott raklapok rögzítése (ennyi betétdíj jár vissza).
const patchRaklapVisszavetel = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(404).json({ msg: 'A rendelés nem található.' });
        }
        const darab = req.body?.visszahozottRaklapok;
        if (!Number.isInteger(darab) || darab < 0) {
            return res.status(400).json({ msg: 'A visszahozott raklapok száma nemnegatív egész szám legyen.' });
        }

        // Feltételes frissítés: nem rögzíthető több raklap, mint amennyit a rendelés tartalmazott.
        const frissitett = await RendelesModel.findOneAndUpdate(
            { _id: id, 'osszesites.raklapok': { $gte: darab } },
            { $set: { visszahozottRaklapok: darab } },
            { returnDocument: 'after', lean: true },
        );
        if (!frissitett) {
            const letezik = await RendelesModel.exists({ _id: id });
            return letezik
                ? res.status(400).json({ msg: 'Ennél a rendelésnél ennyi raklap nem hozható vissza.' })
                : res.status(404).json({ msg: 'A rendelés nem található.' });
        }

        const valasz = rendelesValasz(frissitett, { admin: true });
        return res.status(200).json({
            msg: `Visszavett raklapok: ${valasz.visszahozottRaklapok} / ${valasz.raklapok}, visszajáró betétdíj: ${valasz.visszajaroBetetdij.toLocaleString('hu-HU')} Ft.`,
            rendeles: valasz,
        });
    } catch (error) {
        console.error('Raklap-visszavételi hiba:', error);
        return res.status(500).json({ msg: 'A raklapok visszavételét most nem sikerült rögzíteni.' });
    }
};

// Átutalásos rendelés kifizetettnek jelölése, amikor a pénz beérkezett a bankszámlára.
// A bankkártyás fizetést a Stripe-webhook rögzíti, azt itt nem lehet kézzel módosítani.
const patchFizetesBeerkezett = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(404).json({ msg: 'A rendelés nem található.' });
        }

        const frissitett = await RendelesModel.findOneAndUpdate(
            {
                _id: id,
                allapot: { $ne: 'lemondva' },
                ...ATUTALASRA_VAR,
            },
            { $set: { fizetesiMod: 'atutalas', fizetesiAllapot: 'fizetve', fizetve: new Date() } },
            { returnDocument: 'after', lean: true },
        );
        if (!frissitett) {
            const letezik = await RendelesModel.exists({ _id: id });
            return letezik
                ? res.status(400).json({ msg: 'Ez a rendelés nem átutalásra vár (már kifizették, lemondták, vagy bankkártyás).' })
                : res.status(404).json({ msg: 'A rendelés nem található.' });
        }

        return res.status(200).json({
            msg: 'Az átutalás beérkezését rögzítetted, a rendelés kifizetett.',
            rendeles: rendelesValasz(frissitett, { admin: true }),
        });
    } catch (error) {
        console.error('Fizetésrögzítési hiba:', error);
        return res.status(500).json({ msg: 'A fizetést most nem sikerült rögzíteni.' });
    }
};

export { getRendelesek, patchRendelesAllapot, patchRaklapVisszavetel, patchFizetesBeerkezett };
