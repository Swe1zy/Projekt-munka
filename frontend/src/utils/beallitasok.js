import { useEffect, useState } from 'react';
import { API_URL } from '../config';

// Az üzleti beállítások (telephely, nyitvatartás, díjak, választható napok) a
// backendről jönnek. Rövid ideig gyorsítótárazzuk, mert több oldal is használja.
const ERVENYESSEG_MS = 5 * 60 * 1000;
let gyorsitotar = null;

export const beallitasokBetoltese = () => {
    if (!gyorsitotar || Date.now() - gyorsitotar.ido > ERVENYESSEG_MS) {
        const igeret = fetch(`${API_URL}/beallitasok`).then(async (response) => {
            const adat = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(adat.msg || 'A beállításokat nem sikerült betölteni.');
            return adat;
        });
        igeret.catch(() => {
            gyorsitotar = null;
        });
        gyorsitotar = { ido: Date.now(), igeret };
    }
    return gyorsitotar.igeret;
};

export const useBeallitasok = () => {
    const [allapot, setAllapot] = useState({ adat: null, hiba: '' });

    useEffect(() => {
        let aktiv = true;
        beallitasokBetoltese()
            .then((adat) => {
                if (aktiv) setAllapot({ adat, hiba: '' });
            })
            .catch((error) => {
                if (aktiv) setAllapot({ adat: null, hiba: error.message });
            });
        return () => {
            aktiv = false;
        };
    }, []);

    return allapot;
};

// Ugyanaz a szabály, mint a backend termekParameterek-je: a termék saját értéke
// elsőbbséget élvez, különben a kategória szerinti alapérték érvényes.
export const termekRaklapon = (termek, beallitasok) => {
    if (typeof termek.raklapon === 'number' && termek.raklapon > 0) return termek.raklapon;
    if (termek.raklapon === 0) return null;
    return beallitasok?.kategoriaAlapertekek?.[termek.kategoria]?.[termek.egyseg]?.raklapon ?? null;
};

const NAP_NEVEK = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];
const datumFormazo = new Intl.DateTimeFormat('hu-HU', { month: 'long', day: 'numeric' });

// „ÉÉÉÉ-HH-NN” → „november 17., kedd”
export const napCimke = (datumKulcs) => {
    const [ev, honap, nap] = datumKulcs.split('-').map(Number);
    const datum = new Date(ev, honap - 1, nap);
    return `${datumFormazo.format(datum)}, ${NAP_NEVEK[datum.getDay()]}`;
};

export const hetNapNeve = (nap) => NAP_NEVEK[nap];
