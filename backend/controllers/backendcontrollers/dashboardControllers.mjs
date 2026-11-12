import RendelesModel, { ATVETELI_MODOK, RENDELES_ALLAPOTOK } from '../../models/Rendeles.mjs';
import TermekModel from '../../models/Termek.mjs';
import UserModel from '../../models/User.mjs';
import ArajanlatModel from '../../models/Arajanlat.mjs';
import { KESZLET_RIASZTASI_KUSZOB } from '../../config/uzlet.mjs';
import { rovidAzonosito } from '../../utils/rendelesFormazas.mjs';

// A lemondott rendelések nem számítanak bele a bevételbe és a statisztikákba.
export const ERVENYES_RENDELES = { allapot: { $ne: 'lemondva' } };
// Bevétel = a vevő által fizetett végösszeg a visszajáró raklap-betétdíj nélkül.
export const BEVETEL = { $subtract: ['$vegosszeg', { $ifNull: ['$osszesites.raklapBetetdij', 0] }] };

// Minden dátumot magyar idő szerint csoportosítunk, hogy a napi/havi bontás
// a bolt naptári napjaihoz igazodjon (nem az UTC-éjfélhez).
export const IDOZONA = 'Europe/Budapest';
const NAP_MS = 24 * 60 * 60 * 1000;
const ALACSONY_KESZLET_KUSZOB = KESZLET_RIASZTASI_KUSZOB;

export const IDOSZAKOK = {
    '7nap': { cimke: 'Utolsó 7 nap', bontas: 'nap', napok: 7 },
    '30nap': { cimke: 'Utolsó 30 nap', bontas: 'nap', napok: 30 },
    '90nap': { cimke: 'Utolsó 90 nap', bontas: 'nap', napok: 90 },
    '12honap': { cimke: 'Utolsó 12 hónap', bontas: 'honap', honapok: 12 },
};
const ALAP_IDOSZAK = '30nap';

const VEVO_TIPUSOK = {
    maganszemely: 'Magánszemély',
    ceg: 'Cég',
};

const idoFormazo = new Intl.DateTimeFormat('en-US', {
    timeZone: IDOZONA,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
});

const budapestiReszek = (datum) => {
    const reszek = {};
    for (const { type, value } of idoFormazo.formatToParts(datum)) {
        if (type !== 'literal') reszek[type] = Number(value);
    }
    return reszek;
};

const ketJegy = (szam) => String(szam).padStart(2, '0');

const napKulcs = (datum) => {
    const { year, month, day } = budapestiReszek(datum);
    return `${year}-${ketJegy(month)}-${ketJegy(day)}`;
};

// A magyar idő eltérése az UTC-től (téli/nyári időszámítás szerint 1 vagy 2 óra).
const idozonaEltolasMs = (datum) => {
    const r = budapestiReszek(datum);
    const helyiMintUtc = Date.UTC(r.year, r.month - 1, r.day, r.hour, r.minute, r.second);
    return helyiMintUtc - Math.floor(datum.getTime() / 1000) * 1000;
};

// Az adott magyar naptári nap éjfele UTC-időpontként. A hónap/nap túlcsordulhat
// (pl. nap = -5), ezt a Date.UTC helyesen visszaszámolja.
const budapestiEjfel = (ev, honap, nap) => {
    const utcEjfel = Date.UTC(ev, honap - 1, nap);
    return new Date(utcEjfel - idozonaEltolasMs(new Date(utcEjfel)));
};

export const idoszakHatarai = (idoszak, most) => {
    const { year, month, day } = budapestiReszek(most);
    const kezdet = idoszak.bontas === 'honap'
        ? budapestiEjfel(year, month - (idoszak.honapok - 1), 1)
        : budapestiEjfel(year, month, day - (idoszak.napok - 1));
    // Az összehasonlító időszak pontosan ugyanolyan hosszú, közvetlenül előtte.
    const elozoKezdet = new Date(kezdet.getTime() - (most.getTime() - kezdet.getTime()));
    return { kezdet, elozoKezdet };
};

export const idosorKulcsok = (idoszak, kezdet, most) => {
    if (idoszak.bontas === 'honap') {
        const { year, month } = budapestiReszek(most);
        return Array.from({ length: idoszak.honapok }, (_, index) => {
            const datum = new Date(Date.UTC(year, month - idoszak.honapok + index, 1));
            return `${datum.getUTCFullYear()}-${ketJegy(datum.getUTCMonth() + 1)}`;
        });
    }
    // Napközepre lépünk, így az óraátállítás sem csúsztat át szomszédos napra.
    return Array.from({ length: idoszak.napok }, (_, index) =>
        napKulcs(new Date(kezdet.getTime() + index * NAP_MS + NAP_MS / 2)));
};

