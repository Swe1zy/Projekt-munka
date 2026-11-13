import mongoose from 'mongoose';
import ArajanlatModel, { ARAJANLAT_ALLAPOTOK } from '../../models/Arajanlat.mjs';
import TermekModel from '../../models/Termek.mjs';

const EMAIL_MINTA = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MENNYISEG = 99999;
const szoveg = (ertek, max) => (typeof ertek === 'string' ? ertek.trim().slice(0, max) : '');
const kerekit = (ertek) => Math.round(ertek * 100) / 100;

export const arajanlatValasz = (ajanlat, { admin = false } = {}) => ({
    id: ajanlat._id,
    rovidAzonosito: String(ajanlat._id).slice(-6).toUpperCase(),
    datum: ajanlat.createdAt,
    nev: ajanlat.nev,
    cegnev: ajanlat.cegnev,
    adoszam: ajanlat.adoszam,
    email: ajanlat.email,
    telefon: ajanlat.telefon,
    iranyitoszam: ajanlat.iranyitoszam,
    telepules: ajanlat.telepules,
    megjegyzes: ajanlat.megjegyzes,
    tetelek: ajanlat.tetelek,
    listaOsszeg: ajanlat.listaOsszeg,
    allapot: ajanlat.allapot,
    allapotCimke: ARAJANLAT_ALLAPOTOK[ajanlat.allapot] ?? ajanlat.allapot,
    ...(admin ? { adminMegjegyzes: ajanlat.adminMegjegyzes, vendeg: !ajanlat.userId } : {}),
});

// Árajánlatkérés: vendégként és bejelentkezve is beküldhető.
const postArajanlat = async (req, res) => {
    try {
        const adat = req.body ?? {};
        const nev = szoveg(adat.nev, 120);
        const email = szoveg(adat.email, 200).toLowerCase();
        const telefon = szoveg(adat.telefon, 40);
        const megjegyzes = szoveg(adat.megjegyzes, 2000);
        const iranyitoszam = szoveg(adat.iranyitoszam, 10);

        if (nev.length < 2) return res.status(400).json({ msg: 'Add meg a neved.' });
        if (!EMAIL_MINTA.test(email)) return res.status(400).json({ msg: 'Adj meg érvényes e-mail-címet.' });
        if (telefon && !/^[+\d][\d\s()/-]{5,}$/.test(telefon)) {
            return res.status(400).json({ msg: 'A telefonszám formátuma érvénytelen.' });
        }
        if (iranyitoszam && !/^\d{4}$/.test(iranyitoszam)) {
            return res.status(400).json({ msg: 'Az irányítószám 4 számjegy legyen.' });
        }

        const bejovoTetelek = Array.isArray(adat.tetelek) ? adat.tetelek.slice(0, 100) : [];
        const mennyisegek = new Map();
        for (const tetel of bejovoTetelek) {
            if (!tetel || !mongoose.isValidObjectId(tetel.termekId) || !Number.isFinite(tetel.mennyiseg)
                || tetel.mennyiseg <= 0 || tetel.mennyiseg > MAX_MENNYISEG) {
                return res.status(400).json({ msg: 'Az egyik tétel adata érvénytelen.' });
            }
            mennyisegek.set(String(tetel.termekId), tetel.mennyiseg);
        }
        if (mennyisegek.size === 0 && megjegyzes.length < 10) {
            return res.status(400).json({ msg: 'Tegyél termékeket a kosárba, vagy írd le, mire kérsz ajánlatot.' });
        }

        // Árajánlatnál a készletnél nagyobb mennyiség is kérhető (pl. rendelésre beszerezhető).
        const termekek = mennyisegek.size
            ? await TermekModel.find({ _id: { $in: [...mennyisegek.keys()] } }).lean()
            : [];
        const tetelek = termekek.map((termek) => ({
            termekId: termek._id,
            nev: termek.nev,
            mennyiseg: mennyisegek.get(String(termek._id)),
            egyseg: termek.egyseg,
            listaar: termek.ar,
        }));

        const ajanlat = await ArajanlatModel.create({
            userId: req.authUser?._id ?? null,
            nev,
            cegnev: szoveg(adat.cegnev, 160),
            adoszam: szoveg(adat.adoszam, 32),
            email,
            telefon,
            iranyitoszam,
            telepules: szoveg(adat.telepules, 100),
            megjegyzes,
            tetelek,
            listaOsszeg: kerekit(tetelek.reduce((osszeg, tetel) => osszeg + tetel.listaar * tetel.mennyiseg, 0)),
        });

        return res.status(201).json({
            msg: 'Megkaptuk az árajánlatkérésedet, hamarosan jelentkezünk.',
            arajanlat: { id: ajanlat._id, rovidAzonosito: String(ajanlat._id).slice(-6).toUpperCase() },
        });
    } catch (error) {
        console.error('Árajánlatkérési hiba:', error);
        return res.status(500).json({ msg: 'Az árajánlatkérést most nem sikerült elküldeni.' });
    }
};

