import { useSyncExternalStore } from 'react';

// Világos / sötét megjelenés. A választást a böngésző jegyzi meg (eszközönként),
// a <html data-tema="…"> attribútumra pedig a Sotet.css szabályai figyelnek.
// Az index.html egy rövid szkripttel már betöltéskor beállítja, hogy ne villanjon.
export const TEMA_KULCS = 'tema';
export const TEMAK = ['vilagos', 'sotet', 'rendszer'];
const ALAP_TEMA = 'vilagos';

const rendszerSotet = () => window.matchMedia?.('(prefers-color-scheme: dark)');
const feliratkozok = new Set();

export const temaBeallitas = () => {
    try {
        const mentett = localStorage.getItem(TEMA_KULCS);
        return TEMAK.includes(mentett) ? mentett : ALAP_TEMA;
    } catch {
        return ALAP_TEMA;
    }
};

const alkalmaz = () => {
    const beallitas = temaBeallitas();
    const sotet = beallitas === 'sotet' || (beallitas === 'rendszer' && Boolean(rendszerSotet()?.matches));
    document.documentElement.dataset.tema = sotet ? 'sotet' : 'vilagos';
};

const ertesit = () => feliratkozok.forEach((visszahivas) => visszahivas());

export const temaValtas = (uj) => {
    try {
        localStorage.setItem(TEMA_KULCS, uj);
    } catch {
        // Tiltott tárolónál (pl. privát mód) csak erre a látogatásra érvényes.
    }
    alkalmaz();
    ertesit();
};

// Egyszer, az alkalmazás indulásakor: követi a rendszer témáját („Rendszer szerint”)
// és a más fülön megváltoztatott beállítást.
export const temaInditasa = () => {
    alkalmaz();
    rendszerSotet()?.addEventListener('change', alkalmaz);
    window.addEventListener('storage', (event) => {
        if (event.key !== TEMA_KULCS) return;
        alkalmaz();
        ertesit();
    });
};

const feliratkozas = (visszahivas) => {
    feliratkozok.add(visszahivas);
    return () => feliratkozok.delete(visszahivas);
};

export const useTema = () => useSyncExternalStore(feliratkozas, temaBeallitas);
