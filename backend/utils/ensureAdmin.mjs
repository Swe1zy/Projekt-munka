import bcrypt from 'bcrypt';
import UserModel from '../models/User.mjs';

const ensureAdmin = async () => {
    const nev = process.env.ADMIN_NAME || 'Admin';
    const email = (process.env.ADMIN_EMAIL || 'admin01@gmail.com').trim().toLowerCase();
    const jelszo = process.env.ADMIN_PASSWORD;

    if (!jelszo) {
        console.warn('Admin fiók nincs inicializálva: állítsd be az ADMIN_PASSWORD értéket a backend .env fájljában.');
        return;
    }
    if (!process.env.AUTH_TOKEN_SECRET) {
        console.warn('Admin belépés nincs aktiválva: állítsd be az AUTH_TOKEN_SECRET értéket a backend .env fájljában.');
        return;
    }
    if (Buffer.byteLength(jelszo) > 72 || jelszo.length < 8) {
        throw new Error('Az ADMIN_PASSWORD legalább 8 karakteres és legfeljebb 72 bájt lehet.');
    }

    const hash = await bcrypt.hash(jelszo, 12);
    await UserModel.findOneAndUpdate(
        { email },
        { $set: { nev, email, jelszo: hash, role: 'admin' } },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    );
    console.log(`Admin fiók készen áll: ${email}`);
};

export default ensureAdmin;
