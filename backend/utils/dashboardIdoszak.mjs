// A dashboard és a CSV-export időszakkezelése. Minden dátumot magyar idő szerint
// értelmezünk, hogy a napi/havi bontás a bolt naptári napjaihoz igazodjon (nem az UTC-éjfélhez).

export const IDOZONA = 'Europe/Budapest';
export const NAP_MS = 24 * 60 * 60 * 1000;

export const IDOSZAKOK = {
    '7nap': { cimke: 'Utolsó 7 nap', osszevetes: 'előző 7 nap', bontas: 'nap', napok: 7 },
    '30nap': { cimke: 'Utolsó 30 nap', osszevetes: 'előző 30 nap', bontas: 'nap', napok: 30 },
    '90nap': { cimke: 'Utolsó 90 nap', osszevetes: 'előző 90 nap', bontas: 'nap', napok: 90 },
    '12honap': { cimke: 'Utolsó 12 hónap', osszevetes: 'előző 12 hónap', bontas: 'honap', honapok: 12 },
};
export const ALAP_IDOSZAK = '30nap';
export const EGYEDI_IDOSZAK = 'egyedi';
export const OSSZEVETESEK = ['elozo', 'tavaly'];

// Egyedi időszak legfeljebb 3 év lehet; 92 napig napi, felette havi bontásban.
const MAX_EGYEDI_NAP = 3 * 366;
const NAPI_BONTAS_MAX_NAP = 92;

const idoFormazo = new Intl.DateTimeFormat('en-US', {
    timeZone: IDOZONA,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
});

