import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { KISZALLITAS } from '../../config/uzlet.mjs';
import ArajanlatModel from '../../models/Arajanlat.mjs';
import RendelesModel from '../../models/Rendeles.mjs';
import UserModel, { MAX_SZALLITASI_CIM } from '../../models/User.mjs';
import {
    MAX_MEGNEVEZES_HOSSZ,
    adoszamValid,
    cimValid,
    nevValid,
    szallitasiCimBetoltes,
    szoveg,
    telefonValid,
} from '../../utils/cimek.mjs';
import { clearAuthCookie } from '../../utils/authToken.mjs';
import { rendelesValasz } from '../../utils/rendelesFormazas.mjs';
import { arajanlatValasz } from './arajanlatControllers.mjs';
import { EMAIL_MINTA, MAX_EMAIL_HOSSZ, publikusFelhasznalo } from './auth/authControllers.mjs';

// Ezekben az állapotokban a rendelés még teljesítésre vár, ezért a fiók nem törölhető.
const FOLYAMATBAN_LEVO_ALLAPOTOK = ['feldolgozasra_var', 'visszaigazolva', 'kiszallitas_alatt'];
// Az admin fiókot a szerver minden induláskor az .env alapján állítja helyre.
const ADMIN_HIBA = 'Az admin fiók adatai a szerver beállításaiban módosíthatók.';
const PO = { returnDocument: 'after', runValidators: true, lean: true };

const cimValasz = (cim) => ({
    id: cim._id,
    megnevezes: cim.megnevezes,
    atvevoNev: cim.atvevoNev,
    iranyitoszam: cim.iranyitoszam,
    telepules: cim.telepules,
    utca: cim.utca,
    megjegyzes: cim.megjegyzes ?? '',
    behajtas: cim.behajtas ?? '',
});

// A Profilom „Adataim” fülének és a pénztár előtöltésének közös adatai.
const fiokValasz = (user) => {
    const cimek = user.szallitasiCimek ?? [];
    // Ha az alapértelmezett címet közben törölték, az első cím az alapértelmezett.
    const alap = cimek.find((cim) => String(cim._id) === String(user.alapertelmezettCim)) ?? cimek[0];
    return {
        user: publikusFelhasznalo(user),
        regisztralt: user.createdAt,
        aszfElfogadas: user.aszfElfogadas?.verzio ? user.aszfElfogadas : null,
        telefon: user.telefon ?? '',
        mentettAdatok: user.mentettAdatok?.szamlazas ? { szamlazas: user.mentettAdatok.szamlazas } : null,
        szallitasiCimek: cimek.map(cimValasz),
        alapertelmezettCim: alap?._id ?? null,
        szallitasiBeallitasok: {
            darus: Boolean(user.szallitasiBeallitasok?.darus),
            idosav: user.szallitasiBeallitasok?.idosav ?? '',
        },
        ertesitesiBeallitasok: {
            allapotValtozas: user.ertesitesiBeallitasok?.allapotValtozas !== false,
            hirlevel: Boolean(user.ertesitesiBeallitasok?.hirlevel),
            hirlevelIdopont: user.ertesitesiBeallitasok?.hirlevelIdopont ?? null,
        },
    };
};

// A korábbi, egyetlen mentett szállítási cím átemelése a címjegyzékbe (egyszeri, atomi).
const regiCimAtemelese = async (user) => {
    const regi = user.mentettAdatok?.szallitas;
    if (!regi) return user;
    const cim = {
        _id: new mongoose.Types.ObjectId(),
        megnevezes: 'Szállítási cím',
        atvevoNev: regi.atvevoNev,
        iranyitoszam: regi.iranyitoszam,
        telepules: regi.telepules,
        utca: regi.utca,
        megjegyzes: regi.megjegyzes ?? '',
    };
    const frissitett = await UserModel.findOneAndUpdate(
        { _id: user._id, 'mentettAdatok.szallitas': { $exists: true } },
        {
            $push: { szallitasiCimek: cim },
            $unset: { 'mentettAdatok.szallitas': 1 },
            ...(user.alapertelmezettCim ? {} : { $set: { alapertelmezettCim: cim._id } }),
        },
        { returnDocument: 'after', lean: true },
    );
    return frissitett ?? UserModel.findById(user._id).lean();
};

const getFiok = async (req, res) => {
    try {
        const user = await regiCimAtemelese(await UserModel.findById(req.authUser._id).lean());
        return res.status(200).json(fiokValasz(user));
    } catch (error) {
        console.error('Fiók lekérési hiba:', error);
        return res.status(500).json({ msg: 'A fiókod adatait most nem sikerült betölteni.' });
    }
};

