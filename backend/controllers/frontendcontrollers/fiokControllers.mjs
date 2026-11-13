import bcrypt from 'bcrypt';
import ArajanlatModel from '../../models/Arajanlat.mjs';
import RendelesModel from '../../models/Rendeles.mjs';
import UserModel from '../../models/User.mjs';
import { adoszamValid, cimValid, nevValid, szoveg } from '../../utils/cimek.mjs';
import { clearAuthCookie } from '../../utils/authToken.mjs';
import { rendelesValasz } from '../../utils/rendelesFormazas.mjs';
import { arajanlatValasz } from './arajanlatControllers.mjs';
import { EMAIL_MINTA, publikusFelhasznalo } from './auth/authControllers.mjs';

const MAX_EMAIL_HOSSZ = 200;
// Ezekben az állapotokban a rendelés még teljesítésre vár, ezért a fiók nem törölhető.
const FOLYAMATBAN_LEVO_ALLAPOTOK = ['feldolgozasra_var', 'visszaigazolva', 'kiszallitas_alatt'];
// Az admin fiókot a szerver minden induláskor az .env alapján állítja helyre.
const ADMIN_HIBA = 'Az admin fiók adatai a szerver beállításaiban módosíthatók.';

const fiokValasz = (user) => ({
    user: publikusFelhasznalo(user),
    regisztralt: user.createdAt,
    mentettAdatok: user.mentettAdatok ?? null,
});

const getFiok = async (req, res) => {
    try {
        const user = await UserModel.findById(req.authUser._id).lean();
        return res.status(200).json(fiokValasz(user));
    } catch (error) {
        console.error('Fiók lekérési hiba:', error);
        return res.status(500).json({ msg: 'A fiókod adatait most nem sikerült betölteni.' });
    }
};

// Név és e-mail-cím módosítása. Az e-mail a belépési azonosító is, ezért a
// megváltoztatásához a jelenlegi jelszó is kell.
const patchFiok = async (req, res) => {
    try {
        if (req.authUser.role === 'admin') return res.status(403).json({ msg: ADMIN_HIBA });

        const nev = szoveg(req.body?.nev);
        const email = szoveg(req.body?.email).toLowerCase();
        if (!nevValid(nev)) {
            return res.status(400).json({ msg: 'A név 2 és 120 karakter közötti legyen.' });
        }
        if (!EMAIL_MINTA.test(email) || email.length > MAX_EMAIL_HOSSZ) {
            return res.status(400).json({ msg: 'Adj meg érvényes e-mail-címet.' });
        }

        const user = await UserModel.findById(req.authUser._id);
        if (email !== user.email) {
            const jelszo = typeof req.body?.jelszo === 'string' ? req.body.jelszo : '';
            if (!jelszo || !(await bcrypt.compare(jelszo, user.jelszo))) {
                return res.status(403).json({ msg: 'Az e-mail-cím módosításához add meg a jelenlegi jelszavad!' });
            }
            if (await UserModel.exists({ email, _id: { $ne: user._id } })) {
                return res.status(409).json({ msg: 'Ezzel az e-mail címmel már van regisztrált fiók!' });
            }
        }

        user.nev = nev;
        user.email = email;
        await user.save();

        return res.status(200).json({ msg: 'Az adataidat elmentettük.', ...fiokValasz(user) });
    } catch (error) {
        // Két egyidejű módosításnál az egyedi index dobja ezt a hibát.
        if (error.code === 11000) {
            return res.status(409).json({ msg: 'Ezzel az e-mail címmel már van regisztrált fiók!' });
        }
        console.error('Fiókmódosítási hiba:', error);
        return res.status(500).json({ msg: 'Az adataidat most nem sikerült elmenteni.' });
    }
};

// A pénztárat előtöltő számlázási és szállítási adatok mentése. `szamlazas: null`
// törli a mentett adatokat, `szallitas: null` azt jelenti, hogy a számlázási címre kéri.
const putMentettAdatok = async (req, res) => {
    try {
        const bejovoSzamlazas = req.body?.szamlazas;
        if (bejovoSzamlazas === null) {
            await UserModel.updateOne({ _id: req.authUser._id }, { $unset: { mentettAdatok: 1 } });
            return res.status(200).json({ msg: 'A mentett adataidat töröltük.', mentettAdatok: null });
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

        let szallitas;
        const bejovoSzallitas = req.body?.szallitas;
        if (bejovoSzallitas) {
            szallitas = {
                atvevoNev: szoveg(bejovoSzallitas.atvevoNev),
                iranyitoszam: szoveg(bejovoSzallitas.iranyitoszam),
                telepules: szoveg(bejovoSzallitas.telepules),
                utca: szoveg(bejovoSzallitas.utca),
                megjegyzes: szoveg(bejovoSzallitas.megjegyzes).slice(0, 500),
            };
            if (!nevValid(szallitas.atvevoNev) || !cimValid(szallitas)) {
                return res.status(400).json({ msg: 'Töltsd ki helyesen a szállítási nevet és címet (az irányítószám 4 számjegy).' });
            }
        }

        const mentettAdatok = szallitas ? { szamlazas, szallitas } : { szamlazas };
        await UserModel.updateOne({ _id: req.authUser._id }, { $set: { mentettAdatok } }, { runValidators: true });

        return res.status(200).json({ msg: 'A számlázási és szállítási adataidat elmentettük.', mentettAdatok });
    } catch (error) {
        console.error('Mentett adatok mentési hibája:', error);
        return res.status(500).json({ msg: 'Az adataidat most nem sikerült elmenteni.' });
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

        const adat = {
            exportalva: new Date(),
            fiok: {
                nev: user.nev,
                email: user.email,
                regisztralt: user.createdAt,
                aszfElfogadas: user.aszfElfogadas ?? null,
            },
            mentettAdatok: user.mentettAdatok ?? null,
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

export { getFiok, patchFiok, putMentettAdatok, getAdatExport, postFiokTorles };
