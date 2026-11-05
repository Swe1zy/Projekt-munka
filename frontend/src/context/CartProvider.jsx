import { useCallback, useEffect, useMemo, useState } from 'react';
import { CartContext, MAX_MENNYISEG } from './CartContext';

const TAROLO_KULCS = 'kosar';

const korlatoz = (mennyiseg) => Math.min(MAX_MENNYISEG, Math.max(1, mennyiseg));

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
                    Number.isInteger(elem.mennyiseg) &&
                    elem.mennyiseg > 0,
            )
            .map((elem) => ({ ...elem, mennyiseg: korlatoz(elem.mennyiseg) }));
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
            const meglevo = lista.find((elem) => elem.id === termek._id);

            if (meglevo) {
                return lista.map((elem) =>
                    elem.id === termek._id
                        ? { ...elem, mennyiseg: korlatoz(elem.mennyiseg + darab) }
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
                    mennyiseg: korlatoz(darab),
                },
            ];
        });
    }, []);

    const mennyisegBeallit = useCallback((id, mennyiseg) => {
        setTetelek((lista) =>
            lista.map((elem) =>
                elem.id === id ? { ...elem, mennyiseg: korlatoz(mennyiseg) } : elem,
            ),
        );
    }, []);

    const torol = useCallback((id) => {
        setTetelek((lista) => lista.filter((elem) => elem.id !== id));
    }, []);

    const urit = useCallback(() => setTetelek([]), []);

    const value = useMemo(() => {
        const osszesDarab = tetelek.reduce((osszeg, elem) => osszeg + elem.mennyiseg, 0);
        // A tizedes (0,01-es lépésű) árak miatt kerekítünk, hogy ne legyen lebegőpontos hiba.
        const vegosszeg =
            Math.round(
                tetelek.reduce((osszeg, elem) => osszeg + elem.ar * elem.mennyiseg, 0) * 100,
            ) / 100;

        return { tetelek, osszesDarab, vegosszeg, hozzaad, mennyisegBeallit, torol, urit };
    }, [tetelek, hozzaad, mennyisegBeallit, torol, urit]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartProvider;