// Név, e-mail-cím és telefonszám módosítása (bármelyik külön is). Az e-mail a
// belépési azonosító is, ezért a megváltoztatásához a jelenlegi jelszó is kell.
const patchFiok = async (req, res) => {
    try {
        if (req.authUser.role === 'admin') return res.status(403).json({ msg: ADMIN_HIBA });

        const body = req.body ?? {};
        const user = await UserModel.findById(req.authUser._id);
        const nev = body.nev === undefined ? user.nev : szoveg(body.nev);
        const email = body.email === undefined ? user.email : szoveg(body.email).toLowerCase();
        const telefon = body.telefon === undefined ? user.telefon ?? '' : szoveg(body.telefon);
        if (!nevValid(nev)) {
            return res.status(400).json({ msg: 'A név 2 és 120 karakter közötti legyen.' });
        }
        if (!EMAIL_MINTA.test(email) || email.length > MAX_EMAIL_HOSSZ) {
            return res.status(400).json({ msg: 'Adj meg érvényes e-mail-címet.' });
        }
        if (telefon && !telefonValid(telefon)) {
            return res.status(400).json({ msg: 'A telefonszám formátuma érvénytelen (pl. +36 30 123 4567).' });
        }

        if (email !== user.email) {
            const jelszo = typeof body.jelszo === 'string' ? body.jelszo : '';
            if (!jelszo || !(await bcrypt.compare(jelszo, user.jelszo))) {
                return res.status(403).json({ msg: 'Az e-mail-cím módosításához add meg a jelenlegi jelszavad!' });
            }
            if (await UserModel.exists({ email, _id: { $ne: user._id } })) {
                return res.status(409).json({ msg: 'Ezzel az e-mail címmel már van regisztrált fiók!' });
            }
        }

        user.nev = nev;
        user.email = email;
        user.telefon = telefon;
        await user.save();

        return res.status(200).json({ msg: 'Az adataidat elmentettük.', ...fiokValasz(user.toObject()) });
    } catch (error) {
        // Két egyidejű módosításnál az egyedi index dobja ezt a hibát.
        if (error.code === 11000) {
            return res.status(409).json({ msg: 'Ezzel az e-mail címmel már van regisztrált fiók!' });
        }
        console.error('Fiókmódosítási hiba:', error);
        return res.status(500).json({ msg: 'Az adataidat most nem sikerült elmenteni.' });
    }
};

// A pénztárat előtöltő számlázási adatok mentése; `szamlazas: null` törli őket.
// (A szállítási címek a címjegyzékben, külön végpontokon kezelhetők.)
const putMentettAdatok = async (req, res) => {
    try {
        const bejovoSzamlazas = req.body?.szamlazas;
        if (bejovoSzamlazas === null) {
            const user = await UserModel.findByIdAndUpdate(req.authUser._id, { $unset: { mentettAdatok: 1 } }, PO);
            return res.status(200).json({ msg: 'A mentett számlázási adataidat töröltük.', ...fiokValasz(user) });
        }

        const tipus = bejovoSzamlazas?.tipus;
        const szamlazas = {
            tipus,
            nev: szoveg(bejovoSzamlazas?.nev),
            adoszam: tipus === 'ceg' ? szoveg(bejovoSzamlazas?.adoszam) : '',
            iranyitoszam: szoveg(bejovoSzamlazas?.iranyitoszam),
            telepules: szoveg(bejovoSzamlazas?.telepules),
            utca: szoveg(bejovoSzamlazas?.utca),
        };
        if (!['maganszemely', 'ceg'].includes(tipus) || !nevValid(szamlazas.nev) || !cimValid(szamlazas)) {
            return res.status(400).json({ msg: 'Töltsd ki helyesen a számlázási nevet és címet (az irányítószám 4 számjegy).' });
        }
        if (tipus === 'ceg' && !adoszamValid(szamlazas.adoszam)) {
            return res.status(400).json({ msg: 'Céges számlázásnál add meg az érvényes adószámot.' });
        }

        const user = await UserModel.findByIdAndUpdate(
            req.authUser._id,
            { $set: { 'mentettAdatok.szamlazas': szamlazas } },
            PO,
        );
        return res.status(200).json({ msg: 'A számlázási adataidat elmentettük.', ...fiokValasz(user) });
    } catch (error) {
        console.error('Mentett adatok mentési hibája:', error);
        return res.status(500).json({ msg: 'Az adataidat most nem sikerült elmenteni.' });
    }
};

