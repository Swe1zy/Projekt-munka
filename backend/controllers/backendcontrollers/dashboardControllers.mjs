import RendelesModel, { ATVETELI_MODOK, FIZETESI_MODOK, RENDELES_ALLAPOTOK } from '../../models/Rendeles.mjs';
import TermekModel from '../../models/Termek.mjs';
import UserModel from '../../models/User.mjs';
import ArajanlatModel, { ARAJANLAT_ALLAPOTOK } from '../../models/Arajanlat.mjs';
import { DIJBEKERO, KESZLET_RIASZTASI_KUSZOB, KISZALLITAS, SZALLITASI_ZONAK } from '../../config/uzlet.mjs';
import { rovidAzonosito } from '../../utils/rendelesFormazas.mjs';
import {
    IDOSZAKOK,
    IDOZONA,
    NAP_MS,
    idoszakFeldolgozas,
    idosorKulcsok,
    napEltolas,
    napKulcs,
} from '../../utils/dashboardIdoszak.mjs';

// A lemondott rendelések nem számítanak bele a bevételbe és a statisztikákba.
export const ERVENYES_RENDELES = { allapot: { $ne: 'lemondva' } };
// Bevétel = a vevő által fizetett végösszeg a visszajáró raklap-betétdíj nélkül.
export const BEVETEL = { $subtract: ['$vegosszeg', { $ifNull: ['$osszesites.raklapBetetdij', 0] }] };

const ALACSONY_KESZLET_KUSZOB = KESZLET_RIASZTASI_KUSZOB;
// Az eladási ütemet ennyi nap forgalmából számoljuk, és ennyi napon belüli
// várható kifogyásnál jelezzük a terméket akkor is, ha még a küszöb fölött van.
const UTEM_NAPOK = 30;
const KIFOGYAS_ELOREJELZES_NAP = 14;
// Egy árajánlat akkor „lett rendelés”, ha ugyanaz a vevő ennyi napon belül rendelt.
const AJANLAT_KONVERZIOS_NAP = 60;
const NYITOTT_AJANLAT = ['uj', 'folyamatban', 'megvalaszolva'];
const NYITOTT_RENDELES = ['feldolgozasra_var', 'visszaigazolva', 'kiszallitas_alatt'];
const EMAIL_HIBA_NAPOK = 30;
const LEJART_STRIPE_NAPOK = 30;
const KOZELGO_NAPOK = 7;
const KOZELGO_LIMIT = 60;

const VEVO_TIPUSOK = { maganszemely: 'Magánszemély', ceg: 'Cég' };
const FIOK_TIPUSOK = { regisztralt: 'Regisztrált fiókból', vendeg: 'Vendégként' };
const VASARLO_TIPUSOK = { uj: 'Új vásárló', visszatero: 'Visszatérő vásárló' };
const ZONA_NEVEK = Object.fromEntries(SZALLITASI_ZONAK.map((zona) => [zona.kulcs, zona.nev]));

// Átutalásos, még ki nem fizetett rendelés. A régi rendeléseknél a fizetési mód hiányozhat
// (alapértéke átutalás; a null a hiányzót is lefedi), az állapot pedig régi értékű is lehet.
const ATUTALASRA_VAR = {
    fizetesiMod: { $in: ['atutalas', null] },
    fizetesiAllapot: { $ne: 'fizetve' },
};

const kerekit = (ertek) => Math.round((Number(ertek) || 0) * 100) / 100;
const arany = (resz, egesz) => (egesz ? Math.round((resz / egesz) * 1000) / 10 : 0);

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
const ablak = (kezdet, veg) => ({ createdAt: { $gte: kezdet, $lt: veg } });

const osszesitoCsoport = {
    $group: {
        _id: null,
        bevetel: { $sum: BEVETEL },
        rendelesek: { $sum: 1 },
        vasarlok: { $addToSet: '$email' },
        kedvezmeny: { $sum: { $ifNull: ['$osszesites.kedvezmeny', 0] } },
        kedvezmenyesRendelesek: { $sum: { $cond: [{ $gt: [{ $ifNull: ['$osszesites.kedvezmeny', 0] }, 0] }, 1, 0] } },
    },
};

// Az első adott állapotba lépés óta eltelt idő a rendelés leadásától (ms), vagy null.
const elteltIdo = (allapot) => ({
    $subtract: [
        {
            $min: {
                $map: {
                    input: {
                        $filter: {
                            input: { $ifNull: ['$allapotTortenet', []] },
                            cond: { $eq: ['$$this.allapot', allapot] },
                        },
                    },
                    in: '$$this.datum',
                },
            },
        },
        '$createdAt',
    ],
});

