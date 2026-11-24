import { Fragment, createElement, isValidElement, useSyncExternalStore } from 'react';

// A felület nyelve. A forrásban a szövegek magyarul állnak, t()-be csomagolva:
// a magyar szöveg maga a kulcs, a többi nyelv szótára (src/forditas/*.js) ehhez ad
// fordítást. Ha egy kulcsnak nincs fordítása, a magyar szöveg jelenik meg.
// A választást a böngésző jegyzi meg (eszközönként), a témához és a pénznemhez hasonlóan.
// Ellenőrzés: npm run forditas-ellenorzes (minden t()-kulcsnak van-e fordítása).
export const NYELV_KULCS = 'nyelv';
const ALAP_NYELV = 'hu';

export const NYELVEK = [
    { kod: 'hu', cimke: 'Magyar', helyi: 'hu-HU' },
    { kod: 'en', cimke: 'English', helyi: 'en-GB' },
    { kod: 'de', cimke: 'Deutsch', helyi: 'de-DE' },
    // Héberül csak a szövegek íródnak jobbról balra, az oldal elrendezése nem tükröződik (lásd Rtl.css).
    { kod: 'he', cimke: 'עברית', helyi: 'he-IL' },
];
const KODOK = NYELVEK.map((nyelv) => nyelv.kod);

// A szótárak külön darabokba kerülnek, és csak a kiválasztott nyelvé töltődik le.
const SZOTAR_BETOLTOK = {
    en: () => import('../forditas/en.js'),
    de: () => import('../forditas/de.js'),
    he: () => import('../forditas/he.js'),
};

const feliratkozok = new Set();
let aktualisNyelv = ALAP_NYELV;
let szotar = {};

const mentettNyelv = () => {
    try {
        const mentett = localStorage.getItem(NYELV_KULCS);
        return KODOK.includes(mentett) ? mentett : ALAP_NYELV;
    } catch {
        return ALAP_NYELV;
    }
};

const nyelvAdat = (kod = aktualisNyelv) => NYELVEK.find((nyelv) => nyelv.kod === kod);

const ertesit = () => feliratkozok.forEach((visszahivas) => visszahivas());

// Betölti a szótárat, és csak utána vált: így nem villan fel félig lefordított oldal.
const alkalmaz = async (kod) => {
    const ujSzotar = kod === ALAP_NYELV ? {} : (await SZOTAR_BETOLTOK[kod]()).default;
    aktualisNyelv = kod;
    szotar = ujSzotar;
    // Csak a lang változik, a dir marad ltr: a héber szövegek irányát az Rtl.css adja.
    document.documentElement.lang = nyelvAdat(kod).helyi.slice(0, 2);
    ertesit();
};

export const nyelvValtas = async (uj) => {
    if (!KODOK.includes(uj)) return;
    try {
        localStorage.setItem(NYELV_KULCS, uj);
    } catch {
        // Tiltott tárolónál (pl. privát mód) csak erre a látogatásra érvényes.
    }
    await alkalmaz(uj);
};

// Egyszer, az alkalmazás indulásakor, a kirajzolás előtt. Követi a más fülön
// megváltoztatott beállítást is.
export const nyelvInditasa = async () => {
    window.addEventListener('storage', (event) => {
        if (event.key === NYELV_KULCS) alkalmaz(mentettNyelv()).catch(() => {});
    });
    try {
        await alkalmaz(mentettNyelv());
    } catch {
        // A szótár nem töltődött le (pl. hálózati hiba): marad a magyar felület.
        await alkalmaz(ALAP_NYELV);
    }
};

const feliratkozas = (visszahivas) => {
    feliratkozok.add(visszahivas);
    return () => feliratkozok.delete(visszahivas);
};

export const aktivNyelv = () => aktualisNyelv;
export const useNyelv = () => useSyncExternalStore(feliratkozas, aktivNyelv);

// A számok, dátumok és pénzösszegek formázásához (pl. 'hu-HU', 'en-GB').
export const helyiBeallitas = () => nyelvAdat().helyi;

/**
 * Fordítás. A `{nev}` helyőrzőket a `parameterek` értékeire cseréli. Ha valamelyik
 * érték React-elem (pl. <Link>, <strong>), a szöveg darabjaiból elemlista lesz,
 * így a hivatkozások a mondaton belül, a fordítás szórendje szerint kerülnek a helyükre.
 */
export const t = (kulcs, parameterek) => {
    const szoveg = szotar[kulcs] ?? kulcs;
    if (!parameterek) return szoveg;

    const vanElem = Object.values(parameterek).some(isValidElement);
    if (!vanElem) {
        return szoveg.replace(/\{(\w+)\}/g, (egesz, nev) => (nev in parameterek ? String(parameterek[nev]) : egesz));
    }

    return szoveg.split(/(\{\w+\})/).map((darab, index) => {
        const nev = /^\{(\w+)\}$/.exec(darab)?.[1];
        const ertek = nev && nev in parameterek ? parameterek[nev] : darab;
        return createElement(Fragment, { key: index }, ertek);
    });
};
