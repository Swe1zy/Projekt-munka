import TermekModel from '../../../models/Termek.mjs';

const getOneTermek = async (req, res) => {
    try {
        const id = req.params.id;
        const termek = await TermekModel.findById({ _id: id });

        return res
            .status(200)
            .render('building/new-termek-pictures.ejs', { termek });
    } catch (error) {
        return res.status(500).json({ msg: `Hiba: ${error.msg}` });
    }
};

const updateOneTermek = async (req, res) => {
    try {
        const id = req.params.id;
        const { kepek } = req.body;
        await TermekModel.findByIdAndUpdate(
            { _id: id },
            { $set: { kepek: kepek } },
        );

        return res
            .status(200)
            .json({ msg: 'Sikeres termékmódosítás képfeltöltéssel!' });
    } catch (error) {
        return res.status(500).json({ msg: `Hiba: ${error.msg}` });
    }
};

export { getOneTermek, updateOneTermek };