// Egyetlen lekérdezés számolja ki az időszak összes rendelési statisztikáját.
export const rendelesPipeline = ({ kezdet, veg, osszKezdet, osszVeg, bontas }) => {
    const aktualisSzures = { $match: ablak(kezdet, veg) };
    const hazhoz = { $match: { atvetelModja: 'hazhozszallitas' } };
    const datumFormatum = bontas === 'honap' ? '%Y-%m' : '%Y-%m-%d';
    const csoportositas = (mezo) => [
        aktualisSzures,
        { $group: { _id: mezo, rendelesek: { $sum: 1 }, bevetel: { $sum: BEVETEL } } },
    ];

    return [
        { $match: { ...ERVENYES_RENDELES, $or: [ablak(kezdet, veg), ablak(osszKezdet, osszVeg)] } },
        { $sort: { createdAt: 1 } },
        {
            $facet: {
                aktualis: [aktualisSzures, osszesitoCsoport],
                elozo: [{ $match: ablak(osszKezdet, osszVeg) }, osszesitoCsoport],
                idosor: [
                    aktualisSzures,
                    {
                        $group: {
                            _id: { $dateToString: { format: datumFormatum, date: '$createdAt', timezone: IDOZONA } },
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
                atvetel: csoportositas('$atvetelModja'),
                vevoTipus: csoportositas('$szamlazasiAdatok.tipus'),
                fizetesiMod: csoportositas({ $ifNull: ['$fizetesiMod', 'atutalas'] }),
                fiok: csoportositas({ $cond: [{ $ifNull: ['$userId', false] }, 'regisztralt', 'vendeg'] }),
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
                szallitas: [
                    aktualisSzures,
                    hazhoz,
                    {
                        $group: {
                            _id: null,
                            rendelesek: { $sum: 1 },
                            sulyKg: { $sum: { $ifNull: ['$osszesites.sulyKg', 0] } },
                            szallitasiDij: { $sum: { $ifNull: ['$osszesites.szallitasiDij', 0] } },
                            fuvarok: { $sum: { $ifNull: ['$osszesites.szallitas.fuvarok', 0] } },
                            darus: { $sum: { $cond: [{ $eq: ['$osszesites.szallitas.darus', true] }, 1, 0] } },
                        },
                    },
                ],
                zonak: [
                    aktualisSzures,
                    hazhoz,
                    {
                        $group: {
                            _id: { $ifNull: ['$osszesites.szallitas.zona', 'ismeretlen'] },
                            zonaNev: { $last: '$osszesites.szallitas.zonaNev' },
                            rendelesek: { $sum: 1 },
                            szallitasiDij: { $sum: { $ifNull: ['$osszesites.szallitasiDij', 0] } },
                        },
                    },
                    { $sort: { rendelesek: -1, szallitasiDij: -1 } },
                ],
                atfutas: [
                    aktualisSzures,
                    { $project: { visszaigazolas: elteltIdo('visszaigazolva'), teljesites: elteltIdo('teljesitve') } },
                    { $group: { _id: null, visszaigazolas: { $push: '$visszaigazolas' }, teljesites: { $push: '$teljesites' } } },
                ],
                hoterkep: [
                    aktualisSzures,
                    {
                        $group: {
                            _id: {
                                nap: { $dayOfWeek: { date: '$createdAt', timezone: IDOZONA } },
                                ora: { $hour: { date: '$createdAt', timezone: IDOZONA } },
                            },
                            db: { $sum: 1 },
                        },
                    },
                ],
            },
        },
    ];
};

const rendelesStatisztika = async (hatarok) => {
    const [eredmeny] = await RendelesModel.aggregate(rendelesPipeline(hatarok));
    return eredmeny;
};

// A lemondott rendelések száma és értéke a lekérdezett és az összehasonlító időszakban.
// (Hosszú egyedi időszaknál a tavalyi összevetés átfedhet, ezért külön ágak számolják.)
const lemondasStatisztika = async ({ kezdet, veg, osszKezdet, osszVeg }) => {
    const csoport = { $group: { _id: null, rendelesek: { $sum: 1 }, ertek: { $sum: BEVETEL } } };
    const [eredmeny] = await RendelesModel.aggregate([
        { $match: { allapot: 'lemondva', $or: [ablak(kezdet, veg), ablak(osszKezdet, osszVeg)] } },
        {
            $facet: {
                aktualis: [{ $match: ablak(kezdet, veg) }, csoport],
                elozo: [{ $match: ablak(osszKezdet, osszVeg) }, csoport],
            },
        },
    ]);
    const ures = { rendelesek: 0, ertek: 0 };
    return {
        aktualis: eredmeny.aktualis[0] ?? ures,
        elozo: eredmeny.elozo[0] ?? ures,
    };
};

// Az időszak vásárlói: új (ekkor rendelt először) vagy visszatérő (korábban is rendelt).
const vasarloStatisztika = ({ kezdet, veg }) => {
    const idoszakban = { $gte: ['$createdAt', kezdet] };
    return RendelesModel.aggregate([
        { $match: { ...ERVENYES_RENDELES, createdAt: { $lt: veg } } },
        {
            $group: {
                _id: '$email',
                elso: { $min: '$createdAt' },
                rendelesek: { $sum: { $cond: [idoszakban, 1, 0] } },
                bevetel: { $sum: { $cond: [idoszakban, BEVETEL, 0] } },
            },
        },
        { $match: { rendelesek: { $gt: 0 } } },
        {
            $group: {
                _id: { $cond: [{ $lt: ['$elso', kezdet] }, 'visszatero', 'uj'] },
                db: { $sum: 1 },
                rendelesek: { $sum: '$rendelesek' },
                bevetel: { $sum: '$bevetel' },
            },
        },
    ]);
};

// Árajánlatok az időszakban: állapot szerint, és hogy lett-e belőlük rendelés
// (ugyanattól a vevőtől – e-mail vagy fiók alapján – az ajánlatkérés után AJANLAT_KONVERZIOS_NAP napon belül).
const arajanlatStatisztika = async ({ kezdet, veg }) => {
    const [eredmeny] = await ArajanlatModel.aggregate([
        {
            $facet: {
                idoszak: [
                    { $match: ablak(kezdet, veg) },
                    {
                        $lookup: {
                            from: RendelesModel.collection.name,
                            let: { email: '$email', userId: { $ifNull: ['$userId', null] }, datum: '$createdAt' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $ne: ['$allapot', 'lemondva'] },
                                                { $gte: ['$createdAt', '$$datum'] },
                                                { $lte: ['$createdAt', { $add: ['$$datum', AJANLAT_KONVERZIOS_NAP * NAP_MS] }] },
                                                {
                                                    $or: [
                                                        { $eq: ['$email', '$$email'] },
                                                        { $and: [{ $ne: ['$$userId', null] }, { $eq: ['$userId', '$$userId'] }] },
                                                    ],
                                                },
                                            ],
                                        },
                                    },
                                },
                                { $sort: { createdAt: 1 } },
                                { $limit: 1 },
                                { $project: { bevetel: BEVETEL } },
                            ],
                            as: 'rendeles',
                        },
                    },
                    {
                        $group: {
                            _id: '$allapot',
                            db: { $sum: 1 },
                            listaOsszeg: { $sum: '$listaOsszeg' },
                            rendelesLett: { $sum: { $cond: [{ $gt: [{ $size: '$rendeles' }, 0] }, 1, 0] } },
                            rendelesBevetel: { $sum: { $ifNull: [{ $arrayElemAt: ['$rendeles.bevetel', 0] }, 0] } },
                        },
                    },
                ],
                nyitott: [
                    { $match: { allapot: { $in: NYITOTT_AJANLAT } } },
                    { $group: { _id: null, db: { $sum: 1 }, listaOsszeg: { $sum: '$listaOsszeg' } } },
                ],
            },
        },
    ]);

    const osszes = eredmeny.idoszak.reduce(
        (osszeg, sor) => ({
            db: osszeg.db + sor.db,
            listaOsszeg: osszeg.listaOsszeg + sor.listaOsszeg,
            rendelesLett: osszeg.rendelesLett + sor.rendelesLett,
            rendelesBevetel: osszeg.rendelesBevetel + sor.rendelesBevetel,
        }),
        { db: 0, listaOsszeg: 0, rendelesLett: 0, rendelesBevetel: 0 },
    );

    return {
        ajanlatok: osszes.db,
        listaOsszeg: kerekit(osszes.listaOsszeg),
        rendelesLett: osszes.rendelesLett,
        konverzio: arany(osszes.rendelesLett, osszes.db),
        rendelesBevetel: kerekit(osszes.rendelesBevetel),
        konverziosNapok: AJANLAT_KONVERZIOS_NAP,
        allapotok: Object.entries(ARAJANLAT_ALLAPOTOK).map(([kulcs, cimke]) => ({
            kulcs,
            cimke,
            db: eredmeny.idoszak.find((sor) => sor._id === kulcs)?.db ?? 0,
        })),
        nyitott: {
            db: eredmeny.nyitott[0]?.db ?? 0,
            listaOsszeg: kerekit(eredmeny.nyitott[0]?.listaOsszeg),
        },
    };
};

