import { KISZALLITAS, NYITVATARTAS } from '../config/uzlet.mjs';

const IDOZONA = 'Europe/Budapest';
const NAP_MS = 24 * 60 * 60 * 1000;

// Fix dátumú munkaszüneti napok (hónap-nap).
const FIX_UNNEPNAPOK = ['01-01', '03-15', '05-01', '08-20', '10-23', '11-01', '12-24', '12-25', '12-26'];

const formazo = new Intl.DateTimeFormat('en-US', {
    timeZone: IDOZONA,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
});

const budapestiMost = (most) => {
    const r = {};
    for (const { type, value } of formazo.formatToParts(most)) {
        if (type !== 'literal') r[type] = Number(value);
    }
    return r;
};

const ketJegy = (szam) => String(szam).padStart(2, '0');
// A naptári napokkal UTC-ben számolunk, így az óraátállítás nem zavar be.
const kulcs = (datum) => `${datum.getUTCFullYear()}-${ketJegy(datum.getUTCMonth() + 1)}-${ketJegy(datum.getUTCDate())}`;

// Húsvétvasárnap (Meeus–Jones–Butcher-algoritmus, Gergely-naptár).
const husvet = (ev) => {
    const a = ev % 19;
    const b = Math.floor(ev / 100);
    const c = ev % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const honap = Math.floor((h + l - 7 * m + 114) / 31);
    const nap = ((h + l - 7 * m + 114) % 31) + 1;
    return Date.UTC(ev, honap - 1, nap);
};

const unnepnapokCache = new Map();
const unnepnapok = (ev) => {
    if (!unnepnapokCache.has(ev)) {
        const h = husvet(ev);
        // Nagypéntek, húsvéthétfő, pünkösdhétfő.
        const mozgo = [-2, 1, 50].map((eltolas) => kulcs(new Date(h + eltolas * NAP_MS)));
        unnepnapokCache.set(ev, new Set([...FIX_UNNEPNAPOK.map((md) => `${ev}-${md}`), ...mozgo]));
    }
    return unnepnapokCache.get(ev);
};

export const unnepnap = (datumKulcs) => unnepnapok(Number(datumKulcs.slice(0, 4))).has(datumKulcs);

const nyitvaTartoNapok = NYITVATARTAS.filter((nap) => !nap.zarva).map((nap) => nap.nap);

/**
 * A választható kiszállítási vagy átvételi napok („ÉÉÉÉ-HH-NN”) a következő
 * KISZALLITAS.elorefoglalhatoNapok napban. A határidő (pl. 12 óra) után leadott
 * rendelésnél az első alkalmas nap kimarad.
 */
export const valaszthatoNapok = (atvetelModja, most = new Date()) => {
    const engedettNapok = atvetelModja === 'hazhozszallitas' ? KISZALLITAS.napok : nyitvaTartoNapok;
    const { year, month, day, hour } = budapestiMost(most);
    const ma = Date.UTC(year, month - 1, day);

    const alkalmas = [];
    for (let eltolas = 1; eltolas <= KISZALLITAS.elorefoglalhatoNapok; eltolas += 1) {
        const datum = new Date(ma + eltolas * NAP_MS);
        const datumKulcs = kulcs(datum);
        if (engedettNapok.includes(datum.getUTCDay()) && !unnepnap(datumKulcs)) {
            alkalmas.push({ datum: datumKulcs, hetNapja: datum.getUTCDay() });
        }
    }

    return hour >= KISZALLITAS.rendelesiHataridoOra ? alkalmas.slice(1) : alkalmas;
};
