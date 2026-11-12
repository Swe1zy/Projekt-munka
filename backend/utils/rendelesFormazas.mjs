import { KISZALLITAS } from '../config/uzlet.mjs';
import { ATVETELI_MODOK, RENDELES_ALLAPOTOK, kovetkezoAllapotok } from '../models/Rendeles.mjs';

const allapotObjektum = (allapot) => ({ allapot, cimke: RENDELES_ALLAPOTOK[allapot] ?? allapot });

export const rovidAzonosito = (id) => String(id).slice(-6).toUpperCase();

// A betétdíjat a rendeléskori raklaponkénti összeggel számoljuk vissza.
export const raklapAdatok = (rendeles) => {
    const raklapok = rendeles.osszesites?.raklapok ?? 0;
    const betetdij = rendeles.osszesites?.raklapBetetdij ?? 0;
    const visszahozott = Math.min(rendeles.visszahozottRaklapok ?? 0, raklapok);
    const raklaponkent = raklapok ? betetdij / raklapok : 0;
    return {
        raklapok,
        visszahozottRaklapok: visszahozott,
        visszajaroBetetdij: Math.round(visszahozott * raklaponkent),
    };
};

// Egységes rendelés-válasz a vásárlói és az admin felülethez.
// Az admin ezen felül megkapja, milyen állapotokba léptetheti tovább.
export const rendelesValasz = (rendeles, { admin = false } = {}) => {
    const tortenet = rendeles.allapotTortenet?.length
        ? rendeles.allapotTortenet
        : [{ allapot: 'feldolgozasra_var', datum: rendeles.createdAt, megjegyzes: '' }];

    const valasz = {
        id: rendeles._id,
        rovidAzonosito: rovidAzonosito(rendeles._id),
        datum: rendeles.createdAt,
        nev: rendeles.teljesNev,
        email: rendeles.email,
        ...allapotObjektum(rendeles.allapot),
        allapotTortenet: tortenet.map((bejegyzes) => ({
            ...allapotObjektum(bejegyzes.allapot),
            datum: bejegyzes.datum,
            megjegyzes: bejegyzes.megjegyzes || '',
        })),
        atvetelModja: rendeles.atvetelModja,
        atvetelCimke: ATVETELI_MODOK[rendeles.atvetelModja] ?? rendeles.atvetelModja,
        szallitasiAdatok: rendeles.szallitasiAdatok ?? null,
        szamlazasiAdatok: rendeles.szamlazasiAdatok,
        tetelek: rendeles.tetelek.map((tetel) => ({
            termekId: tetel.termekId,
            nev: tetel.nev,
            mennyiseg: tetel.mennyiseg,
            egyseg: tetel.egyseg,
            egysegar: tetel.egysegar,
            osszeg: Math.round(tetel.mennyiseg * tetel.egysegar * 100) / 100,
        })),
        vegosszeg: rendeles.vegosszeg,
        osszesites: rendeles.osszesites ?? null,
        atvetelNapja: rendeles.atvetelNapja ?? null,
        idosav: rendeles.idosav ?? null,
        idosavCimke: KISZALLITAS.idosavok.find((sav) => sav.kulcs === rendeles.idosav)?.cimke ?? null,
        ...raklapAdatok(rendeles),
    };

    if (admin) {
        valasz.vendeg = !rendeles.userId;
        valasz.ertesitesek = rendeles.ertesitesek ?? null;
        valasz.kovetkezoAllapotok = kovetkezoAllapotok(rendeles.allapot, rendeles.atvetelModja).map(allapotObjektum);
    }

    return valasz;
};