const idotartamStatisztika = (ertekek = []) => {
    const lista = ertekek.filter((ertek) => typeof ertek === 'number' && ertek >= 0).sort((a, b) => a - b);
    if (!lista.length) return { db: 0, atlagMs: null, medianMs: null };
    const kozep = Math.floor(lista.length / 2);
    return {
        db: lista.length,
        atlagMs: Math.round(lista.reduce((osszeg, ertek) => osszeg + ertek, 0) / lista.length),
        medianMs: lista.length % 2 ? lista[kozep] : Math.round((lista[kozep - 1] + lista[kozep]) / 2),
    };
};

// Hét × 24 óra mátrix, hétfővel kezdve (a MongoDB $dayOfWeek 1 = vasárnap … 7 = szombat).
const hoterkepMatrix = (sorok) => {
    const napok = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const { _id, db } of sorok) napok[(_id.nap + 5) % 7][_id.ora] = db;
    return { napok, max: Math.max(0, ...napok.flat()) };
};

/**
 * Készlet: összesítés, fogyóban lévő termékek az eladási ütem alapján várható
 * kifogyással, és az időszakban egyszer sem eladott (pénzt kötő) termékek.
 */
const keszletStatisztika = async ({ kezdet, veg, most }) => {
    const [termekek, utemSorok, eladottIdk] = await Promise.all([
        TermekModel.find({}).select('nev kategoria keszlet egyseg ar createdAt').lean(),
        RendelesModel.aggregate([
            { $match: { ...ERVENYES_RENDELES, createdAt: { $gte: new Date(most.getTime() - UTEM_NAPOK * NAP_MS) } } },
            { $unwind: '$tetelek' },
            { $group: { _id: '$tetelek.termekId', mennyiseg: { $sum: '$tetelek.mennyiseg' } } },
        ]),
        RendelesModel.distinct('tetelek.termekId', { ...ERVENYES_RENDELES, ...ablak(kezdet, veg) }),
    ]);

    const utemek = new Map(utemSorok.map((sor) => [String(sor._id), sor.mennyiseg / UTEM_NAPOK]));
    const eladott = new Set(eladottIdk.map(String));

    const elemzett = termekek.map((termek) => {
        const napiUtem = utemek.get(String(termek._id)) ?? 0;
        const keszlet = Number(termek.keszlet) || 0;
        const elegNap = napiUtem > 0 ? Math.max(0, keszlet / napiUtem) : null;
        let allapot = 'rendben';
        if (keszlet <= 0) allapot = 'elfogyott';
        else if (keszlet <= ALACSONY_KESZLET_KUSZOB) allapot = 'alacsony';
        else if (elegNap !== null && elegNap <= KIFOGYAS_ELOREJELZES_NAP) allapot = 'hamarosan';
        return { termek, keszlet, napiUtem, elegNap, allapot };
    });

    const sorrend = { elfogyott: 0, alacsony: 1, hamarosan: 1 };
    const fogyo = elemzett
        .filter((elem) => elem.allapot !== 'rendben')
        .sort((a, b) => (sorrend[a.allapot] - sorrend[b.allapot])
            || ((a.elegNap ?? Infinity) - (b.elegNap ?? Infinity))
            || (a.keszlet - b.keszlet)
            || a.termek.nev.localeCompare(b.termek.nev, 'hu'));

    const nemFogyoOsszes = elemzett
        .filter(({ termek, keszlet }) => keszlet > 0
            && !eladott.has(String(termek._id))
            // Az időszak közben felvett termék még nem is fogyhatott.
            && !(termek.createdAt && termek.createdAt >= kezdet))
        .map(({ termek, keszlet }) => ({ termek, keszlet, ertek: (Number(termek.ar) || 0) * keszlet }))
        .sort((a, b) => b.ertek - a.ertek);
    const nemFogyoLista = nemFogyoOsszes.slice(0, 8);

    const utolsoEladasok = nemFogyoLista.length
        ? await RendelesModel.aggregate([
            { $match: { ...ERVENYES_RENDELES, 'tetelek.termekId': { $in: nemFogyoLista.map(({ termek }) => termek._id) } } },
            { $unwind: '$tetelek' },
            { $group: { _id: '$tetelek.termekId', utolso: { $max: '$createdAt' } } },
        ])
        : [];
    const utolso = new Map(utolsoEladasok.map((sor) => [String(sor._id), sor.utolso]));

    return {
        keszlet: {
            termekek: termekek.length,
            keszletErtek: kerekit(elemzett.reduce((osszeg, { termek, keszlet }) => osszeg + (Number(termek.ar) || 0) * keszlet, 0)),
            elfogyott: elemzett.filter((elem) => elem.allapot === 'elfogyott').length,
            alacsony: elemzett.filter((elem) => elem.allapot === 'alacsony').length,
            hamarosan: elemzett.filter((elem) => elem.allapot === 'hamarosan').length,
            kuszob: ALACSONY_KESZLET_KUSZOB,
            utemNapok: UTEM_NAPOK,
            elorejelzesNapok: KIFOGYAS_ELOREJELZES_NAP,
            alacsonyTermekek: fogyo.slice(0, 10).map(({ termek, keszlet, napiUtem, elegNap, allapot }) => ({
                id: termek._id,
                nev: termek.nev,
                kategoria: termek.kategoria,
                keszlet,
                egyseg: termek.egyseg,
                ar: termek.ar,
                allapot,
                napiUtem: kerekit(napiUtem),
                elegNap: elegNap === null ? null : Math.round(elegNap * 10) / 10,
            })),
        },
        nemFogyo: {
            db: nemFogyoOsszes.length,
            ertek: kerekit(nemFogyoOsszes.reduce((osszeg, elem) => osszeg + elem.ertek, 0)),
            termekek: nemFogyoLista.map(({ termek, keszlet, ertek }) => ({
                id: termek._id,
                nev: termek.nev,
                kategoria: termek.kategoria,
                keszlet,
                egyseg: termek.egyseg,
                ertek: kerekit(ertek),
                utolsoEladas: utolso.get(String(termek._id)) ?? null,
            })),
        },
    };
};