const kerekit = (ertek) => Math.round((Number(ertek) || 0) * 100) / 100;

const valtozas = (aktualis, elozo) => {
    if (!elozo) return null;
    return Math.round(((aktualis - elozo) / elozo) * 1000) / 10;
};

const mutato = (aktualis, elozo) => ({
    ertek: kerekit(aktualis),
    elozo: kerekit(elozo),
    valtozas: valtozas(aktualis, elozo),
});

const tetelBevetel = { $multiply: ['$tetelek.mennyiseg', '$tetelek.egysegar'] };

const osszesitoCsoport = {
    $group: {
        _id: null,
        bevetel: { $sum: BEVETEL },
        rendelesek: { $sum: 1 },
        vasarlok: { $addToSet: '$email' },
    },
};

// Egyetlen lekérdezés számolja ki az időszak összes rendelési statisztikáját.
export const rendelesPipeline = ({ kezdet, elozoKezdet, idoszak }) => {
    const aktualisSzures = { $match: { createdAt: { $gte: kezdet } } };
    const datumFormatum = idoszak.bontas === 'honap' ? '%Y-%m' : '%Y-%m-%d';

    return [
        { $match: { createdAt: { $gte: elozoKezdet }, ...ERVENYES_RENDELES } },
        { $sort: { createdAt: 1 } },
        {
            $facet: {
                aktualis: [aktualisSzures, osszesitoCsoport],
                elozo: [{ $match: { createdAt: { $lt: kezdet } } }, osszesitoCsoport],
                idosor: [
                    aktualisSzures,
                    {
                        $group: {
                            _id: {
                                $dateToString: { format: datumFormatum, date: '$createdAt', timezone: IDOZONA },
                            },
                            bevetel: { $sum: BEVETEL },
                            rendelesek: { $sum: 1 },
                        },
                    },
                ],
                topTermekek: [
                    aktualisSzures,
                    { $unwind: '$tetelek' },
                    {
                        $group: {
                            _id: '$tetelek.termekId',
                            nev: { $last: '$tetelek.nev' },
                            egyseg: { $last: '$tetelek.egyseg' },
                            mennyiseg: { $sum: '$tetelek.mennyiseg' },
                            rendelesek: { $sum: 1 },
                            bevetel: { $sum: tetelBevetel },
                        },
                    },
                    { $sort: { bevetel: -1, nev: 1 } },
                    { $limit: 6 },
                ],
                kategoriak: [
                    aktualisSzures,
                    { $unwind: '$tetelek' },
                    {
                        $lookup: {
                            from: TermekModel.collection.name,
                            localField: 'tetelek.termekId',
                            foreignField: '_id',
                            as: 'termek',
                        },
                    },
                    {
                        $group: {
                            _id: { $ifNull: [{ $arrayElemAt: ['$termek.kategoria', 0] }, 'Törölt termék'] },
                            bevetel: { $sum: tetelBevetel },
                            tetelek: { $sum: 1 },
                        },
                    },
                    { $sort: { bevetel: -1 } },
                ],
                atvetel: [
                    aktualisSzures,
                    { $group: { _id: '$atvetelModja', rendelesek: { $sum: 1 }, bevetel: { $sum: BEVETEL } } },
                ],
                vevoTipus: [
                    aktualisSzures,
                    {
                        $group: {
                            _id: '$szamlazasiAdatok.tipus',
                            rendelesek: { $sum: 1 },
                            bevetel: { $sum: BEVETEL },
                        },
                    },
                ],
                telepulesek: [
                    aktualisSzures,
                    { $match: { atvetelModja: 'hazhozszallitas', 'szallitasiAdatok.telepules': { $type: 'string' } } },
                    {
                        $group: {
                            _id: '$szallitasiAdatok.telepules',
                            rendelesek: { $sum: 1 },
                            bevetel: { $sum: BEVETEL },
                        },
                    },
                    { $sort: { rendelesek: -1, bevetel: -1 } },
                    { $limit: 5 },
                ],
                topVasarlok: [
                    aktualisSzures,
                    {
                        $group: {
                            _id: '$email',
                            nev: { $last: '$teljesNev' },
                            rendelesek: { $sum: 1 },
                            bevetel: { $sum: BEVETEL },
                        },
                    },
                    { $sort: { bevetel: -1 } },
                    { $limit: 5 },
                ],
            },
        },
    ];
};

