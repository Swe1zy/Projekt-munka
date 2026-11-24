import { useEffect, useState } from 'react';
import { API_URL } from '../config';
import { helyiBeallitas, t } from './nyelv';

// Az üzleti beállítások (telephely, nyitvatartás, díjak, választható napok) a
// backendről jönnek. Rövid ideig gyorsítótárazzuk, mert több oldal is használja.
const ERVENYESSEG_MS = 5 * 60 * 1000;
let gyorsitotar = null;

export const beallitasokBetoltese = () => {
    if (!gyorsitotar || Date.now() - gyorsitotar.ido > ERVENYESSEG_MS) {
        const igeret = fetch(`${API_URL}/beallitasok`).then(async (response) => {
            const adat = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(adat.msg || t('A beállításokat nem sikerült betölteni.'));
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

// „ÉÉÉÉ-HH-NN” → „november 17., kedd” (a felület nyelvén)
export const napCimke = (datumKulcs) => {
    const [ev, honap, nap] = datumKulcs.split('-').map(Number);
    const datum = new Date(ev, honap - 1, nap);
    const helyi = helyiBeallitas();
    const nap1 = new Intl.DateTimeFormat(helyi, { month: 'long', day: 'numeric' }).format(datum);
    const hetNap = new Intl.DateTimeFormat(helyi, { weekday: 'long' }).format(datum);
    return `${nap1}, ${hetNap}`;
};

// 0 = vasárnap … 6 = szombat. 2023. január 1. vasárnapra esett.
export const hetNapNeve = (nap) =>
    new Intl.DateTimeFormat(helyiBeallitas(), { weekday: 'long' }).format(new Date(2023, 0, 1 + nap));