const cimkeFormazo = new Intl.DateTimeFormat('hu-HU', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' });

export const budapestiReszek = (datum) => {
    const reszek = {};
    for (const { type, value } of idoFormazo.formatToParts(datum)) {
        if (type !== 'literal') reszek[type] = Number(value);
    }
    return reszek;
};

const ketJegy = (szam) => String(szam).padStart(2, '0');
const utcNapKulcs = (datum) => `${datum.getUTCFullYear()}-${ketJegy(datum.getUTCMonth() + 1)}-${ketJegy(datum.getUTCDate())}`;

// Az adott időpont magyar naptári napja „ÉÉÉÉ-HH-NN” alakban.
export const napKulcs = (datum) => {
    const { year, month, day } = budapestiReszek(datum);
    return `${year}-${ketJegy(month)}-${ketJegy(day)}`;
};

// Napkulcs eltolása n nappal (tisztán naptári számolás, óraátállítástól független).
export const napEltolas = (kulcs, napok) => {
    const [ev, honap, nap] = kulcs.split('-').map(Number);
    return utcNapKulcs(new Date(Date.UTC(ev, honap - 1, nap + napok)));
};

// A magyar idő eltérése az UTC-től (téli/nyári időszámítás szerint 1 vagy 2 óra).
const idozonaEltolasMs = (datum) => {
    const r = budapestiReszek(datum);
    const helyiMintUtc = Date.UTC(r.year, r.month - 1, r.day, r.hour, r.minute, r.second);
    return helyiMintUtc - Math.floor(datum.getTime() / 1000) * 1000;
};

// Az adott magyar naptári nap éjfele UTC-időpontként. A hónap/nap túlcsordulhat
// (pl. nap = -5), ezt a Date.UTC helyesen visszaszámolja.
export const budapestiEjfel = (ev, honap, nap) => {
    const utcEjfel = Date.UTC(ev, honap - 1, nap);
    return new Date(utcEjfel - idozonaEltolasMs(new Date(utcEjfel)));
};

const kulcsEjfel = (kulcs) => {
    const [ev, honap, nap] = kulcs.split('-').map(Number);
    return budapestiEjfel(ev, honap, nap);
};

// Ugyanaz a magyar naptári időpont egy évvel korábban (február 29. → március 1.).
const egyEvvelKorabban = (datum) => {
    const r = budapestiReszek(datum);
    const ejfel = budapestiEjfel(r.year - 1, r.month, r.day);
    return new Date(ejfel.getTime() + ((r.hour * 60 + r.minute) * 60 + r.second) * 1000);
};

// Érvényes, létező naptári nap-e („ÉÉÉÉ-HH-NN”).
const ervenyesNap = (ertek) => {
    if (typeof ertek !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(ertek)) return false;
    const [ev, honap, nap] = ertek.split('-').map(Number);
    return ev >= 2000 && utcNapKulcs(new Date(Date.UTC(ev, honap - 1, nap))) === ertek;
};

const napokKozott = (tol, ig) => {
    const [a, b] = [tol, ig].map((kulcs) => {
        const [ev, honap, nap] = kulcs.split('-').map(Number);
        return Date.UTC(ev, honap - 1, nap);
    });
    return Math.round((b - a) / NAP_MS) + 1;
};

const napCimke = (kulcs) => {
    const [ev, honap, nap] = kulcs.split('-').map(Number);
    return cimkeFormazo.format(new Date(Date.UTC(ev, honap - 1, nap)));
};

/**
 * A kérés paramétereiből (idoszak, tol, ig, osszevetes) a lekérdezett és az
 * összehasonlító időszak határai. A határ a kezdetnél zárt, a végnél nyitott.
 * Hibás paraméternél { hiba } a válasz.
 */
export const idoszakFeldolgozas = (query, most = new Date()) => {
    const kulcs = typeof query.idoszak === 'string' ? query.idoszak : ALAP_IDOSZAK;
    const osszevetes = typeof query.osszevetes === 'string' ? query.osszevetes : 'elozo';
    if (!OSSZEVETESEK.includes(osszevetes)) {
        return { hiba: `Érvénytelen összevetés. Lehetséges értékek: ${OSSZEVETESEK.join(', ')}.` };
    }

    let kezdet;
    let veg;
    let bontas;
    let cimke;
    let elozoCimke;
    let tol;
    let ig;

    if (kulcs === EGYEDI_IDOSZAK) {
        ({ tol, ig } = query);
        if (!ervenyesNap(tol) || !ervenyesNap(ig)) {
            return { hiba: 'Egyedi időszakhoz add meg a kezdő és a záró napot (ÉÉÉÉ-HH-NN).' };
        }
        const ma = napKulcs(most);
        if (tol > ig) return { hiba: 'A kezdő nap nem lehet későbbi a záró napnál.' };
        if (ig > ma) return { hiba: 'A záró nap nem lehet a jövőben.' };
        const napok = napokKozott(tol, ig);
        if (napok > MAX_EGYEDI_NAP) return { hiba: 'Az egyedi időszak legfeljebb 3 év lehet.' };

        kezdet = kulcsEjfel(tol);
        veg = ig === ma ? most : kulcsEjfel(napEltolas(ig, 1));
        bontas = napok <= NAPI_BONTAS_MAX_NAP ? 'nap' : 'honap';
        cimke = tol === ig ? napCimke(tol) : `${napCimke(tol)} – ${napCimke(ig)}`;
        elozoCimke = `előző ${napok} nap`;
    } else if (Object.hasOwn(IDOSZAKOK, kulcs)) {
        const idoszak = IDOSZAKOK[kulcs];
        const { year, month, day } = budapestiReszek(most);
        kezdet = idoszak.bontas === 'honap'
            ? budapestiEjfel(year, month - (idoszak.honapok - 1), 1)
            : budapestiEjfel(year, month, day - (idoszak.napok - 1));
        veg = most;
        bontas = idoszak.bontas;
        cimke = idoszak.cimke;
        elozoCimke = idoszak.osszevetes;
    } else {
        return {
            hiba: `Érvénytelen időszak. Lehetséges értékek: ${[...Object.keys(IDOSZAKOK), EGYEDI_IDOSZAK].join(', ')}.`,
        };
    }

    // Az „előző” összevetés pontosan ugyanolyan hosszú, közvetlenül előtte lévő időszak;
    // a „tavaly” ugyanez a naptári időszak egy évvel korábban.
    const [osszKezdet, osszVeg] = osszevetes === 'tavaly'
        ? [egyEvvelKorabban(kezdet), egyEvvelKorabban(veg)]
        : [new Date(kezdet.getTime() - (veg.getTime() - kezdet.getTime())), kezdet];

    return {
        kulcs,
        cimke,
        bontas,
        kezdet,
        veg,
        osszKezdet,
        osszVeg,
        osszevetes,
        osszevetesCimke: osszevetes === 'tavaly' ? 'tavaly ugyanekkor' : elozoCimke,
        tol: tol ?? null,
        ig: ig ?? null,
    };
};

// Az idősor összes kulcsa (napi: „ÉÉÉÉ-HH-NN”, havi: „ÉÉÉÉ-HH”) a [kezdet, veg) időszakban.
export const idosorKulcsok = ({ bontas, kezdet, veg }) => {
    const utolso = new Date(veg.getTime() - 1);
    if (bontas === 'honap') {
        const k = budapestiReszek(kezdet);
        const u = budapestiReszek(utolso);
        const darab = (u.year - k.year) * 12 + (u.month - k.month) + 1;
        return Array.from({ length: darab }, (_, index) => {
            const datum = new Date(Date.UTC(k.year, k.month - 1 + index, 1));
            return `${datum.getUTCFullYear()}-${ketJegy(datum.getUTCMonth() + 1)}`;
        });
    }
    const elso = napKulcs(kezdet);
    return Array.from({ length: napokKozott(elso, napKulcs(utolso)) }, (_, index) => napEltolas(elso, index));
};
