import { useCallback, useEffect, useMemo, useState } from 'react';
import { CartContext, MAX_MENNYISEG } from './CartContext';

const TAROLO_KULCS = 'kosar';
const MIN_MENNYISEG = 0.01;
const minimumMennyiseg = (egyseg) => egyseg === 'db' ? 1 : MIN_MENNYISEG;

const keszletLimit = (termek) => Number.isFinite(termek.keszlet)
    ? Math.max(0, Math.min(MAX_MENNYISEG, termek.keszlet))
    : MAX_MENNYISEG;

const korlatoz = (mennyiseg, max = MAX_MENNYISEG, egyseg) => {
    const maximalis = Math.min(MAX_MENNYISEG, max);
    const minimum = minimumMennyiseg(egyseg);
    if (maximalis < minimum) return 0;
    const korlatozott = Math.min(maximalis, Math.max(minimum, mennyiseg));
    if (egyseg === 'db') return Math.min(Math.floor(maximalis), Math.round(korlatozott));
    return Math.min(maximalis, Math.round(korlatozott * 100) / 100);
};

// A tárolt adat bármi lehet (régi verzió, kézzel szerkesztett), ezért szűrjük.
const betolt = () => {
    try {
        const tarolt = JSON.parse(localStorage.getItem(TAROLO_KULCS));
        if (!Array.isArray(tarolt)) return [];

        return tarolt
            .filter(
                (elem) =>
                    elem &&
                    typeof elem.id === 'string' &&
                    typeof elem.nev === 'string' &&
                        Number.isFinite(elem.ar) &&
                        Number.isFinite(elem.mennyiseg) &&
                        elem.mennyiseg > 0,
            )
                    .map((elem) => ({
                    ...elem,
                    egyseg: elem.egyseg || 'db',
                    mennyiseg: korlatoz(elem.mennyiseg, keszletLimit(elem), elem.egyseg || 'db'),
                    }))
                    .filter((elem) => elem.mennyiseg > 0);
    } catch {
        return [];
    }
};

const CartProvider = ({ children }) => {
    const [tetelek, setTetelek] = useState(betolt);

    useEffect(() => {
        try {
            localStorage.setItem(TAROLO_KULCS, JSON.stringify(tetelek));
        } catch {
            // Ha a tárolás nem elérhető, a kosár az oldal bezárásáig él.
        }
    }, [tetelek]);

    const hozzaad = useCallback((termek, darab = 1) => {
        setTetelek((lista) => {
            const max = keszletLimit(termek);
            const egyseg = termek.egyseg || 'db';
            if (max < minimumMennyiseg(egyseg)) return lista;
            const meglevo = lista.find((elem) => elem.id === termek._id);

            if (meglevo) {
                return lista.map((elem) =>
                    elem.id === termek._id
                        ? { ...elem, egyseg, keszlet: termek.keszlet, mennyiseg: korlatoz(elem.mennyiseg + darab, max, egyseg) }
                        : elem,
                );
            }

            return [
                ...lista,
                {
                    id: termek._id,
                    nev: termek.nev,
                    kategoria: termek.kategoria ?? '',
                    kep: termek.kep ?? '',
                    ar: termek.ar,
                    egyseg,
                    keszlet: termek.keszlet,
                    mennyiseg: korlatoz(darab, max, egyseg),
                },
            ];
        });
    }, []);

    const mennyisegBeallit = useCallback((id, mennyiseg) => {
        setTetelek((lista) =>
            lista.map((elem) =>
                elem.id === id ? { ...elem, mennyiseg: korlatoz(mennyiseg, keszletLimit(elem), elem.egyseg) } : elem,
            ),
        );
    }, []);

    const torol = useCallback((id) => {
        setTetelek((lista) => lista.filter((elem) => elem.id !== id));
    }, []);

    const urit = useCallback(() => setTetelek([]), []);

    const value = useMemo(() => {
        // A tizedes (0,01-es lépésű) árak miatt kerekítünk, hogy ne legyen lebegőpontos hiba.
        const vegosszeg =
            Math.round(
                tetelek.reduce((osszeg, elem) => osszeg + elem.ar * elem.mennyiseg, 0) * 100,
            ) / 100;

        return { tetelek, vegosszeg, hozzaad, mennyisegBeallit, torol, urit };
    }, [tetelek, hozzaad, mennyisegBeallit, torol, urit]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartProvider;
