import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_API_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

const REGI_KEPMEZOK = ['kep1', 'kep2', 'kep3', 'kep'];

// Egy termék képei: az új rekordoknál a `kepek` tömb, a régieknél a külön mezők.
export const termekKepei = (termek) => {
    const kepek = Array.isArray(termek?.kepek) && termek.kepek.length
        ? termek.kepek
        : REGI_KEPMEZOK.map((mezo) => termek?.[mezo]);
    return kepek.filter((kep) => typeof kep === 'string' && kep);
};

// Cloudinary-URL → public_id (pl. .../upload/v123/mappa/kep.jpg → mappa/kep).
// Nem Cloudinary-URL esetén null: ott nincs mit törölni.
const publicId = (kep) => {
    try {
        const url = new URL(kep);
        if (url.hostname !== 'res.cloudinary.com') return null;
        const feltoltesUtan = url.pathname.split('/upload/')[1];
        if (!feltoltesUtan) return null;
        const reszek = feltoltesUtan.split('/');
        const verzio = reszek.findIndex((resz) => /^v\d+$/.test(resz));
        const id = (verzio >= 0 ? reszek.slice(verzio + 1) : reszek).join('/').replace(/\.[^/.]+$/, '');
        return id || null;
    } catch {
        return null;
    }
};

/**
 * A már nem használt képek törlése a Cloudinaryből. Csak az adatbázis sikeres
 * módosítása után hívjuk, így egy sikertelen mentés nem hagy képek nélkül egy
 * terméket. Hiba esetén csak naplóz: a termék mentése ettől még sikeres.
 */
export const kepekTorlese = async (kepek) => {
    const azonositok = [...new Set(kepek.map(publicId).filter(Boolean))];
    const eredmenyek = await Promise.allSettled(
        azonositok.map((id) => cloudinary.uploader.destroy(id)),
    );
    eredmenyek.forEach((eredmeny, index) => {
        if (eredmeny.status === 'rejected' || eredmeny.value?.result === 'error') {
            console.error('Cloudinary képtörlési hiba:', azonositok[index], eredmeny.reason ?? eredmeny.value);
        }
    });
};

// A régi képlistából azok, amelyek az újban már nem szerepelnek.
export const elhagyottKepek = (regiKepek, ujKepek) => {
    const megmarad = new Set(ujKepek);
    return regiKepek.filter((kep) => !megmarad.has(kep));
};
