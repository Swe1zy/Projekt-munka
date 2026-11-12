import mongoose from 'mongoose';
import RendelesModel, { RENDELES_ALLAPOTOK, kovetkezoAllapotok } from '../../models/Rendeles.mjs';
import { keszletVisszaadas } from '../../utils/keszlet.mjs';
import { rendelesValasz } from '../../utils/rendelesFormazas.mjs';

const OLDALMERET = 20;
const MAX_KERESES_HOSSZ = 100;
const MAX_MEGJEGYZES_HOSSZ = 300;

const regexEscape = (szoveg) => szoveg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const keresesiFeltetel = (kereses) => {
    const minta = regexEscape(kereses);
    return {
        $or: [
            { teljesNev: { $regex: minta, $options: 'i' } },
            { email: { $regex: minta, $options: 'i' } },
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

        const kereses = typeof req.query.kereses === 'string'
            ? req.query.kereses.trim().slice(0, MAX_KERESES_HOSSZ)
            : '';
        const kertOldal = Number.parseInt(req.query.oldal, 10);
        const oldal = Number.isInteger(kertOldal) && kertOldal > 0 ? kertOldal : 1;

        const keresesSzuro = kereses ? keresesiFeltetel(kereses) : {};
        const szuro = allapot === 'osszes' ? keresesSzuro : { ...keresesSzuro, allapot };

        const [rendelesek, talalatok, allapotSzamok] = await Promise.all([
            RendelesModel.find(szuro)
                .sort({ createdAt: -1 })
                .skip((oldal - 1) * OLDALMERET)
                .limit(OLDALMERET)
                .lean(),
            RendelesModel.countDocuments(szuro),
            // A fülek számlálói a keresésre igen, az állapotszűrőre nem szűkülnek.
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

        // Csak akkor módosítunk, ha az állapot közben nem változott (pl. egy másik
        // admin már lemondta) – így a készlet sem kerülhet vissza kétszer.
        const frissitett = await RendelesModel.findOneAndUpdate(
            { _id: id, allapot: rendeles.allapot },
            {
                $set: { allapot: ujAllapot },
                $push: { allapotTortenet: { allapot: ujAllapot, datum: new Date(), megjegyzes } },
            },
            { returnDocument: 'after', runValidators: true, lean: true },
        );
        if (!frissitett) {
            return res.status(409).json({
                msg: 'A rendelés állapotát közben valaki más módosította. Frissítsd a listát, és próbáld újra.',
            });
        }

        if (ujAllapot === 'lemondva') {
            await keszletVisszaadas(rendeles.tetelek);
        }

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

export { getRendelesek, patchRendelesAllapot, patchRaklapVisszavetel };
