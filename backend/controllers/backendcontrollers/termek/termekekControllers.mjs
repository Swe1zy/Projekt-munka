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
        await TermekModel.findByIdAndDelete({ _id: id });

        return res.status(200).json({ msg: 'Az termék törlődött!' });
    } catch (error) {
        return res.status(500).json({ msg: `Hiba: ${error.msg}` });
    }
};

const getOneTermek = async (req, res) => {
    try {
        const id = req.params.id;
        const termek = await TermekModel.findById({ _id: id });

        return res
            .status(200)
            .render('building/one-termek.ejs', { termek });
    } catch (error) {
        return res.status(500).json({ msg: `Hiba: ${error.msg}` });
    }
};

const updateOneTermek = async (req, res) => {
    try {
        const id = req.params.id;
        const updates = {};
        for (const field of ['nev', 'leiras', 'kepek', 'ar']) {
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
