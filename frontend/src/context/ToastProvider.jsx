import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ToastContext } from './ToastContext';
import './Toast.css';

const MAX_ERTESITES = 4;
const ELETTARTAM = { siker: 4000, hiba: 7000 };

const Ertesites = ({ ertesites, bezar }) => {
    const { id, tipus, uzenet } = ertesites;
    // Egérrel vagy fókusszal rajta állva nem tűnik el, hogy el lehessen olvasni.
    const [megall, setMegall] = useState(false);

    useEffect(() => {
        if (megall) return;

        const idozito = window.setTimeout(() => bezar(id), ELETTARTAM[tipus]);

        return () => window.clearTimeout(idozito);
    }, [megall, id, tipus, bezar]);

    return (
        <div
            className={`ertesites ertesites-${tipus}`}
            role={tipus === 'hiba' ? 'alert' : 'status'}
            onMouseEnter={() => setMegall(true)}
            onMouseLeave={() => setMegall(false)}
            onFocus={() => setMegall(true)}
            onBlur={() => setMegall(false)}
        >
            <svg
                className="ertesites-ikon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                {tipus === 'hiba' ? (
                    <>
                        <circle
                            cx="12"
                            cy="12"
                            r="10"
                        />
                        <path d="M12 8v4" />
                        <path d="M12 16h.01" />
                    </>
                ) : (
                    <>
                        <circle
                            cx="12"
                            cy="12"
                            r="10"
                        />
                        <path d="m9 12 2 2 4-4" />
                    </>
                )}
            </svg>
            <p>{uzenet}</p>
            <button
                type="button"
                className="ertesites-bezar"
                aria-label="Értesítés bezárása"
                onClick={() => bezar(id)}
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                </svg>
            </button>
        </div>
    );
};

const ToastProvider = ({ children }) => {
    const [ertesitesek, setErtesitesek] = useState([]);
    const azonosito = useRef(0);

    const bezar = useCallback((id) => {
        setErtesitesek((lista) => lista.filter((elem) => elem.id !== id));
    }, []);

    const mutat = useCallback((tipus, uzenet) => {
        azonosito.current += 1;
        const id = azonosito.current;

        // Ugyanaz az üzenet ne halmozódjon: a régit lecseréljük, az idő újraindul.
        setErtesitesek((lista) =>
            [
                ...lista.filter(
                    (elem) => elem.tipus !== tipus || elem.uzenet !== uzenet,
                ),
                { id, tipus, uzenet },
            ].slice(-MAX_ERTESITES),
        );
    }, []);

    const value = useMemo(
        () => ({
            siker: (uzenet) => mutat('siker', uzenet),
            hiba: (uzenet) => mutat('hiba', uzenet),
        }),
        [mutat],
    );

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div
                className="ertesites-lista"
                aria-label="Értesítések"
            >
                {ertesitesek.map((ertesites) => (
                    <Ertesites
                        key={ertesites.id}
                        ertesites={ertesites}
                        bezar={bezar}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export default ToastProvider;
