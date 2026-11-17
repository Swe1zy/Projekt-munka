import mongoose from 'mongoose';
import TermekModel from '../../../models/Termek.mjs';
import { elhagyottKepek, kepekTorlese, termekKepei } from '../../../utils/cloudinary.mjs';

const getOneTermek = async (req, res) => {
    try {
        const { id } = req.params;
        const termek = mongoose.isValidObjectId(id) ? await TermekModel.findById(id).lean() : null;
        if (!termek) {
            return res.status(404).send('A termék nem található!');
        }

        return res
            .status(200)
            .render('building/new-termek-pictures.ejs', { termek: { ...termek, kepek: termekKepei(termek) } });
    } catch (error) {
        console.error('Termékkép-oldal hiba:', error);
        return res.status(500).json({ msg: 'A termék betöltése nem sikerült.' });
    }
};

const updateOneTermek = async (req, res) => {
    try {
        const { id } = req.params;
        const kepek = req.body?.kepek;
        if (!Array.isArray(kepek) || kepek.length === 0) {
            return res.status(400).json({ msg: 'Legalább egy képet meg kell adni.' });
        }

        const regi = mongoose.isValidObjectId(id)
            ? await TermekModel.findByIdAndUpdate(id, { $set: { kepek } }, { returnDocument: 'before', lean: true })
            : null;
        if (!regi) {
            return res.status(404).json({ msg: 'A termék nem található!' });
        }
        await kepekTorlese(elhagyottKepek(termekKepei(regi), kepek));

        return res
            .status(200)
            .json({ msg: 'Sikeres termékmódosítás képfeltöltéssel!' });
    } catch (error) {
        console.error('Termékkép-módosítási hiba:', error);
        return res.status(500).json({ msg: 'A képek mentése nem sikerült.' });
    }
};

export { getOneTermek, updateOneTermek };
