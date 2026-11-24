import { useSyncExternalStore } from 'react';
import { helyiBeallitas } from './nyelv';

// Megjelenítési pénznem. Az áruház minden ára forintban van tárolva és forintban is
// fizetendő; a többi pénznem csak tájékoztató átszámítás az aktuális árfolyammal.
// A választást a böngésző jegyzi meg (eszközönként), a témához hasonlóan.
export const PENZNEM_KULCS = 'penznem';
const ARFOLYAM_KULCS = 'arfolyamok';
const ALAP_PENZNEM = 'HUF';

export const PENZNEMEK = [
    { kod: 'HUF', cimke: 'Forint', jel: 'Ft' },
    { kod: 'EUR', cimke: 'Euró', jel: '€' },
    { kod: 'USD', cimke: 'Amerikai dollár', jel: '$' },
    { kod: 'GBP', cimke: 'Angol font', jel: '£' },
    { kod: 'CHF', cimke: 'Svájci frank', jel: 'CHF' },
];
const KODOK = PENZNEMEK.map((penznem) => penznem.kod);

// 1 Ft hány egységet ér. Tartalék arra az esetre, ha az árfolyam-szolgáltatás
// nem érhető el; induláskor a friss (napi) EKB-árfolyam felülírja.
// (2026. novemberi értékek.)
const TARTALEK_ARFOLYAMOK = { HUF: 1, EUR: 1 / 372, USD: 1 / 340, GBP: 1 / 445, CHF: 1 / 405 };
const ARFOLYAM_URL = `https://api.frankfurter.dev/v1/latest?base=HUF&symbols=${KODOK.filter((kod) => kod !== 'HUF').join(',')}`;
const ARFOLYAM_ELETTARTAM_MS = 12 * 60 * 60 * 1000;

const feliratkozok = new Set();
let arfolyamok = { ...TARTALEK_ARFOLYAMOK, datum: null };

const mentettArfolyamok = () => {
    try {
        const mentett = JSON.parse(localStorage.getItem(ARFOLYAM_KULCS));
        if (mentett && KODOK.every((kod) => Number(mentett.rates?.[kod]) > 0)) return mentett;
    } catch {
        // Hibás vagy tiltott tároló: marad a tartalék.
    }
    return null;
};

export const penznemBeallitas = () => {
    try {
        const mentett = localStorage.getItem(PENZNEM_KULCS);
        return KODOK.includes(mentett) ? mentett : ALAP_PENZNEM;
    } catch {
        return ALAP_PENZNEM;
    }
};

const ertesit = () => feliratkozok.forEach((visszahivas) => visszahivas());

export const penznemValtas = (uj) => {
    if (!KODOK.includes(uj)) return;
    try {
        localStorage.setItem(PENZNEM_KULCS, uj);
    } catch {
        // Tiltott tárolónál (pl. privát mód) csak erre a látogatásra érvényes.
    }
    ertesit();
};

const arfolyamBetoltes = async () => {
    const mentett = mentettArfolyamok();
    if (mentett) {
        arfolyamok = { ...mentett.rates, datum: mentett.datum };
        if (Date.now() - mentett.lekerve < ARFOLYAM_ELETTARTAM_MS) return;
    }
    try {
        const valasz = await fetch(ARFOLYAM_URL);
        if (!valasz.ok) return;
        const adat = await valasz.json();
        const rates = { HUF: 1, ...adat.rates };
        if (!KODOK.every((kod) => Number(rates[kod]) > 0)) return;
        arfolyamok = { ...rates, datum: adat.date ?? null };
        try {
            localStorage.setItem(ARFOLYAM_KULCS, JSON.stringify({ rates, datum: adat.date ?? null, lekerve: Date.now() }));
        } catch {
            // Mentés nélkül is használható.
        }
        ertesit();
    } catch {
        // Hálózati hiba: marad a mentett vagy a tartalék árfolyam.
    }
};

// Egyszer, az alkalmazás indulásakor: árfolyamok betöltése, és a más fülön
// megváltoztatott pénznem követése.
export const penznemInditasa = () => {
    arfolyamBetoltes();
    window.addEventListener('storage', (event) => {
        if (event.key === PENZNEM_KULCS) ertesit();
    });
};

const feliratkozas = (visszahivas) => {
    feliratkozok.add(visszahivas);
    return () => feliratkozok.delete(visszahivas);
};

// Pillanatkép: változik, ha a pénznem vagy az árfolyam frissül, így a feliratkozott
// komponens mindkét esetben újrarajzol.
let pillanatkep = null;
const aktualis = () => {
    const kod = penznemBeallitas();
    if (pillanatkep?.kod !== kod || pillanatkep.arfolyamok !== arfolyamok) {
        pillanatkep = { kod, arfolyamok };
    }
    return pillanatkep;
};

export const usePenznem = () => useSyncExternalStore(feliratkozas, aktualis).kod;
export const useArfolyamAllapot = () => useSyncExternalStore(feliratkozas, aktualis);

const formazok = new Map();
const formazo = (kod, tomor) => {
    const helyi = helyiBeallitas();
    const kulcs = `${kod}-${tomor}-${helyi}`;
    if (!formazok.has(kulcs)) {
        formazok.set(kulcs, new Intl.NumberFormat(helyi, tomor
            ? { notation: 'compact', maximumFractionDigits: 1 }
            : { style: 'currency', currency: kod, currencyDisplay: 'narrowSymbol', minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }
    return formazok.get(kulcs);
};

export const atvaltas = (forintOsszeg, kod = penznemBeallitas()) => (Number(forintOsszeg) || 0) * arfolyamok[kod];

export const penznemJel = (kod = penznemBeallitas()) => PENZNEMEK.find((penznem) => penznem.kod === kod)?.jel ?? kod;

/**
 * Forintban megadott összeg a választott pénznemben. Forintnál `null`-t ad, ilyenkor
 * a hívó a saját, megszokott forint-formátumát használja.
 *  - tomor: rövid alak nagy számokhoz (pl. „12,5 E €”), a dashboard tengelyeihez
 */
export const idegenPenz = (forintOsszeg, { tomor = false } = {}) => {
    const kod = penznemBeallitas();
    if (kod === 'HUF') return null;
    const ertek = atvaltas(forintOsszeg, kod);
    if (tomor && Math.abs(ertek) >= 10000) return `${formazo(kod, true).format(ertek)} ${penznemJel(kod)}`;
    return formazo(kod, false).format(ertek);
};
