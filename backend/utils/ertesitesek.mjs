import { KESZLET_RIASZTASI_KUSZOB, boltErtesitesiEmail } from '../config/uzlet.mjs';
import RendelesModel from '../models/Rendeles.mjs';
import { dijbekeroFajlnev, dijbekeroPdf } from './dijbekero.mjs';
import { emailKuldes } from './email.mjs';
import { boltLevel, keszletLevel, vevoLevel } from './levelek.mjs';

// Az értesítések a válasz után, a háttérben futnak: egy SMTP-hiba sem akadályozhatja
// meg a rendelés rögzítését. A hibát naplózzuk, és a rendelésnél is eltároljuk.
export const hatterben = (feladat, leiras) => {
    Promise.resolve()
        .then(feladat)
        .catch((error) => console.error(`${leiras}:`, error));
};

export const rendelesErtesitesek = async (rendelesId) => {
    const rendeles = await RendelesModel.findById(rendelesId).lean();
    if (!rendeles) return;

    const pdf = await dijbekeroPdf(rendeles);
    const [vevo, bolt] = await Promise.allSettled([
        emailKuldes({
            cimzett: rendeles.email,
            ...vevoLevel(rendeles),
            csatolmanyok: [{ filename: dijbekeroFajlnev(rendeles), content: pdf, contentType: 'application/pdf' }],
        }),
        emailKuldes({ cimzett: boltErtesitesiEmail(), ...boltLevel(rendeles) }),
    ]);

    const most = new Date();
    const hibak = [vevo, bolt]
        .filter((eredmeny) => eredmeny.status === 'rejected')
        .map((eredmeny) => eredmeny.reason?.message ?? String(eredmeny.reason));
    await RendelesModel.updateOne(
        { _id: rendelesId },
        {
            $set: {
                ertesitesek: {
                    vevo: vevo.status === 'fulfilled' ? most : null,
                    bolt: bolt.status === 'fulfilled' ? most : null,
                    hiba: hibak.join(' | ').slice(0, 500),
                },
            },
        },
    );
    if (hibak.length) console.error('Rendelés-értesítési hiba:', hibak);
};

/**
 * Készletriasztás a boltnak, ha egy rendelés miatt egy termék készlete átlépte a
 * küszöböt (fölötte volt, most alatta van), vagy elfogyott. Így ugyanarról a
 * termékről nem jön minden további rendelésnél újabb levél.
 */
export const keszletRiasztas = async (valtozasok) => {
    const erintett = valtozasok.filter(({ elozo, uj }) =>
        (elozo > KESZLET_RIASZTASI_KUSZOB && uj <= KESZLET_RIASZTASI_KUSZOB) || (elozo > 0 && uj <= 0));
    if (!erintett.length) return [];

    await emailKuldes({ cimzett: boltErtesitesiEmail(), ...keszletLevel(erintett, KESZLET_RIASZTASI_KUSZOB) });
    return erintett;
};
