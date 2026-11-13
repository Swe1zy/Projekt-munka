// A rendelés és a profilban mentett adatok közös ellenőrzései.
export const szoveg = (ertek) => (typeof ertek === 'string' ? ertek.trim() : '');

export const cimValid = (cim) => Boolean(cim)
    && /^\d{4}$/.test(cim.iranyitoszam)
    && cim.telepules.length >= 2 && cim.telepules.length <= 100
    && cim.utca.length >= 3 && cim.utca.length <= 200;

export const nevValid = (nev) => nev.length >= 2 && nev.length <= 120;

export const adoszamValid = (adoszam) => adoszam.length >= 5 && adoszam.length <= 32;
