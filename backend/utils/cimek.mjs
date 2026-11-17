// A rendelés és a profilban mentett adatok közös ellenőrzései.
export const szoveg = (ertek) => (typeof ertek === 'string' ? ertek.trim() : '');

export const cimValid = (cim) => Boolean(cim)
    && /^\d{4}$/.test(cim.iranyitoszam)
    && cim.telepules.length >= 2 && cim.telepules.length <= 100
    && cim.utca.length >= 3 && cim.utca.length <= 200;

export const nevValid = (nev) => nev.length >= 2 && nev.length <= 120;

export const adoszamValid = (adoszam) => adoszam.length >= 5 && adoszam.length <= 32;

// Telefonszám: +, számjegyek, szóköz, zárójel, perjel, kötőjel; legalább 6 számjegy.
export const MAX_TELEFON_HOSSZ = 40;
export const telefonValid = (telefon) => telefon.length <= MAX_TELEFON_HOSSZ
    && /^[+\d][\d\s()/-]{5,}$/.test(telefon)
    && (telefon.match(/\d/g)?.length ?? 0) >= 6;

export const MAX_MEGJEGYZES_HOSSZ = 500;
export const MAX_BEHAJTAS_HOSSZ = 300;
export const MAX_MEGNEVEZES_HOSSZ = 60;

/**
 * A kliensről érkező szállítási cím normalizálása (név, cím, futárnak szóló
 * megjegyzés, behajtási/lerakodási információ). Eredmény: { cim } vagy { hiba }.
 */
export const szallitasiCimBetoltes = (bejovo) => {
    const cim = {
        atvevoNev: szoveg(bejovo?.atvevoNev),
        iranyitoszam: szoveg(bejovo?.iranyitoszam),
        telepules: szoveg(bejovo?.telepules),
        utca: szoveg(bejovo?.utca),
        megjegyzes: szoveg(bejovo?.megjegyzes).slice(0, MAX_MEGJEGYZES_HOSSZ),
        behajtas: szoveg(bejovo?.behajtas).slice(0, MAX_BEHAJTAS_HOSSZ),
    };
    if (!nevValid(cim.atvevoNev) || !cimValid(cim)) {
        return { hiba: 'Töltsd ki helyesen a szállítási nevet és címet (az irányítószám 4 számjegy).' };
    }
    return { cim };
};
