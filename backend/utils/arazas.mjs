import {
    ALAP_SULY_KG,
    ARAJANLAT_KUSZOB,
    CEGES_KEDVEZMENY_SAVOK,
    KATEGORIA_ALAPERTEKEK,
    RAKLAP_BETETDIJ,
    SZALLITAS,
    SZALLITASI_ZONAK,
} from '../config/uzlet.mjs';

const kerekit = (ertek) => Math.round(ertek * 100) / 100;
const pozitivSzam = (ertek) => typeof ertek === 'number' && Number.isFinite(ertek) && ertek > 0;

// Magyar adószám: 8 számjegy – 1 számjegy – 2 számjegy (kötőjelek nélkül is elfogadjuk).
export const ervenyesAdoszam = (adoszam) => typeof adoszam === 'string' && /^\d{8}-?\d-?\d{2}$/.test(adoszam.trim());

/**
 * Egy termék szállítási paraméterei. A termékre megadott érték elsőbbséget élvez,
 * különben a kategória szerinti alapérték érvényes.
 * raklapon: egységek száma raklaponként; 0 a terméken = kifejezetten nem raklapos.
 */
export const termekParameterek = (termek) => {
    const alap = KATEGORIA_ALAPERTEKEK[termek.kategoria]?.[termek.egyseg] ?? {};
    const suly = typeof termek.suly === 'number' && termek.suly >= 0 ? termek.suly : alap.suly ?? ALAP_SULY_KG;

    let raklapon = null;
    if (pozitivSzam(termek.raklapon)) raklapon = termek.raklapon;
    else if (termek.raklapon !== 0 && pozitivSzam(alap.raklapon)) raklapon = alap.raklapon;

    return { suly, raklapon };
};

export const szallitasiZona = (iranyitoszam) => {
    if (typeof iranyitoszam !== 'string' || !/^\d{4}$/.test(iranyitoszam.trim())) return null;
    const irsz = iranyitoszam.trim();
    let talalat = null;
    for (const zona of SZALLITASI_ZONAK) {
        for (const elotag of zona.elotagok) {
            if (irsz.startsWith(elotag) && (!talalat || elotag.length > talalat.elotag.length)) {
                talalat = { zona, elotag };
            }
        }
    }
    return talalat?.zona ?? null;
};

export const szallitasiDij = ({ iranyitoszam, sulyKg, darus }) => {
    const zona = szallitasiZona(iranyitoszam);
    if (!zona) return null;

    const kisaru = sulyKg <= SZALLITAS.kisaruMaxKg && !darus;
    const fuvarok = kisaru ? 1 : Math.max(1, Math.ceil(sulyKg / SZALLITAS.teherautoMaxKg));
    const alapdij = kisaru ? zona.kisaru : zona.teherauto * fuvarok;
    const darusPotdij = darus ? SZALLITAS.darusPotdij * fuvarok : 0;

    return {
        zona: zona.kulcs,
        zonaNev: zona.nev,
        jarmu: kisaru ? 'Kisteherautó' : 'Teherautó',
        fuvarok,
        darus: Boolean(darus),
        alapdij,
        darusPotdij,
        dij: alapdij + darusPotdij,
    };
};

export const cegesKedvezmenySzazalek = (termekOsszeg, szamlazasiAdatok) => {
    if (szamlazasiAdatok?.tipus !== 'ceg' || !ervenyesAdoszam(szamlazasiAdatok.adoszam)) return 0;
    return CEGES_KEDVEZMENY_SAVOK
        .filter((sav) => termekOsszeg >= sav.minimum)
        .reduce((max, sav) => Math.max(max, sav.szazalek), 0);
};

/**
 * A rendelés teljes díjszámítása. A tételek már ellenőrzött termék-dokumentumok
 * mennyiséggel: [{ termek, mennyiseg }].
 */
export const rendelesOsszesites = ({ tetelek, atvetelModja, iranyitoszam, darus, szamlazasiAdatok }) => {
    const sorok = tetelek.map(({ termek, mennyiseg }) => {
        const { suly, raklapon } = termekParameterek(termek);
        // A 3 tizedesre kerekítés kiszűri a lebegőpontos hibát (pl. 10,2 / 5,1 = 2,0000000004).
        const raklapok = raklapon ? Math.ceil(Math.round((mennyiseg / raklapon) * 1000) / 1000) : 0;
        return {
            termekId: termek._id,
            nev: termek.nev,
            mennyiseg,
            egyseg: termek.egyseg,
            egysegar: termek.ar,
            osszeg: kerekit(termek.ar * mennyiseg),
            sulyKg: mennyiseg * suly,
            raklapok,
        };
    });

    const termekOsszeg = kerekit(sorok.reduce((osszeg, sor) => osszeg + sor.osszeg, 0));
    const kedvezmenySzazalek = cegesKedvezmenySzazalek(termekOsszeg, szamlazasiAdatok);
    const kedvezmeny = Math.round((termekOsszeg * kedvezmenySzazalek) / 100);
    const sulyKg = Math.round(sorok.reduce((osszeg, sor) => osszeg + sor.sulyKg, 0));
    const raklapok = sorok.reduce((osszeg, sor) => osszeg + sor.raklapok, 0);
    const raklapBetetdij = raklapok * RAKLAP_BETETDIJ;

    const hazhoz = atvetelModja === 'hazhozszallitas';
    const szallitas = hazhoz ? szallitasiDij({ iranyitoszam, sulyKg, darus }) : null;
    const kedvezmenyesErtek = termekOsszeg - kedvezmeny;
    const minimumHiany = hazhoz ? Math.max(0, kerekit(SZALLITAS.minimumRendelesiErtek - kedvezmenyesErtek)) : 0;

    return {
        sorok,
        termekOsszeg,
        kedvezmenySzazalek,
        kedvezmeny,
        sulyKg,
        raklapok,
        raklapBetetdij,
        szallitas,
        szallitasiDij: szallitas?.dij ?? 0,
        // Házhozszállításnál ismeretlen zóna (hiányzó/hibás irányítószám) esetén a díj még nem számolható.
        szallitasSzamolhato: !hazhoz || Boolean(szallitas),
        minimumRendelesiErtek: hazhoz ? SZALLITAS.minimumRendelesiErtek : 0,
        minimumHiany,
        vegosszeg: kerekit(kedvezmenyesErtek + (szallitas?.dij ?? 0) + raklapBetetdij),
        arajanlatAjanlott: termekOsszeg >= ARAJANLAT_KUSZOB,
    };
};