// A következő napok kiszállításai és átvételei, a lejárt (még nyitott) napúakkal együtt.
const kozelgoAtvetelek = async (most) => {
    const ma = napKulcs(most);
    const hetVege = napEltolas(ma, KOZELGO_NAPOK - 1);
    const rendelesek = await RendelesModel.find({
        allapot: { $in: NYITOTT_RENDELES },
        atvetelNapja: { $type: 'string', $lte: hetVege },
    })
        .sort({ atvetelNapja: 1, idosav: 1, createdAt: 1 })
        .limit(KOZELGO_LIMIT + 1)
        .select('teljesNev atvetelModja atvetelNapja idosav szallitasiAdatok vegosszeg tetelek osszesites allapot fizetesiAllapot createdAt')
        .lean();

    return {
        ma,
        holnap: napEltolas(ma, 1),
        hetVege,
        tobb: rendelesek.length > KOZELGO_LIMIT,
        rendelesek: rendelesek.slice(0, KOZELGO_LIMIT).map((rendeles) => ({
            id: rendeles._id,
            rovidAzonosito: rovidAzonosito(rendeles._id),
            nev: rendeles.teljesNev,
            nap: rendeles.atvetelNapja,
            atvetelModja: rendeles.atvetelModja,
            atvetelCimke: ATVETELI_MODOK[rendeles.atvetelModja] ?? rendeles.atvetelModja,
            idosavCimke: KISZALLITAS.idosavok.find((sav) => sav.kulcs === rendeles.idosav)?.cimke ?? null,
            telepules: rendeles.szallitasiAdatok?.telepules ?? null,
            vegosszeg: kerekit(rendeles.vegosszeg),
            tetelSzam: rendeles.tetelek?.length ?? 0,
            sulyKg: kerekit(rendeles.osszesites?.sulyKg),
            raklapok: rendeles.osszesites?.raklapok ?? 0,
            jarmu: rendeles.osszesites?.szallitas?.jarmu ?? null,
            darus: Boolean(rendeles.osszesites?.szallitas?.darus),
            allapot: rendeles.allapot,
            allapotCimke: RENDELES_ALLAPOTOK[rendeles.allapot] ?? rendeles.allapot,
            fizetve: rendeles.fizetesiAllapot === 'fizetve',
        })),
    };
};

