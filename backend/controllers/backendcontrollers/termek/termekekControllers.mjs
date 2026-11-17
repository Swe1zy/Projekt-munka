import mongoose from 'mongoose';
import TermekModel from '../../../models/Termek.mjs';
import { elhagyottKepek, kepekTorlese, termekKepei } from '../../../utils/cloudinary.mjs';
import { opcionalisSzamMezok } from '../../../utils/termekMezok.mjs';

const MODOSITHATO_MEZOK = ['nev', 'kategoria', 'leiras', 'kepek', 'ar', 'egyseg', 'keszlet'];

const getTermek = async (req, res) => {
    try {
        const termekek = await TermekModel.find({}).lean();
        return res.status(200).render('building/termek.ejs', { termekek });
    } catch (error) {
        console.error('Terméklista-hiba:', error);
        return res.status(500).json({ msg: 'A terméklista betöltése nem sikerült.' });
    }
};

const deleteTermek = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedTermek = mongoose.isValidObjectId(id) ? await TermekModel.findByIdAndDelete(id).lean() : null;
        if (!deletedTermek) {
            return res.status(404).json({ msg: 'A termék nem található!' });
        }
        // A képeket csak a sikeres törlés után távolítjuk el.
        await kepekTorlese(termekKepei(deletedTermek));

        return res.status(200).json({ msg: 'A termék és a képei törlődtek!' });
    } catch (error) {
        console.error('Terméktörlési hiba:', error);
        return res.status(500).json({ msg: 'A termék törlése nem sikerült.' });
    }
};

const getOneTermek = async (req, res) => {
    try {
        const { id } = req.params;
        const termek = mongoose.isValidObjectId(id) ? await TermekModel.findById(id).lean() : null;
        if (!termek) {
            return res.status(404).send('A termék nem található!');
        }

        return res
            .status(200)
            .render('building/one-termek.ejs', { termek });
    } catch (error) {
        console.error('Termékbetöltési hiba:', error);
        return res.status(500).json({ msg: 'A termék betöltése nem sikerült.' });
    }
};

const updateOneTermek = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body ?? {};
        const aktualisTermek = mongoose.isValidObjectId(id) ? await TermekModel.findById(id).lean() : null;
        if (!aktualisTermek) {
            return res.status(404).json({ msg: 'A termék nem található!' });
        }

        // Az update-validátorokban a `this` nem a dokumentum, ezért a darabszám-szabályt itt ellenőrizzük.
        const egyseg = body.egyseg ?? aktualisTermek.egyseg;
        const keszlet = body.keszlet === undefined ? aktualisTermek.keszlet : Number(body.keszlet);
        if (egyseg === 'db' && !Number.isInteger(keszlet)) {
            return res.status(400).json({ msg: 'Darab mértékegységnél a készletnek egész számnak kell lennie.' });
        }
        if (Object.hasOwn(body, 'ar') && !(Number(body.ar) >= 0)) {
            return res.status(400).json({ msg: 'Az ár nemnegatív szám legyen.' });
        }

        const updates = {};
        for (const field of MODOSITHATO_MEZOK) {
            if (Object.hasOwn(body, field)) updates[field] = body[field];
        }
        if (Array.isArray(updates.kepek) && updates.kepek.length === 0) {
            return res.status(400).json({ msg: 'Legalább egy képet meg kell adni.' });
        }
        const opcionalis = opcionalisSzamMezok(body);
        if (opcionalis.hiba) {
            return res.status(400).json({ msg: opcionalis.hiba });
        }
        Object.assign(updates, opcionalis.beallit);
        const muvelet = { $set: updates };
        if (Object.keys(opcionalis.torol).length) muvelet.$unset = opcionalis.torol;

        const termek = await TermekModel.findByIdAndUpdate(
            id,
            muvelet,
            { returnDocument: 'after', runValidators: true, lean: true },
        );
        if (!termek) {
            return res.status(404).json({ msg: 'A termék nem található!' });
        }
        // A lecserélt képeket csak a sikeres mentés után töröljük.
        if (Object.hasOwn(updates, 'kepek')) {
            await kepekTorlese(elhagyottKepek(termekKepei(aktualisTermek), termekKepei(termek)));
        }

        return res.status(200).json({ msg: 'Sikeres termékmódosítás!' });
    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
            return res.status(400).json({ msg: 'A termék adatai érvénytelenek.' });
        }
        console.error('Termékmódosítási hiba:', error);
        return res.status(500).json({ msg: 'A termék módosítása nem sikerült.' });
    }
};

export { getTermek, deleteTermek, getOneTermek, updateOneTermek };
