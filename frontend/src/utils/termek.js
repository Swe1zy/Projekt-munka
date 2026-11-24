import { helyiBeallitas, t } from './nyelv';
import { idegenPenz } from './penznem';

// Forintban tárolt ár a választott megjelenítési pénznemben (lásd utils/penznem.js).
export const forint = (osszeg) => idegenPenz(osszeg) ?? `${osszeg.toLocaleString(helyiBeallitas())} Ft`;

// Az új termékek a `kepek` tömböt használják, a régi rekordoknál külön mezőkben vannak a képek.
export const termekKepek = (termek) =>
    Array.isArray(termek.kepek) && termek.kepek.length
        ? termek.kepek
        : [termek.kep, termek.kep1, termek.kep2, termek.kep3].filter(Boolean);

// Az adatbázisban magyarul tárolt mértékegységek és kategóriák a felület nyelvén.
// (A kulcsok rögzítettek: az admin termékszerkesztő listái, pages/AdminTermekek.jsx.)
const egysegNevek = () => ({
    db: t('db'),
    csomag: t('csomag'),
    doboz: t('doboz'),
    készlet: t('készlet'),
    pár: t('pár'),
    tekercs: t('tekercs'),
});
export const egysegNev = (egyseg) => egysegNevek()[egyseg] ?? egyseg;

const kategoriaNevek = () => ({
    Falazóanyagok: t('Falazóanyagok'),
    'Cement és kötőanyagok': t('Cement és kötőanyagok'),
    Faanyagok: t('Faanyagok'),
    Tetőfedés: t('Tetőfedés'),
    Hőszigetelés: t('Hőszigetelés'),
    'Szerszámok és kellékek': t('Szerszámok és kellékek'),
    'Ömlesztett anyagok és betonok': t('Ömlesztett anyagok és betonok'),
    'Térkövek és burkolatok': t('Térkövek és burkolatok'),
});
export const kategoriaNev = (kategoria) => kategoriaNevek()[kategoria] ?? kategoria;