// Fizetésre váró rendelések: beérkezetlen átutalások, lejárt kártyás fizetések,
// és a már teljesített, de ki nem fizetett rendelések.
const fizetesStatisztika = async (most) => {
    const hataridoElott = new Date(most.getTime() - DIJBEKERO.fizetesiHataridoNap * NAP_MS);
    const osszesites = { $group: { _id: null, db: { $sum: 1 }, osszeg: { $sum: '$vegosszeg' } } };
    const teljesitveFizetetlen = { allapot: 'teljesitve', fizetesiAllapot: { $ne: 'fizetve' } };
    const [eredmeny] = await RendelesModel.aggregate([
        {
            $facet: {
                atutalas: [
                    { $match: { ...ATUTALASRA_VAR, allapot: { $ne: 'lemondva' } } },
                    {
                        $group: {
                            _id: null,
                            db: { $sum: 1 },
                            osszeg: { $sum: '$vegosszeg' },
                            lejart: { $sum: { $cond: [{ $lt: ['$createdAt', hataridoElott] }, 1, 0] } },
                            lejartOsszeg: { $sum: { $cond: [{ $lt: ['$createdAt', hataridoElott] }, '$vegosszeg', 0] } },
                        },
                    },
                ],
                stripeLejart: [
                    { $match: { fizetesiAllapot: 'fizetes_lejart', createdAt: { $gte: new Date(most.getTime() - LEJART_STRIPE_NAPOK * NAP_MS) } } },
                    osszesites,
                ],
                teljesitveOsszes: [{ $match: teljesitveFizetetlen }, osszesites],
                teljesitveLista: [
                    { $match: teljesitveFizetetlen },
                    { $sort: { createdAt: 1 } },
                    { $limit: 5 },
                    { $project: { teljesNev: 1, email: 1, vegosszeg: 1, createdAt: 1, fizetesiMod: 1 } },
                ],
            },
        },
    ]);

    const atutalas = eredmeny.atutalas[0] ?? { db: 0, osszeg: 0, lejart: 0, lejartOsszeg: 0 };
    const teljesitve = { osszes: eredmeny.teljesitveOsszes, lista: eredmeny.teljesitveLista };
    return {
        hataridoNap: DIJBEKERO.fizetesiHataridoNap,
        atutalas: {
            db: atutalas.db,
            osszeg: kerekit(atutalas.osszeg),
            lejart: atutalas.lejart,
            lejartOsszeg: kerekit(atutalas.lejartOsszeg),
        },
        stripeLejart: {
            napok: LEJART_STRIPE_NAPOK,
            db: eredmeny.stripeLejart[0]?.db ?? 0,
            osszeg: kerekit(eredmeny.stripeLejart[0]?.osszeg),
        },
        teljesitveFizetetlen: {
            db: teljesitve.osszes[0]?.db ?? 0,
            osszeg: kerekit(teljesitve.osszes[0]?.osszeg),
            rendelesek: teljesitve.lista.map((rendeles) => ({
                id: rendeles._id,
                rovidAzonosito: rovidAzonosito(rendeles._id),
                nev: rendeles.teljesNev,
                email: rendeles.email,
                vegosszeg: kerekit(rendeles.vegosszeg),
                fizetesiMod: FIZETESI_MODOK[rendeles.fizetesiMod ?? 'atutalas'],
                datum: rendeles.createdAt,
            })),
        },
    };
};

