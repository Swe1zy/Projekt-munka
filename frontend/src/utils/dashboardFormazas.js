const forintFormazo = new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: 'HUF',
    maximumFractionDigits: 0,
});
const szamFormazo = new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 2 });
const tomorFormazo = new Intl.NumberFormat('hu-HU', { notation: 'compact', maximumFractionDigits: 1 });
const szazalekFormazo = new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 1 });
const napFormazo = new Intl.DateTimeFormat('hu-HU', { month: 'short', day: 'numeric' });
const hosszuNapFormazo = new Intl.DateTimeFormat('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
const honapFormazo = new Intl.DateTimeFormat('hu-HU', { month: 'short' });
const hosszuHonapFormazo = new Intl.DateTimeFormat('hu-HU', { year: 'numeric', month: 'long' });
const idopontFormazo = new Intl.DateTimeFormat('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const oraFormazo = new Intl.DateTimeFormat('hu-HU', { hour: '2-digit', minute: '2-digit' });

export const forint = (ertek) => forintFormazo.format(ertek || 0);
export const szam = (ertek) => szamFormazo.format(ertek || 0);
export const tomorForint = (ertek) => (Math.abs(ertek) < 10000 ? forint(ertek) : `${tomorFormazo.format(ertek)} Ft`);
export const tomorSzam = (ertek) => (Math.abs(ertek) < 10000 ? szam(ertek) : tomorFormazo.format(ertek));
export const szazalek = (ertek) => `${szazalekFormazo.format(ertek || 0)}%`;
export const idopont = (datum) => idopontFormazo.format(new Date(datum));
export const ora = (datum) => oraFormazo.format(new Date(datum));

// A backend idősor-kulcsai: napi bontásnál „ÉÉÉÉ-HH-NN”, havinál „ÉÉÉÉ-HH”.
const kulcsDatum = (kulcs) => {
    const [ev, honap, nap = 1] = kulcs.split('-').map(Number);
    return new Date(ev, honap - 1, nap);
};

export const idosorCimke = (kulcs, bontas) =>
    bontas === 'honap' ? honapFormazo.format(kulcsDatum(kulcs)) : napFormazo.format(kulcsDatum(kulcs));

export const idosorHosszuCimke = (kulcs, bontas) =>
    bontas === 'honap' ? hosszuHonapFormazo.format(kulcsDatum(kulcs)) : hosszuNapFormazo.format(kulcsDatum(kulcs));

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
