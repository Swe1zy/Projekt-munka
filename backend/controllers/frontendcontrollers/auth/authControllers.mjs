import bcrypt from 'bcrypt';
import UserModel from '../../../models/User.mjs';

const EMAIL_MINTA = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_JELSZO_HOSSZ = 8;
// A bcrypt csak az első 72 bájtot veszi figyelembe.
const MAX_JELSZO_BAJT = 72;
const JELSZO_HIBA = `A jelszó legalább ${MIN_JELSZO_HOSSZ}, legfeljebb ${MAX_JELSZO_BAJT} bájt hosszú lehet!`;

const ervenyesJelszo = (jelszo) =>
    jelszo.length >= MIN_JELSZO_HOSSZ &&
    Buffer.byteLength(jelszo) <= MAX_JELSZO_BAJT;

const publikusFelhasznalo = (user) => ({
    id: user._id,
    nev: user.nev,
    email: user.email,
});

const postRegister = async (req, res) => {
    try {
        const { nev, email, jelszo } = req.body ?? {};

        if (
            typeof nev !== 'string' ||
            typeof email !== 'string' ||
            typeof jelszo !== 'string' ||
            !nev.trim() ||
            !EMAIL_MINTA.test(email.trim())
        ) {
            return res
                .status(400)
                .json({ msg: 'A név és egy érvényes e-mail cím megadása kötelező!' });
        }

        if (!ervenyesJelszo(jelszo)) {
            return res.status(400).json({ msg: JELSZO_HIBA });
        }

        const normalizaltEmail = email.trim().toLowerCase();

        if (await UserModel.exists({ email: normalizaltEmail })) {
            return res
                .status(409)
                .json({ msg: 'Ezzel az e-mail címmel már van regisztrált fiók!' });
        }

        const hash = await bcrypt.hash(jelszo, 10);
        await UserModel.create({
            nev: nev.trim(),
            email: normalizaltEmail,
            jelszo: hash,
        });

        return res
            .status(201)
            .json({ msg: 'Sikeres regisztráció! Most már bejelentkezhetsz.' });
    } catch (error) {
        // Két egyidejű regisztráció esetén az egyedi index dobja ezt a hibát.
        if (error.code === 11000) {
            return res
                .status(409)
                .json({ msg: 'Ezzel az e-mail címmel már van regisztrált fiók!' });
        }

        console.error('Regisztrációs hiba:', error);
        return res
            .status(500)
            .json({ msg: 'Szerverhiba történt, próbáld újra később!' });
    }
};

const postLogin = async (req, res) => {
    try {
        const { email, jelszo } = req.body ?? {};

        if (typeof email !== 'string' || typeof jelszo !== 'string') {
            return res
                .status(400)
                .json({ msg: 'Az e-mail cím és a jelszó megadása kötelező!' });
        }

        const user = await UserModel.findOne({
            email: email.trim().toLowerCase(),
        });
        const egyezik = user ? await bcrypt.compare(jelszo, user.jelszo) : false;

        // Ugyanaz az üzenet, hogy ne derüljön ki, melyik e-mail cím regisztrált.
        if (!egyezik) {
            return res
                .status(401)
                .json({ msg: 'Hibás e-mail cím vagy jelszó!' });
        }

        return res.status(200).json({
            msg: 'Sikeres bejelentkezés!',
            user: publikusFelhasznalo(user),
        });
    } catch (error) {
        console.error('Bejelentkezési hiba:', error);
        return res
            .status(500)
            .json({ msg: 'Szerverhiba történt, próbáld újra később!' });
    }
};

// Token még nincs, ezért a jelenlegi jelszó megadása igazolja a kérés jogosultságát.
const postPassword = async (req, res) => {
    try {
        const { email, jelszo, ujJelszo } = req.body ?? {};

        if (
            typeof email !== 'string' ||
            typeof jelszo !== 'string' ||
            typeof ujJelszo !== 'string'
        ) {
            return res.status(400).json({
                msg: 'Az e-mail cím, a jelenlegi és az új jelszó megadása kötelező!',
            });
        }

        if (!ervenyesJelszo(ujJelszo)) {
            return res.status(400).json({ msg: JELSZO_HIBA });
        }

        const user = await UserModel.findOne({
            email: email.trim().toLowerCase(),
        });
        const egyezik = user ? await bcrypt.compare(jelszo, user.jelszo) : false;

        if (!egyezik) {
            return res
                .status(401)
                .json({ msg: 'A jelenlegi jelszó hibás!' });
        }

        user.jelszo = await bcrypt.hash(ujJelszo, 10);
        await user.save();

        return res
            .status(200)
            .json({ msg: 'A jelszavad sikeresen módosult!' });
    } catch (error) {
        console.error('Jelszómódosítási hiba:', error);
        return res
            .status(500)
            .json({ msg: 'Szerverhiba történt, próbáld újra később!' });
    }
};

export { postRegister, postLogin, postPassword };