// A vevőknél lévő raklapok a teljesített rendelések alapján (ugyanúgy, mint a vevő
// profiljában): a betétdíjat a rendeléskori raklaponkénti összeggel számoljuk vissza.
const raklapStatisztika = async () => {
    const [eredmeny] = await RendelesModel.aggregate([
        { $match: { allapot: 'teljesitve', 'osszesites.raklapok': { $gt: 0 } } },
        {
            $project: {
                email: 1,
                teljesNev: 1,
                createdAt: 1,
                raklapok: '$osszesites.raklapok',
                betetdij: { $ifNull: ['$osszesites.raklapBetetdij', 0] },
                vissza: { $min: [{ $ifNull: ['$visszahozottRaklapok', 0] }, '$osszesites.raklapok'] },
            },
        },
        {
            $project: {
                email: 1,
                teljesNev: 1,
                createdAt: 1,
                kint: { $subtract: ['$raklapok', '$vissza'] },
                betetdij: {
                    $subtract: [
                        '$betetdij',
                        { $floor: { $add: [{ $multiply: ['$vissza', { $divide: ['$betetdij', '$raklapok'] }] }, 0.5] } },
                    ],
                },
            },
        },
        { $match: { kint: { $gt: 0 } } },
        { $sort: { createdAt: 1 } },
        {
            $group: {
                _id: '$email',
                nev: { $last: '$teljesNev' },
                kint: { $sum: '$kint' },
                betetdij: { $sum: '$betetdij' },
                rendelesek: { $sum: 1 },
                legregebbi: { $min: '$createdAt' },
            },
        },
        { $sort: { kint: -1, legregebbi: 1 } },
        {
            $facet: {
                osszes: [{ $group: { _id: null, kint: { $sum: '$kint' }, betetdij: { $sum: '$betetdij' }, vevok: { $sum: 1 } } }],
                vevok: [{ $limit: 5 }],
            },
        },
    ]);

    const osszes = eredmeny.osszes[0] ?? { kint: 0, betetdij: 0, vevok: 0 };
    return {
        kint: osszes.kint,
        betetdij: kerekit(osszes.betetdij),
        vevokSzama: osszes.vevok,
        vevok: eredmeny.vevok.map((sor) => ({
            email: sor._id,
            nev: sor.nev,
            kint: sor.kint,
            betetdij: kerekit(sor.betetdij),
            rendelesek: sor.rendelesek,
            legregebbi: sor.legregebbi,
        })),
    };
};

