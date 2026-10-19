import TermekModel from '../../../models/Termek.mjs';

const getNewTermek = (req, res) => {
    try {
        return res.status(200).render('building/new-termek.ejs');
    } catch (error) {
        return res.status(500).json({ msg: `Hiba: ${error.msg}` });
    }
};

const postNewTermek = async (req, res) => {
    try {
        const { nev, leiras } = req.body;
        const kepek = Array.isArray(req.body.kepek) ? req.body.kepek : [];

        if (!nev || !leiras || kepek.length === 0) {
            return res
                .status(400)
                .json({ msg: 'A név, leírás és legalább egy kép megadása kötelező!' });
        }
        const newTermek = new TermekModel({ nev, leiras, kepek });
        await newTermek.save();

        return res.status(201).json({ msg: 'Létrejött az új termék!' });
    } catch (error) {
        return res.status(500).json({ msg: `Hiba: ${error.msg}` });
    }
};

export { getNewTermek, postNewTermek };