// Címjegyzék-elem a kérés törzséből; megnevezés nélkül a település és az utca lesz a neve.
const cimAKeresbol = (body) => {
    const { cim, hiba } = szallitasiCimBetoltes(body);
    if (hiba) return { hiba };
    const megnevezes = szoveg(body?.megnevezes).slice(0, MAX_MEGNEVEZES_HOSSZ)
        || `${cim.telepules}, ${cim.utca}`.slice(0, MAX_MEGNEVEZES_HOSSZ);
    return { cim: { ...cim, megnevezes } };
};

const postSzallitasiCim = async (req, res) => {
    try {
        const { cim, hiba } = cimAKeresbol(req.body);
        if (hiba) return res.status(400).json({ msg: hiba });

        const _id = new mongoose.Types.ObjectId();
        const alapKell = req.body?.alapertelmezett === true;
        // A feltétel atomi: a limit két egyidejű kérésnél sem léphető túl.
        const user = await UserModel.findOneAndUpdate(
            { _id: req.authUser._id, [`szallitasiCimek.${MAX_SZALLITASI_CIM - 1}`]: { $exists: false } },
            { $push: { szallitasiCimek: { _id, ...cim } }, ...(alapKell ? { $set: { alapertelmezettCim: _id } } : {}) },
            PO,
        );
        if (!user) {
            return res.status(409).json({ msg: `Legfeljebb ${MAX_SZALLITASI_CIM} szállítási címet menthetsz. Törölj egy régit.` });
        }
        return res.status(201).json({ msg: 'A címet hozzáadtuk a címjegyzékedhez.', ujCimId: _id, ...fiokValasz(user) });
    } catch (error) {
        console.error('Címmentési hiba:', error);
        return res.status(500).json({ msg: 'A címet most nem sikerült elmenteni.' });
    }
};

const putSzallitasiCim = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return res.status(404).json({ msg: 'A cím nem található.' });
        const { cim, hiba } = cimAKeresbol(req.body);
        if (hiba) return res.status(400).json({ msg: hiba });

        const beallit = Object.fromEntries(Object.entries(cim).map(([mezo, ertek]) => [`szallitasiCimek.$.${mezo}`, ertek]));
        if (req.body?.alapertelmezett === true) beallit.alapertelmezettCim = id;
        const user = await UserModel.findOneAndUpdate(
            { _id: req.authUser._id, 'szallitasiCimek._id': id },
            { $set: beallit },
            PO,
        );
        if (!user) return res.status(404).json({ msg: 'A cím nem található.' });
        return res.status(200).json({ msg: 'A címet elmentettük.', ...fiokValasz(user) });
    } catch (error) {
        console.error('Címmódosítási hiba:', error);
        return res.status(500).json({ msg: 'A címet most nem sikerült elmenteni.' });
    }
};

const deleteSzallitasiCim = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return res.status(404).json({ msg: 'A cím nem található.' });
        const user = await UserModel.findOneAndUpdate(
            { _id: req.authUser._id, 'szallitasiCimek._id': id },
            { $pull: { szallitasiCimek: { _id: id } } },
            PO,
        );
        if (!user) return res.status(404).json({ msg: 'A cím nem található.' });
        return res.status(200).json({ msg: 'A címet töröltük.', ...fiokValasz(user) });
    } catch (error) {
        console.error('Címtörlési hiba:', error);
        return res.status(500).json({ msg: 'A címet most nem sikerült törölni.' });
    }
};

/**
 * Szállítási és értesítési beállítások. Csak a megküldött csoport változik:
 * { szallitas: { darus, idosav } } és/vagy { ertesitesek: { allapotValtozas, hirlevel } }.
 */
const putBeallitasok = async (req, res) => {
    try {
        const { szallitas, ertesitesek } = req.body ?? {};
        const beallit = {};

        if (szallitas !== undefined) {
            const idosav = szallitas?.idosav ?? '';
            if (typeof szallitas?.darus !== 'boolean'
                || (idosav !== '' && !KISZALLITAS.idosavok.some((sav) => sav.kulcs === idosav))) {
                return res.status(400).json({ msg: 'Érvénytelen szállítási beállítás.' });
            }
            beallit.szallitasiBeallitasok = { darus: szallitas.darus, idosav };
        }

        if (ertesitesek !== undefined) {
            if (typeof ertesitesek?.allapotValtozas !== 'boolean' || typeof ertesitesek?.hirlevel !== 'boolean') {
                return res.status(400).json({ msg: 'Érvénytelen értesítési beállítás.' });
            }
            beallit['ertesitesiBeallitasok.allapotValtozas'] = ertesitesek.allapotValtozas;
            beallit['ertesitesiBeallitasok.hirlevel'] = ertesitesek.hirlevel;
            if (!ertesitesek.hirlevel) beallit['ertesitesiBeallitasok.hirlevelIdopont'] = null;
        }
        if (!Object.keys(beallit).length) return res.status(400).json({ msg: 'Nincs mit módosítani.' });

        let user = await UserModel.findByIdAndUpdate(req.authUser._id, { $set: beallit }, PO);
        // A hírlevél-hozzájárulás időpontja az első feliratkozáskor rögzül, később nem íródik felül.
        if (ertesitesek?.hirlevel && !user.ertesitesiBeallitasok?.hirlevelIdopont) {
            user = await UserModel.findByIdAndUpdate(
                req.authUser._id,
                { $set: { 'ertesitesiBeallitasok.hirlevelIdopont': new Date() } },
                PO,
            );
        }
        return res.status(200).json({ msg: 'A beállításaidat elmentettük.', ...fiokValasz(user) });
    } catch (error) {
        console.error('Beállítás-mentési hiba:', error);
        return res.status(500).json({ msg: 'A beállításaidat most nem sikerült elmenteni.' });
    }
};

