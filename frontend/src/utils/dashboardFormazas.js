import { helyiBeallitas } from './nyelv';
import { idegenPenz } from './penznem';

// A formázók a felület nyelvét követik (hu-HU, en-GB…); nyelvenként egyszer készülnek el.
const formazok = new Map();
const formazo = (Osztaly, opciok) => {
    const kulcs = `${Osztaly.name}|${helyiBeallitas()}|${JSON.stringify(opciok)}`;
    if (!formazok.has(kulcs)) formazok.set(kulcs, new Osztaly(helyiBeallitas(), opciok));
    return formazok.get(kulcs);
};
const szamFormazo = (opciok) => formazo(Intl.NumberFormat, opciok);
const datumFormazoja = (opciok) => formazo(Intl.DateTimeFormat, opciok);

const forintFormazo = () => szamFormazo({ style: 'currency', currency: 'HUF', maximumFractionDigits: 0 });
const SZAM = { maximumFractionDigits: 2 };
const TOMOR = { notation: 'compact', maximumFractionDigits: 1 };

export const teljesIdopont = (datum) => datumFormazoja({ year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(datum));

// A forintos összegek a választott megjelenítési pénznemben jelennek meg (utils/penznem.js).
export const forint = (ertek) => idegenPenz(ertek || 0) ?? forintFormazo().format(ertek || 0);
export const szam = (ertek) => szamFormazo(SZAM).format(ertek || 0);
export const tomorForint = (ertek) =>
    idegenPenz(ertek || 0, { tomor: true }) ?? (Math.abs(ertek) < 10000 ? forint(ertek) : `${szamFormazo(TOMOR).format(ertek)} Ft`);
export const tomorSzam = (ertek) => (Math.abs(ertek) < 10000 ? szam(ertek) : szamFormazo(TOMOR).format(ertek));
export const szazalek = (ertek) => `${szamFormazo({ maximumFractionDigits: 1 }).format(ertek || 0)}%`;
export const idopont = (datum) => datumFormazoja({ month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(datum));
export const ora = (datum) => datumFormazoja({ hour: '2-digit', minute: '2-digit' }).format(new Date(datum));

// A backend idősor-kulcsai: napi bontásnál „ÉÉÉÉ-HH-NN”, havinál „ÉÉÉÉ-HH”.
const kulcsDatum = (kulcs) => {
    const [ev, honap, nap = 1] = kulcs.split('-').map(Number);
    return new Date(ev, honap - 1, nap);
};

export const idosorCimke = (kulcs, bontas) =>
    bontas === 'honap' ? datumFormazoja({ month: 'short' }).format(kulcsDatum(kulcs)) : datumFormazoja({ month: 'short', day: 'numeric' }).format(kulcsDatum(kulcs));

export const idosorHosszuCimke = (kulcs, bontas) =>
    bontas === 'honap' ? datumFormazoja({ year: 'numeric', month: 'long' }).format(kulcsDatum(kulcs)) : datumFormazoja({ year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(kulcsDatum(kulcs));

// Kerek tengelyértékek (1, 2, 2,5, 5 × 10ⁿ lépésközzel).
export const tengelyErtekek = (maximum, celDarab = 4) => {
    if (!maximum || maximum <= 0) return [0, 1];
    const nyersLepes = maximum / celDarab;
    const nagysagrend = 10 ** Math.floor(Math.log10(nyersLepes));
    const lepes = [1, 2, 2.5, 5, 10].map((szorzo) => szorzo * nagysagrend).find((ertek) => ertek >= nyersLepes);
    const ertekek = [];
    for (let ertek = 0; ertek < maximum + lepes * 0.001; ertek += lepes) ertekek.push(ertek);
    if (ertekek.at(-1) < maximum) ertekek.push(ertekek.at(-1) + lepes);
    return ertekek;
};


export const datum = (ertek) => datumFormazoja({ year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(ertek));

// „ÉÉÉÉ-HH-NN” naptári nap (pl. kiszállítás napja) olvasható alakban: „nov. 18., szerda”.
export const naptariNap = (kulcs) => {
    const [ev, honap, nap] = kulcs.split('-').map(Number);
    return datumFormazoja({ month: 'short', day: 'numeric', weekday: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(ev, honap - 1, nap)));
};

// Időtartam emberi alakban: perc, óra vagy nap.
export const idotartam = (ms) => {
    if (ms === null || ms === undefined) return '–';
    const perc = ms / 60000;
    if (perc < 60) return `${Math.max(1, Math.round(perc))} perc`;
    const ora = perc / 60;
    if (ora < 48) return `${szamFormazo(SZAM).format(Math.round(ora * 10) / 10)} óra`;
    return `${szamFormazo(SZAM).format(Math.round((ora / 24) * 10) / 10)} nap`;
};

// Tömeg kg-ban, 1 tonna felett tonnában.
export const tomeg = (kg) => (kg >= 1000 ? `${szamFormazo(SZAM).format(Math.round(kg / 100) / 10)} t` : `${szamFormazo(SZAM).format(Math.round(kg))} kg`);