// Rendelések, amelyeknél a vevő nem kapta meg a visszaigazoló e-mailt.
const emailHibak = async (most) => {
    const szuro = {
        'ertesitesek.hiba': { $nin: ['', null] },
        'ertesitesek.vevo': null,
        allapot: { $ne: 'lemondva' },
        createdAt: { $gte: new Date(most.getTime() - EMAIL_HIBA_NAPOK * NAP_MS) },
    };
    const [db, rendelesek] = await Promise.all([
        RendelesModel.countDocuments(szuro),
        RendelesModel.find(szuro).sort({ createdAt: -1 }).limit(5).select('teljesNev email ertesitesek createdAt').lean(),
    ]);
    return {
        napok: EMAIL_HIBA_NAPOK,
        db,
        rendelesek: rendelesek.map((rendeles) => ({
            id: rendeles._id,
            rovidAzonosito: rovidAzonosito(rendeles._id),
            nev: rendeles.teljesNev,
            email: rendeles.email,
            hiba: rendeles.ertesitesek?.hiba ?? '',
            datum: rendeles.createdAt,
        })),
    };
};

const megoszlas = (sorok, cimkek, mezo = 'rendelesek') => {
    const osszes = sorok.reduce((osszeg, sor) => osszeg + sor[mezo], 0);
    return Object.entries(cimkek).map(([kulcs, cimke]) => {
        const sor = sorok.find((elem) => elem._id === kulcs);
        const db = sor?.[mezo] ?? 0;
        return {
            kulcs,
            cimke,
            db,
            bevetel: kerekit(sor?.bevetel),
            arany: arany(db, osszes),
        };
    });
};