const rendelesStatisztika = async (hatarok) => {
    const [eredmeny] = await RendelesModel.aggregate(rendelesPipeline(hatarok));
    return eredmeny;
};

const keszletStatisztika = async () => {
    const [eredmeny] = await TermekModel.aggregate([
        {
            $facet: {
                osszes: [
                    {
                        $group: {
                            _id: null,
                            termekek: { $sum: 1 },
                            keszletErtek: { $sum: { $multiply: ['$ar', '$keszlet'] } },
                            elfogyott: { $sum: { $cond: [{ $lte: ['$keszlet', 0] }, 1, 0] } },
                            alacsony: {
                                $sum: {
                                    $cond: [
                                        { $and: [{ $gt: ['$keszlet', 0] }, { $lte: ['$keszlet', ALACSONY_KESZLET_KUSZOB] }] },
                                        1,
                                        0,
                                    ],
                                },
                            },
                        },
                    },
                ],
                alacsonyTermekek: [
                    { $match: { keszlet: { $lte: ALACSONY_KESZLET_KUSZOB } } },
                    { $sort: { keszlet: 1, nev: 1 } },
                    { $limit: 8 },
                    { $project: { nev: 1, kategoria: 1, keszlet: 1, egyseg: 1, ar: 1 } },
                ],
            },
        },
    ]);

    const osszes = eredmeny.osszes[0] ?? { termekek: 0, keszletErtek: 0, elfogyott: 0, alacsony: 0 };
    return {
        termekek: osszes.termekek,
        keszletErtek: kerekit(osszes.keszletErtek),
        elfogyott: osszes.elfogyott,
        alacsony: osszes.alacsony,
        kuszob: ALACSONY_KESZLET_KUSZOB,
        alacsonyTermekek: eredmeny.alacsonyTermekek.map((termek) => ({
            id: termek._id,
            nev: termek.nev,
            kategoria: termek.kategoria,
            keszlet: termek.keszlet,
            egyseg: termek.egyseg,
            ar: termek.ar,
        })),
    };
};

const megoszlas = (sorok, cimkek) => {
    const osszes = sorok.reduce((osszeg, sor) => osszeg + sor.rendelesek, 0);
    return Object.entries(cimkek).map(([kulcs, cimke]) => {
        const sor = sorok.find((elem) => elem._id === kulcs);
        const rendelesek = sor?.rendelesek ?? 0;
        return {
            kulcs,
            cimke,
            rendelesek,
            bevetel: kerekit(sor?.bevetel),
            arany: osszes ? Math.round((rendelesek / osszes) * 1000) / 10 : 0,
        };
    });
};

