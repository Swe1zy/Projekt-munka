import TermekModel, { TERMEK_EGYSEGEK, TERMEKEK_KATEGORIAK } from '../../../models/Termek.mjs';

const getNewTermek = (req, res) => {
    try {
        return res.status(200).render('building/new-termek.ejs');
    } catch (error) {
        return res.status(500).json({ msg: `Hiba: ${error.message}` });
    }
};

const postNewTermek = async (req, res) => {
    try {
        const { nev, leiras, kategoria, egyseg } = req.body;
        const ar = Number(req.body.ar);
        const keszlet = Number(req.body.keszlet);
        const vanAr = req.body.ar !== undefined && req.body.ar !== null && req.body.ar !== '';
        const vanKeszlet = req.body.keszlet !== undefined && req.body.keszlet !== null && req.body.keszlet !== '';
        const kepek = Array.isArray(req.body.kepek) ? req.body.kepek : [];

        if (!nev?.trim() || !leiras?.trim() || !TERMEKEK_KATEGORIAK.includes(kategoria) || !TERMEK_EGYSEGEK.includes(egyseg) || !vanAr || !Number.isFinite(ar) || ar < 0 || !vanKeszlet || !Number.isFinite(keszlet) || keszlet < 0 || kepek.length === 0) {
            return res
                .status(400)
            .json({ msg: 'A név, kategória, leírás, érvényes ár, m³ vagy m² mértékegység, készletmennyiség és legalább egy kép megadása kötelező!' });
        }
        const newTermek = new TermekModel({ nev: nev.trim(), leiras: leiras.trim(), kategoria, ar, egyseg, keszlet, kepek });
        await newTermek.save();

        return res.status(201).json({ msg: 'Létrejött az új termék!' });
    } catch (error) {
        console.error('Termékmentési hiba:', error);
        return res.status(500).json({ msg: `Termékmentési hiba: ${error.message}` });
    }
};

export { getNewTermek, postNewTermek };
