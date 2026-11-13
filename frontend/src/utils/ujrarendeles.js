import { apiKeres } from './api';
import { termekKepek } from './termek';

// Ugyanaz a legkisebb rendelhető mennyiség, mint a kosárban.
const minimumMennyiseg = (egyseg) => (egyseg === 'db' ? 1 : 0.01);

/**
 * Egy korábbi rendelés tételeihez betölti a termékek mai adatait (ár, készlet), hogy
 * újra kosárba lehessen tenni őket. A megszűnt vagy elfogyott termékek kimaradnak.
 */
export const ujrarendelesElokeszites = async (rendeles) => {
    const betoltott = await Promise.all(
        rendeles.tetelek.map(async (tetel) => {
            try {
                const { termek } = await apiKeres(`/frontend-termekek/${tetel.termekId}`);
                return { tetel, termek };
            } catch (error) {
                if (error.status === 404) return { tetel, termek: null };
                throw error;
            }
        }),
    );

    const eredmeny = { kosarba: [], kimaradt: [], kevesebb: [], arValtozott: 0 };
    for (const { tetel, termek } of betoltott) {
        if (!termek || termek.keszlet < minimumMennyiseg(termek.egyseg)) {
            eredmeny.kimaradt.push(tetel.nev);
            continue;
        }
        eredmeny.kosarba.push({
            termek: { ...termek, kep: termekKepek(termek)[0] },
            mennyiseg: tetel.mennyiseg,
        });
        if (tetel.mennyiseg > termek.keszlet) eredmeny.kevesebb.push(termek.nev);
        if (termek.ar !== tetel.egysegar) eredmeny.arValtozott += 1;
    }
    return eredmeny;
};