// A bejelentkezett vevő saját árajánlatkérései (a belső megjegyzés nélkül).
const getSajatArajanlatok = async (req, res) => {
    try {
        const ajanlatok = await ArajanlatModel.find({ userId: req.authUser._id })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        return res.status(200).json({ arajanlatok: ajanlatok.map((ajanlat) => arajanlatValasz(ajanlat)) });
    } catch (error) {
        console.error('Saját árajánlatok lekérési hiba:', error);
        return res.status(500).json({ msg: 'Az árajánlatkéréseidet most nem sikerült betölteni.' });
    }
};

const getArajanlatok = async (req, res) => {
    try {
        const allapot = typeof req.query.allapot === 'string' ? req.query.allapot : 'osszes';
        if (allapot !== 'osszes' && !Object.hasOwn(ARAJANLAT_ALLAPOTOK, allapot)) {
            return res.status(400).json({ msg: 'Érvénytelen állapotszűrő.' });
        }
        const [ajanlatok, szamok] = await Promise.all([
            ArajanlatModel.find(allapot === 'osszes' ? {} : { allapot }).sort({ createdAt: -1 }).limit(100).lean(),
            ArajanlatModel.aggregate([{ $group: { _id: '$allapot', db: { $sum: 1 } } }]),
        ]);
        const allapotSzamok = Object.fromEntries(Object.keys(ARAJANLAT_ALLAPOTOK).map((kulcs) => [kulcs, 0]));
        for (const sor of szamok) if (Object.hasOwn(allapotSzamok, sor._id)) allapotSzamok[sor._id] = sor.db;
        allapotSzamok.osszes = Object.values(allapotSzamok).reduce((osszeg, db) => osszeg + db, 0);

        return res.status(200).json({
            arajanlatok: ajanlatok.map((ajanlat) => arajanlatValasz(ajanlat, { admin: true })),
            allapotSzamok,
            allapotok: Object.entries(ARAJANLAT_ALLAPOTOK).map(([kulcs, cimke]) => ({ allapot: kulcs, cimke })),
        });
    } catch (error) {
        console.error('Árajánlatlista-hiba:', error);
        return res.status(500).json({ msg: 'Az árajánlatkéréseket most nem sikerült betölteni.' });
    }
};

const patchArajanlat = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return res.status(404).json({ msg: 'Az árajánlatkérés nem található.' });

        const frissites = {};
        if (req.body?.allapot !== undefined) {
            if (!Object.hasOwn(ARAJANLAT_ALLAPOTOK, req.body.allapot)) {
                return res.status(400).json({ msg: 'Érvénytelen állapot.' });
            }
            frissites.allapot = req.body.allapot;
        }
        if (req.body?.adminMegjegyzes !== undefined) {
            frissites.adminMegjegyzes = szoveg(req.body.adminMegjegyzes, 2000);
        }
        if (!Object.keys(frissites).length) return res.status(400).json({ msg: 'Nincs mit módosítani.' });

        const ajanlat = await ArajanlatModel.findByIdAndUpdate(
            id,
            { $set: frissites },
            { returnDocument: 'after', runValidators: true, lean: true },
        );
        if (!ajanlat) return res.status(404).json({ msg: 'Az árajánlatkérés nem található.' });

        return res.status(200).json({ msg: 'Mentve.', arajanlat: arajanlatValasz(ajanlat, { admin: true }) });
    } catch (error) {
        console.error('Árajánlat-módosítási hiba:', error);
        return res.status(500).json({ msg: 'A módosítást most nem sikerült menteni.' });
    }
};

export { postArajanlat, getSajatArajanlatok, getArajanlatok, patchArajanlat };
