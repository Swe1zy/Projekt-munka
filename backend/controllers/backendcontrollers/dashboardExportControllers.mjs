import { KESZLET_RIASZTASI_KUSZOB } from '../../config/uzlet.mjs';
import RendelesModel, { ATVETELI_MODOK, RENDELES_ALLAPOTOK } from '../../models/Rendeles.mjs';
import TermekModel from '../../models/Termek.mjs';
import { csvKeszites } from '../../utils/csv.mjs';
import { rovidAzonosito } from '../../utils/rendelesFormazas.mjs';
import { BEVETEL, ERVENYES_RENDELES, IDOSZAKOK, IDOZONA, idoszakHatarai, idosorKulcsok } from './dashboardControllers.mjs';

const idopontFormazo = new Intl.DateTimeFormat('sv-SE', {
    timeZone: IDOZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
});
// „2026-11-12 10:50” – rendezhető, az Excel dátumként ismeri fel.
const idopont = (datum) => idopontFormazo.format(new Date(datum));
const kerekit = (ertek) => Math.round((Number(ertek) || 0) * 100) / 100;

const rendelesekExport = async ({ kezdet }) => {
    const rendelesek = await RendelesModel.find({ createdAt: { $gte: kezdet } }).sort({ createdAt: 1 }).lean();
    return {
        fejlec: [
            'Azonosító', 'Leadva', 'Állapot', 'Vevő', 'E-mail', 'Vevő típusa', 'Adószám', 'Átvétel', 'Átvétel napja',
            'Település', 'Tételek', 'Termékek (Ft)', 'Kedvezmény (Ft)', 'Szállítás (Ft)', 'Raklap-betétdíj (Ft)',
            'Végösszeg (Ft)', 'Visszahozott raklap', 'Fiók',
        ],
        sorok: rendelesek.map((r) => [
            rovidAzonosito(r._id),
            idopont(r.createdAt),
            RENDELES_ALLAPOTOK[r.allapot] ?? r.allapot,
            r.szamlazasiAdatok?.nev ?? r.teljesNev,
            r.email,
            r.szamlazasiAdatok?.tipus === 'ceg' ? 'Cég' : 'Magánszemély',
            r.szamlazasiAdatok?.adoszam || '',
            ATVETELI_MODOK[r.atvetelModja] ?? r.atvetelModja,
            r.atvetelNapja ?? '',
            r.szallitasiAdatok?.telepules ?? '',
            r.tetelek.length,
            kerekit(r.osszesites?.termekOsszeg ?? r.vegosszeg),
            kerekit(r.osszesites?.kedvezmeny),
            kerekit(r.osszesites?.szallitasiDij),
            kerekit(r.osszesites?.raklapBetetdij),
            kerekit(r.vegosszeg),
            r.visszahozottRaklapok ?? 0,
            r.userId ? 'regisztrált' : 'vendég',
        ]),
    };
};

const idosorExport = async ({ kezdet, idoszak, most }) => {
    const formatum = idoszak.bontas === 'honap' ? '%Y-%m' : '%Y-%m-%d';
    const adatok = await RendelesModel.aggregate([
        { $match: { createdAt: { $gte: kezdet }, ...ERVENYES_RENDELES } },
        {
            $group: {
                _id: { $dateToString: { format: formatum, date: '$createdAt', timezone: IDOZONA } },
                bevetel: { $sum: BEVETEL },
                rendelesek: { $sum: 1 },
            },
        },
    ]);
    const terkep = new Map(adatok.map((sor) => [sor._id, sor]));
    return {
        fejlec: [idoszak.bontas === 'honap' ? 'Hónap' : 'Nap', 'Bevétel (Ft)', 'Rendelések'],
        sorok: idosorKulcsok(idoszak, kezdet, most).map((kulcs) => [
            kulcs,
            kerekit(terkep.get(kulcs)?.bevetel),
            terkep.get(kulcs)?.rendelesek ?? 0,
        ]),
    };
};