const getDashboard = async (req, res) => {
    try {
        const idoszakKulcs = req.query.idoszak ?? ALAP_IDOSZAK;
        if (typeof idoszakKulcs !== 'string' || !Object.hasOwn(IDOSZAKOK, idoszakKulcs)) {
            return res.status(400).json({
                msg: `Érvénytelen időszak. Lehetséges értékek: ${Object.keys(IDOSZAKOK).join(', ')}.`,
            });
        }

        const idoszak = IDOSZAKOK[idoszakKulcs];
        const most = new Date();
        const { kezdet, elozoKezdet } = idoszakHatarai(idoszak, most);

        const [
            rendelesek, keszlet, mindenkori, legutobbi, felhasznalok, ujFelhasznalok, elozoUjFelhasznalok,
            lemondottak, allapotSzamok, ujArajanlatok,
        ] =
            await Promise.all([
                rendelesStatisztika({ kezdet, elozoKezdet, idoszak }),
                keszletStatisztika(),
                RendelesModel.aggregate([
                    { $match: ERVENYES_RENDELES },
                    { $group: { _id: null, bevetel: { $sum: BEVETEL }, rendelesek: { $sum: 1 } } },
                ]),
                RendelesModel.find({})
                    .sort({ createdAt: -1 })
                    .limit(8)
                    .select('teljesNev email vegosszeg atvetelModja tetelek allapot createdAt')
                    .lean(),
                UserModel.countDocuments({ role: 'user' }),
                UserModel.countDocuments({ role: 'user', createdAt: { $gte: kezdet } }),
                UserModel.countDocuments({ role: 'user', createdAt: { $gte: elozoKezdet, $lt: kezdet } }),
                RendelesModel.aggregate([
                    { $match: { createdAt: { $gte: kezdet }, allapot: 'lemondva' } },
                    { $group: { _id: null, rendelesek: { $sum: 1 }, ertek: { $sum: BEVETEL } } },
                ]),
                RendelesModel.aggregate([{ $group: { _id: '$allapot', db: { $sum: 1 } } }]),
                ArajanlatModel.countDocuments({ allapot: 'uj' }),
            ]);

        const rendelesAllapotok = Object.fromEntries(Object.keys(RENDELES_ALLAPOTOK).map((kulcs) => [kulcs, 0]));
        for (const sor of allapotSzamok) {
            if (Object.hasOwn(rendelesAllapotok, sor._id)) rendelesAllapotok[sor._id] = sor.db;
        }

        const aktualis = rendelesek.aktualis[0] ?? { bevetel: 0, rendelesek: 0, vasarlok: [] };
        const elozo = rendelesek.elozo[0] ?? { bevetel: 0, rendelesek: 0, vasarlok: [] };
        const atlag = (adat) => (adat.rendelesek ? adat.bevetel / adat.rendelesek : 0);

        const idosorAdatok = new Map(rendelesek.idosor.map((sor) => [sor._id, sor]));
        const idosor = idosorKulcsok(idoszak, kezdet, most).map((kulcs) => ({
            kulcs,
            bevetel: kerekit(idosorAdatok.get(kulcs)?.bevetel),
            rendelesek: idosorAdatok.get(kulcs)?.rendelesek ?? 0,
        }));

        return res.status(200).json({
            idoszak: {
                kulcs: idoszakKulcs,
                cimke: idoszak.cimke,
                bontas: idoszak.bontas,
                kezdet,
                veg: most,
                elozoKezdet,
            },
            elerhetoIdoszakok: Object.entries(IDOSZAKOK).map(([kulcs, { cimke }]) => ({ kulcs, cimke })),
            osszegzes: {
                bevetel: mutato(aktualis.bevetel, elozo.bevetel),
                rendelesek: mutato(aktualis.rendelesek, elozo.rendelesek),
                atlagosKosar: mutato(atlag(aktualis), atlag(elozo)),
                vasarlok: mutato(aktualis.vasarlok.length, elozo.vasarlok.length),
                ujFelhasznalok: mutato(ujFelhasznalok, elozoUjFelhasznalok),
                lemondott: {
                    rendelesek: lemondottak[0]?.rendelesek ?? 0,
                    ertek: kerekit(lemondottak[0]?.ertek),
                },
            },
            rendelesAllapotok,
            ujArajanlatok,
            mindenkori: {
                bevetel: kerekit(mindenkori[0]?.bevetel),
                rendelesek: mindenkori[0]?.rendelesek ?? 0,
                felhasznalok,
            },
            idosor,
            topTermekek: rendelesek.topTermekek.map((termek) => ({
                termekId: termek._id,
                nev: termek.nev,
                egyseg: termek.egyseg,
                mennyiseg: kerekit(termek.mennyiseg),
                rendelesek: termek.rendelesek,
                bevetel: kerekit(termek.bevetel),
            })),
            kategoriak: rendelesek.kategoriak.map((sor) => ({
                kategoria: sor._id,
                bevetel: kerekit(sor.bevetel),
                tetelek: sor.tetelek,
            })),
            atvetelModok: megoszlas(rendelesek.atvetel, ATVETELI_MODOK),
            vevoTipusok: megoszlas(rendelesek.vevoTipus, VEVO_TIPUSOK),
            telepulesek: rendelesek.telepulesek.map((sor) => ({
                telepules: sor._id,
                rendelesek: sor.rendelesek,
                bevetel: kerekit(sor.bevetel),
            })),
            topVasarlok: rendelesek.topVasarlok.map((sor) => ({
                email: sor._id,
                nev: sor.nev,
                rendelesek: sor.rendelesek,
                bevetel: kerekit(sor.bevetel),
            })),
            legutobbiRendelesek: legutobbi.map((rendeles) => ({
                id: rendeles._id,
                rovidAzonosito: rovidAzonosito(rendeles._id),
                nev: rendeles.teljesNev,
                email: rendeles.email,
                vegosszeg: kerekit(rendeles.vegosszeg),
                atvetelModja: ATVETELI_MODOK[rendeles.atvetelModja] ?? rendeles.atvetelModja,
                tetelSzam: rendeles.tetelek?.length ?? 0,
                allapot: rendeles.allapot,
                allapotCimke: RENDELES_ALLAPOTOK[rendeles.allapot] ?? rendeles.allapot,
                datum: rendeles.createdAt,
            })),
            keszlet,
            generalva: most,
        });
    } catch (error) {
        console.error('Dashboard-hiba:', error);
        return res.status(500).json({ msg: 'A dashboard adatait most nem sikerült betölteni.' });
    }
};

export { getDashboard };
