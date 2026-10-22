import TermekModel from '../../../models/Termek.mjs';

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
        const filter = search
            ? {
                  $or: [
                      { nev: createSearchRegex(search) },
                      { kategoria: createSearchRegex(search) },
                  ],
              }
            : {};
        const termekek = await TermekModel.find(filter).sort({ createdAt: -1 });

        return res.status(200).json({ termekek, search });
    } catch (error) {
        return res.status(500).json({ msg: `Hiba: ${error.message}` });
    }
};

export { getTermekek };