// A fiókhoz tartozó összes adat letölthető másolata (adathordozhatóság).
const getAdatExport = async (req, res) => {
    try {
        const [user, rendelesek, arajanlatok] = await Promise.all([
            UserModel.findById(req.authUser._id).lean(),
            RendelesModel.find({ userId: req.authUser._id }).sort({ createdAt: -1 }).lean(),
            ArajanlatModel.find({ userId: req.authUser._id }).sort({ createdAt: -1 }).lean(),
        ]);
        const fiok = fiokValasz(user);

        const adat = {
            exportalva: new Date(),
            fiok: {
                nev: user.nev,
                email: user.email,
                telefon: fiok.telefon,
                regisztralt: user.createdAt,
                aszfElfogadas: user.aszfElfogadas ?? null,
            },
            mentettAdatok: fiok.mentettAdatok,
            szallitasiCimek: fiok.szallitasiCimek,
            szallitasiBeallitasok: fiok.szallitasiBeallitasok,
            ertesitesiBeallitasok: fiok.ertesitesiBeallitasok,
            rendelesek: rendelesek.map((rendeles) => rendelesValasz(rendeles)),
            arajanlatkeresek: arajanlatok.map((ajanlat) => arajanlatValasz(ajanlat)),
        };

        const nap = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="tuzep-adataim-${nap}.json"`);
        res.setHeader('Cache-Control', 'private, no-store');
        return res.status(200).send(JSON.stringify(adat, null, 2));
    } catch (error) {
        console.error('Adatexport-hiba:', error);
        return res.status(500).json({ msg: 'Az adataidat most nem sikerült összeállítani.' });
    }
};

/**
 * Fiók törlése a jelszó megerősítésével. A felhasználó, a mentett adatai és az
 * árajánlatkérései törlődnek; a rendelések a számviteli megőrzési kötelezettség
 * miatt megmaradnak, de a fiókról leválasztva (vendégrendelésként).
 */
const postFiokTorles = async (req, res) => {
    try {
        if (req.authUser.role === 'admin') {
            return res.status(403).json({ msg: 'Az admin fiók itt nem törölhető.' });
        }

        const jelszo = typeof req.body?.jelszo === 'string' ? req.body.jelszo : '';
        const user = await UserModel.findById(req.authUser._id);
        if (!jelszo || !(await bcrypt.compare(jelszo, user.jelszo))) {
            return res.status(403).json({ msg: 'A megadott jelszó hibás!' });
        }

        const folyamatban = await RendelesModel.countDocuments({
            userId: user._id,
            allapot: { $in: FOLYAMATBAN_LEVO_ALLAPOTOK },
        });
        if (folyamatban > 0) {
            return res.status(409).json({
                msg: `Még ${folyamatban} folyamatban lévő rendelésed van. A fiókodat a rendelések teljesítése vagy lemondása után törölheted.`,
            });
        }

        await RendelesModel.updateMany({ userId: user._id }, { $set: { userId: null } });
        await ArajanlatModel.deleteMany({ userId: user._id });
        await UserModel.deleteOne({ _id: user._id });

        clearAuthCookie(res);
        return res.status(200).json({ msg: 'A fiókodat töröltük. Köszönjük, hogy nálunk vásároltál!' });
    } catch (error) {
        console.error('Fióktörlési hiba:', error);
        return res.status(500).json({ msg: 'A fiókot most nem sikerült törölni. Próbáld újra később.' });
    }
};

export {
    getFiok,
    patchFiok,
    putMentettAdatok,
    postSzallitasiCim,
    putSzallitasiCim,
    deleteSzallitasiCim,
    putBeallitasok,
    getAdatExport,
    postFiokTorles,
};
