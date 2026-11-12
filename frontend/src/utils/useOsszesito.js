import { useEffect, useState } from 'react';
import { API_URL } from '../config';

/**
 * Díj-előnézet a backendtől (termékérték, céges kedvezmény, szállítási díj,
 * raklap-betétdíj, végösszeg). A számítás ugyanaz, mint rendeléskor, így a
 * vásárló pontosan azt látja, amit fizetni fog. A kérés rövid késleltetéssel
 * indul, hogy gépelés közben ne menjen minden leütésre.
 */
export const useOsszesito = (keres) => {
    const kulcs = keres ? JSON.stringify(keres) : null;
    const [valasz, setValasz] = useState({ kulcs: null, adat: null, hiba: '' });

    useEffect(() => {
        if (!kulcs) return undefined;
        const vezerlo = new AbortController();
        const idozito = window.setTimeout(() => {
            fetch(`${API_URL}/rendelesek/osszesito`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: kulcs,
                signal: vezerlo.signal,
            })
                .then(async (response) => {
                    const adat = await response.json().catch(() => ({}));
                    if (!response.ok) throw new Error(adat.msg || 'A díjakat nem sikerült kiszámolni.');
                    setValasz({ kulcs, adat, hiba: '' });
                })
                .catch((error) => {
                    if (error.name === 'AbortError') return;
                    setValasz((elozo) => ({ ...elozo, kulcs, hiba: error.message }));
                });
        }, 250);

        return () => {
            window.clearTimeout(idozito);
            vezerlo.abort();
        };
    }, [kulcs]);

    const aktualis = valasz.kulcs === kulcs;
    return {
        // Újraszámolás közben az előző eredmény látszik tovább (nincs villogás).
        osszesites: valasz.adat?.osszesites ?? null,
        keszlethiany: valasz.adat?.keszlethiany ?? [],
        betoltes: Boolean(kulcs) && !aktualis,
        hiba: aktualis ? valasz.hiba : '',
    };
};
