import { useCallback, useEffect, useState } from 'react';
import { API_URL } from '../config';

// Hitelesített JSON-kérés a backendhez. Hibánál a szerver üzenetével dob, a
// `status` mezőből a hívó a HTTP-státuszt is megkapja.
export const apiKeres = async (utvonal, { method = 'GET', body, signal } = {}) => {
    let response;
    try {
        response = await fetch(`${API_URL}${utvonal}`, {
            method,
            credentials: 'include',
            headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
            body: body === undefined ? undefined : JSON.stringify(body),
            signal,
        });
    } catch (error) {
        if (error.name === 'AbortError') throw error;
        throw new Error('A szerver nem érhető el. Próbáld újra később!', { cause: error });
    }

    const adat = await response.json().catch(() => ({}));
    if (!response.ok) {
        const hiba = new Error(adat.msg || 'Váratlan hiba történt. Próbáld újra később!');
        hiba.status = response.status;
        throw hiba;
    }
    return adat;
};

// Hitelesített fájlletöltés (fetch + blob), a fájlnevet a szerver adja meg.
export const fajlLetoltes = async (utvonal, alapFajlnev) => {
    let response;
    try {
        response = await fetch(`${API_URL}${utvonal}`, { credentials: 'include' });
    } catch (error) {
        throw new Error('A szerver nem érhető el. Próbáld újra később!', { cause: error });
    }
    if (!response.ok) {
        const adat = await response.json().catch(() => ({}));
        throw new Error(adat.msg || 'A letöltés nem sikerült.');
    }

    const blob = await response.blob();
    const fajlnev = /filename="([^"]+)"/.exec(response.headers.get('Content-Disposition') ?? '')?.[1] ?? alapFajlnev;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fajlnev;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * Egy GET végpont betöltése és állapota. `utvonal` nélkül (null) nem kér le semmit.
 * Újratöltés közben a korábbi adat megmarad, így a lista nem villan el.
 * `modosit` a már betöltött adatot írja át helyben (pl. egy elem frissítése után).
 */
export const useLekeres = (utvonal) => {
    const [allapot, setAllapot] = useState({ kulcs: null, adat: null, hiba: '' });
    const [verzio, setVerzio] = useState(0);
    const kulcs = utvonal ? `${utvonal}#${verzio}` : null;

    useEffect(() => {
        if (!utvonal) return undefined;
        const vezerlo = new AbortController();

        apiKeres(utvonal, { signal: vezerlo.signal })
            .then((adat) => setAllapot({ kulcs, adat, hiba: '' }))
            .catch((error) => {
                if (error.name === 'AbortError') return;
                setAllapot((elozo) => ({ kulcs, adat: elozo.adat, hiba: error.message }));
            });

        return () => vezerlo.abort();
    }, [utvonal, kulcs]);

    const ujratolt = useCallback(() => setVerzio((elozo) => elozo + 1), []);
    const modosit = useCallback((frissito) => {
        setAllapot((elozo) => (elozo.adat ? { ...elozo, adat: frissito(elozo.adat) } : elozo));
    }, []);

    const friss = allapot.kulcs === kulcs;
    return {
        adat: utvonal ? allapot.adat : null,
        hiba: friss ? allapot.hiba : '',
        betoltes: Boolean(utvonal) && !friss,
        ujratolt,
        modosit,
    };
};
