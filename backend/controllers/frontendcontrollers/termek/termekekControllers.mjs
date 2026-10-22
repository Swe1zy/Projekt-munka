import TermekModel, { TERMEKEK_KATEGORIAK } from '../../../models/Termek.mjs';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createSearchRegex = (value) => {
    const accentGroups = {
        a: '[aá]',
        á: '[aá]',
        e: '[eé]',
        é: '[eé]',
        i: '[ií]',
        í: '[ií]',
        o: '[oóöő]',
        ó: '[oóöő]',
        ö: '[oóöő]',
        ő: '[oóöő]',
        u: '[uúüű]',
        ú: '[uúüű]',
        ü: '[uúüű]',
        ű: '[uúüű]',
    };
    const pattern = [...value.toLocaleLowerCase('hu-HU')]
        .map((character) => accentGroups[character] ?? escapeRegex(character))
        .join('');

    return new RegExp(pattern, 'i');
};

const getTermekek = async (req, res) => {
    try {
        const search = typeof req.query.q === 'string'
            ? req.query.q.trim().slice(0, 100)
            : '';
        const kategoriak = (Array.isArray(req.query.kategoria)
            ? req.query.kategoria
            : req.query.kategoria ? [req.query.kategoria] : [])
            .filter((kategoria) => TERMEKEK_KATEGORIAK.includes(kategoria))
            .slice(0, 6);
        const minAr = req.query.minAr === '' || req.query.minAr === undefined
            ? undefined
            : Number(req.query.minAr);
        const maxAr = req.query.maxAr === '' || req.query.maxAr === undefined
            ? undefined
            : Number(req.query.maxAr);

        if ((minAr !== undefined && (!Number.isFinite(minAr) || minAr < 0)) ||
            (maxAr !== undefined && (!Number.isFinite(maxAr) || maxAr < 0)) ||
            (minAr !== undefined && maxAr !== undefined && minAr > maxAr)) {
            return res.status(400).json({ msg: 'Érvénytelen árhatár.' });
        }

        const feltetelek = [];
        if (search) {
            feltetelek.push({
                $or: [
                    { nev: createSearchRegex(search) },
                    { kategoria: createSearchRegex(search) },
                ],
            });
        }
        if (kategoriak.length) feltetelek.push({ kategoria: { $in: kategoriak } });
        if (minAr !== undefined || maxAr !== undefined) {
            const ar = {};
            if (minAr !== undefined) ar.$gte = minAr;
            if (maxAr !== undefined) ar.$lte = maxAr;
            feltetelek.push({ ar });
        }

        const filter = feltetelek.length ? { $and: feltetelek } : {};
        const termekek = await TermekModel.find(filter).sort({ createdAt: -1 });

        return res.status(200).json({ termekek, search });
    } catch (error) {
        return res.status(500).json({ msg: `Hiba: ${error.message}` });
    }
};

export { getTermekek };