const termekekExport = async ({ kezdet }) => {
    const adatok = await RendelesModel.aggregate([
        { $match: { createdAt: { $gte: kezdet }, ...ERVENYES_RENDELES } },
        { $sort: { createdAt: 1 } },
        { $unwind: '$tetelek' },
        {
            $group: {
                _id: '$tetelek.termekId',
                nev: { $last: '$tetelek.nev' },
                egyseg: { $last: '$tetelek.egyseg' },
                mennyiseg: { $sum: '$tetelek.mennyiseg' },
                rendelesek: { $sum: 1 },
                bevetel: { $sum: { $multiply: ['$tetelek.mennyiseg', '$tetelek.egysegar'] } },
            },
        },
        { $lookup: { from: TermekModel.collection.name, localField: '_id', foreignField: '_id', as: 'termek' } },
        { $sort: { bevetel: -1 } },
    ]);
    return {
        fejlec: ['Termék', 'Kategória', 'Eladott mennyiség', 'Egység', 'Rendelések', 'Bevétel (Ft)', 'Jelenlegi készlet'],
        sorok: adatok.map((sor) => [
            sor.nev,
            sor.termek[0]?.kategoria ?? 'Törölt termék',
            kerekit(sor.mennyiseg),
            sor.egyseg,
            sor.rendelesek,
            kerekit(sor.bevetel),
            sor.termek[0] ? kerekit(sor.termek[0].keszlet) : '',
        ]),
    };
};

const keszletExport = async () => {
    const termekek = await TermekModel.find({}).sort({ kategoria: 1, nev: 1 }).lean();
    return {
        fejlec: ['Termék', 'Kategória', 'Egység', 'Egységár (Ft)', 'Készlet', 'Készletérték (Ft)', 'Állapot'],
        sorok: termekek.map((t) => [
            t.nev,
            t.kategoria,
            t.egyseg,
            kerekit(t.ar),
            kerekit(t.keszlet),
            kerekit(t.ar * t.keszlet),
            t.keszlet <= 0 ? 'Elfogyott' : t.keszlet <= KESZLET_RIASZTASI_KUSZOB ? 'Fogyóban' : 'Rendben',
        ]),
    };
};

const EXPORTOK = {
    rendelesek: { nev: 'rendelesek', keszit: rendelesekExport },
    idosor: { nev: 'bevetel', keszit: idosorExport },
    termekek: { nev: 'termekeladasok', keszit: termekekExport },
    keszlet: { nev: 'keszlet', keszit: keszletExport, idoszakFuggetlen: true },
};

const getDashboardExport = async (req, res) => {
    try {
        const tipus = typeof req.query.tipus === 'string' ? req.query.tipus : '';
        const idoszakKulcs = typeof req.query.idoszak === 'string' ? req.query.idoszak : '30nap';
        const exportalo = Object.hasOwn(EXPORTOK, tipus) ? EXPORTOK[tipus] : null;
        if (!exportalo || !Object.hasOwn(IDOSZAKOK, idoszakKulcs)) {
            return res.status(400).json({ msg: `Érvénytelen export. Típusok: ${Object.keys(EXPORTOK).join(', ')}.` });
        }

        const idoszak = IDOSZAKOK[idoszakKulcs];
        const most = new Date();
        const { kezdet } = idoszakHatarai(idoszak, most);
        const { fejlec, sorok } = await exportalo.keszit({ kezdet, idoszak, most });

        const datum = idopont(most).slice(0, 10);
        const fajlnev = exportalo.idoszakFuggetlen
            ? `${exportalo.nev}-${datum}.csv`
            : `${exportalo.nev}-${idoszakKulcs}-${datum}.csv`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${fajlnev}"`);
        res.setHeader('Cache-Control', 'private, no-store');
        return res.status(200).send(csvKeszites(fejlec, sorok));
    } catch (error) {
        console.error('Exporthiba:', error);
        return res.status(500).json({ msg: 'Az exportot most nem sikerült elkészíteni.' });
    }
};

export { getDashboardExport };
