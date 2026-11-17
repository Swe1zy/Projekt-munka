// A profil és a pénztár közös szabályai. A backend ugyanezeket ellenőrzi
// (backend/utils/cimek.mjs, backend/utils/arazas.mjs), itt csak az azonnali visszajelzéshez kellenek.

// HTML `pattern` (v flaggel fut, ezért a ( ) / - karaktereket escape-elni kell).
export const TELEFON_MINTA = '[+\\d][\\d\\s\\(\\)\\/\\-]{5,39}';
export const TELEFON_PELDA = '+36 30 123 4567';

// Magyar adószám: 8 számjegy – 1 számjegy – 2 számjegy (kötőjelek nélkül is).
export const ervenyesAdoszam = (adoszam) => /^\d{8}-?\d-?\d{2}$/.test(adoszam.trim());

export const cimSor = (cim) => `${cim.iranyitoszam} ${cim.telepules}, ${cim.utca}`;

export const uresSzallitasiCim = () => ({
    megnevezes: '',
    atvevoNev: '',
    iranyitoszam: '',
    telepules: '',
    utca: '',
    megjegyzes: '',
    behajtas: '',
});

// Egy címjegyzék-elem szerkeszthető mezői (az azonosító nélkül).
export const szallitasiCimMezok = (cim) => ({
    megnevezes: cim?.megnevezes ?? '',
    atvevoNev: cim?.atvevoNev ?? '',
    iranyitoszam: cim?.iranyitoszam ?? '',
    telepules: cim?.telepules ?? '',
    utca: cim?.utca ?? '',
    megjegyzes: cim?.megjegyzes ?? '',
    behajtas: cim?.behajtas ?? '',
});