const getDashboard = async (req, res) => {
    try {
        const most = new Date();
        const idoszak = idoszakFeldolgozas(req.query, most);
        if (idoszak.hiba) return res.status(400).json({ msg: idoszak.hiba });
        const { kezdet, veg } = idoszak;

        const [
            rendelesek, keszletAdatok, mindenkori, legutobbi, felhasznalok, ujFelhasznalok, elozoUjFelhasznalok,
            lemondasok, allapotSzamok, ujArajanlatok, vasarlok, arajanlatok, kozelgo, fizetesek, raklapok, emailek,
        ] = await Promise.all([
            rendelesStatisztika(idoszak),
            keszletStatisztika({ kezdet, veg, most }),
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
            UserModel.countDocuments({ role: 'user', ...ablak(kezdet, veg) }),
            UserModel.countDocuments({ role: 'user', ...ablak(idoszak.osszKezdet, idoszak.osszVeg) }),
            lemondasStatisztika(idoszak),
            RendelesModel.aggregate([{ $group: { _id: '$allapot', db: { $sum: 1 } } }]),
            ArajanlatModel.countDocuments({ allapot: 'uj' }),
            vasarloStatisztika(idoszak),
            arajanlatStatisztika(idoszak),
            kozelgoAtvetelek(most),
            fizetesStatisztika(most),
            raklapStatisztika(),
            emailHibak(most),
        ]);

        const rendelesAllapotok = Object.fromEntries(Object.keys(RENDELES_ALLAPOTOK).map((kulcs) => [kulcs, 0]));
        for (const sor of allapotSzamok) {
            if (Object.hasOwn(rendelesAllapotok, sor._id)) rendelesAllapotok[sor._id] = sor.db;
        }

        const ures = { bevetel: 0, rendelesek: 0, vasarlok: [], kedvezmeny: 0, kedvezmenyesRendelesek: 0 };
        const aktualis = rendelesek.aktualis[0] ?? ures;
        const elozo = rendelesek.elozo[0] ?? ures;
        const atlag = (adat) => (adat.rendelesek ? adat.bevetel / adat.rendelesek : 0);
        // Lemondási arány: a lemondott rendelések aránya az időszakban leadott összes rendelésből.
        const lemondasiArany = (ervenyes, lemondott) => arany(lemondott.rendelesek, ervenyes.rendelesek + lemondott.rendelesek);

        const idosorAdatok = new Map(rendelesek.idosor.map((sor) => [sor._id, sor]));
        const idosor = idosorKulcsok(idoszak).map((kulcs) => ({
            kulcs,
            bevetel: kerekit(idosorAdatok.get(kulcs)?.bevetel),
            rendelesek: idosorAdatok.get(kulcs)?.rendelesek ?? 0,
        }));

        const szallitas = rendelesek.szallitas[0] ?? { rendelesek: 0, sulyKg: 0, szallitasiDij: 0, fuvarok: 0, darus: 0 };
        const atfutas = rendelesek.atfutas[0] ?? {};

        return res.status(200).json({
            idoszak: {
                kulcs: idoszak.kulcs,
                cimke: idoszak.cimke,
                bontas: idoszak.bontas,
                kezdet,
                veg,
                tol: idoszak.tol,
                ig: idoszak.ig,
                osszevetes: idoszak.osszevetes,
                osszevetesCimke: idoszak.osszevetesCimke,
                osszKezdet: idoszak.osszKezdet,
                osszVeg: idoszak.osszVeg,
            },
            elerhetoIdoszakok: Object.entries(IDOSZAKOK).map(([kulcs, { cimke }]) => ({ kulcs, cimke })),
            osszegzes: {
                bevetel: mutato(aktualis.bevetel, elozo.bevetel),
                rendelesek: mutato(aktualis.rendelesek, elozo.rendelesek),
                atlagosKosar: mutato(atlag(aktualis), atlag(elozo)),
                vasarlok: mutato(aktualis.vasarlok.length, elozo.vasarlok.length),
                ujFelhasznalok: mutato(ujFelhasznalok, elozoUjFelhasznalok),
                kedvezmeny: {
                    ...mutato(aktualis.kedvezmeny, elozo.kedvezmeny),
                    rendelesek: aktualis.kedvezmenyesRendelesek,
                },
                lemondott: {
                    rendelesek: lemondasok.aktualis.rendelesek,
                    ertek: kerekit(lemondasok.aktualis.ertek),
                    arany: lemondasiArany(aktualis, lemondasok.aktualis),
                    elozoArany: lemondasiArany(elozo, lemondasok.elozo),
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
            fizetesiModok: megoszlas(rendelesek.fizetesiMod, FIZETESI_MODOK),
            fiokTipusok: megoszlas(rendelesek.fiok, FIOK_TIPUSOK),
            vasarloTipusok: megoszlas(vasarlok, VASARLO_TIPUSOK, 'db'),
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
            szallitas: {
                rendelesek: szallitas.rendelesek,
                sulyKg: kerekit(szallitas.sulyKg),
                szallitasiDij: kerekit(szallitas.szallitasiDij),
                fuvarok: szallitas.fuvarok,
                darus: szallitas.darus,
                darusArany: arany(szallitas.darus, szallitas.rendelesek),
                zonak: rendelesek.zonak.map((sor) => ({
                    kulcs: sor._id,
                    nev: ZONA_NEVEK[sor._id] ?? sor.zonaNev ?? 'Zónaadat nélkül (régi rendelés)',
                    rendelesek: sor.rendelesek,
                    szallitasiDij: kerekit(sor.szallitasiDij),
                })),
            },
            atfutas: {
                visszaigazolas: idotartamStatisztika(atfutas.visszaigazolas),
                teljesites: idotartamStatisztika(atfutas.teljesites),
            },
            hoterkep: hoterkepMatrix(rendelesek.hoterkep),
            arajanlatok,
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
            keszlet: keszletAdatok.keszlet,
            nemFogyo: keszletAdatok.nemFogyo,
            kozelgo,
            fizetesek,
            raklapok,
            emailHibak: emailek,
            generalva: most,
        });
    } catch (error) {
        console.error('Dashboard-hiba:', error);
        return res.status(500).json({ msg: 'A dashboard adatait most nem sikerült betölteni.' });
    }
};

export { getDashboard };
