import TermekModel from '../../../models/Termek.mjs';

const getTermek = async (req, res) => {
    try {
        const termekek = await TermekModel.find({});
        return res.status(200).render('building/termek.ejs', { termekek });
    } catch (error) {
        return res.status(500).json({ msg: `Hiba: ${error.message}` });
    }
};

const deleteTermek = async (req, res) => {
    try {
        const id = req.params.id;
        const deletedTermek = await TermekModel.findByIdAndDelete(id);
        if (!deletedTermek) {
            return res.status(404).json({ msg: 'A termék nem található!' });
        }

        return res.status(200).json({ msg: 'A termék és a képei törlődtek!' });
    } catch (error) {
        return res.status(500).json({ msg: `Hiba: ${error.message}` });
    }
};

const getOneTermek = async (req, res) => {
    try {
        const id = req.params.id;
        const termek = await TermekModel.findById(id);
        if (!termek) {
            return res.status(404).send('A termék nem található!');
        }

        return res
            .status(200)
            .render('building/one-termek.ejs', { termek });
    } catch (error) {
        return res.status(500).json({ msg: `Hiba: ${error.message}` });
    }
};

const updateOneTermek = async (req, res) => {
    try {
        const id = req.params.id;
        if (Object.prototype.hasOwnProperty.call(req.body, 'egyseg') || Object.prototype.hasOwnProperty.call(req.body, 'keszlet')) {
            const aktualisTermek = await TermekModel.findById(id);
            if (!aktualisTermek) {
                return res.status(404).json({ msg: 'A termék nem található!' });
            }
            const egyseg = req.body.egyseg ?? aktualisTermek.egyseg;
            const keszlet = req.body.keszlet === undefined ? aktualisTermek.keszlet : Number(req.body.keszlet);
            if (egyseg === 'db' && !Number.isInteger(keszlet)) {
                return res.status(400).json({ msg: 'Darab mértékegységnél a készletnek egész számnak kell lennie.' });
            }
        }
        const updates = {};
        for (const field of ['nev', 'kategoria', 'leiras', 'kepek', 'ar', 'egyseg', 'keszlet']) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updates[field] = req.body[field];
            }
        }
        if (!Object.prototype.hasOwnProperty.call(req.body, 'kepek')) {
            const legacyImages = ['kep1', 'kep2', 'kep3', 'kep']
                .map((field) => req.body[field])
                .filter((image) => typeof image === 'string' && image.trim());
            if (legacyImages.length) updates.kepek = legacyImages;
        }
        const termek = await TermekModel.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true },
        );
        if (!termek) {
            return res.status(404).json({ msg: 'A termék nem található!' });
        }

        return res.status(200).json({ msg: 'Sikeres termékmódosítás!' });
    } catch (error) {
        return res.status(500).json({ msg: `Hiba: ${error.message}` });
    }
};

export { getTermek, deleteTermek, getOneTermek, updateOneTermek };
