import {
    ARAJANLAT_KUSZOB,
    ASZF_VERZIO,
    CEGES_KEDVEZMENY_SAVOK,
    DIJBEKERO,
    ELADO,
    KATEGORIA_ALAPERTEKEK,
    KISZALLITAS,
    NYITVATARTAS,
    RAKLAP_BETETDIJ,
    SZALLITAS,
    SZALLITASI_ZONAK,
    TARHELY,
    TELEPHELY,
} from '../../config/uzlet.mjs';
import { valaszthatoNapok } from '../../utils/naptar.mjs';

// Nyilvános üzleti adatok a frontendnek (pénztár, kosár, kalkulátor, telephely).
const getBeallitasok = (req, res) => {
    try {
        return res.status(200).json({
            telephely: TELEPHELY,
            nyitvatartas: NYITVATARTAS,
            kiszallitas: {
                idosavok: KISZALLITAS.idosavok,
                rendelesiHataridoOra: KISZALLITAS.rendelesiHataridoOra,
            },
            valaszthatoNapok: {
                hazhozszallitas: valaszthatoNapok('hazhozszallitas'),
                szemelyes_atvetel: valaszthatoNapok('szemelyes_atvetel'),
            },
            szallitas: {
                ...SZALLITAS,
                zonak: SZALLITASI_ZONAK.map(({ kulcs, nev, kisaru, teherauto }) => ({ kulcs, nev, kisaru, teherauto })),
            },
            raklapBetetdij: RAKLAP_BETETDIJ,
            cegesKedvezmenySavok: [...CEGES_KEDVEZMENY_SAVOK].sort((a, b) => a.minimum - b.minimum),
            arajanlatKuszob: ARAJANLAT_KUSZOB,
            kategoriaAlapertekek: KATEGORIA_ALAPERTEKEK,
            // Az ÁSZF oldal adatai. A bankszámla szándékosan kimarad: az csak a díjbekérőn szerepel.
            aszf: {
                verzio: ASZF_VERZIO,
                elado: {
                    nev: ELADO.nev,
                    cim: ELADO.cim,
                    adoszam: ELADO.adoszam,
                    cegjegyzekszam: ELADO.cegjegyzekszam,
                    nyilvantarto: ELADO.nyilvantarto,
                    email: ELADO.email,
                    telefon: ELADO.telefon,
                },
                tarhely: TARHELY,
                fizetesiHataridoNap: DIJBEKERO.fizetesiHataridoNap,
            },
        });
    } catch (error) {
        console.error('Beállítások-hiba:', error);
        return res.status(500).json({ msg: 'A beállításokat most nem sikerült betölteni.' });
    }
};

export { getBeallitasok };
