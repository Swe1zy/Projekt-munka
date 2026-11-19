import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import './KategoriaValaszto.css';

const ikonUtak = {
    osszes: (
        <>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </>
    ),
    tobb: (
        <>
            <path d="m12 3 9 4.5-9 4.5-9-4.5z" />
            <path d="m3 12 9 4.5 9-4.5" />
            <path d="m3 16.5 9 4.5 9-4.5" />
        </>
    ),
    teglafal: (
        <>
            <rect x="3" y="5" width="18" height="14" rx="1" />
            <path d="M3 9.67h18M3 14.33h18M9 5v4.67M15 9.67v4.66M9 14.33V19" />
        </>
    ),
    cement: (
        <>
            <path d="M7 3h10l2 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7l2-4z" />
            <path d="M5 7h14M9 12h6" />
        </>
    ),
    omlesztett: (
        <>
            <path d="M2 20h20" />
            <path d="M4 20c1.5-5.5 4.5-9 8-9s6.5 3.5 8 9" />
            <path d="M9 16h.01M13 14.5h.01M15 17.5h.01M11 18h.01" />
        </>
    ),
    faanyag: (
        <>
            <rect x="3" y="4" width="18" height="4" rx="1" />
            <rect x="3" y="10" width="18" height="4" rx="1" />
            <rect x="3" y="16" width="18" height="4" rx="1" />
        </>
    ),
    teto: (
        <>
            <path d="m3 12 9-8 9 8" />
            <path d="M5 10v10h14V10" />
            <path d="M10 20v-6h4v6" />
        </>
    ),
    szigeteles: (
        <>
            <path d="M3 8c3-3 6 3 9 0s6 3 9 0" />
            <path d="M3 13c3-3 6 3 9 0s6 3 9 0" />
            <path d="M3 18c3-3 6 3 9 0s6 3 9 0" />
        </>
    ),
    terko: (
        <>
            <rect x="3" y="3" width="8" height="5" rx="1" />
            <rect x="13" y="3" width="8" height="5" rx="1" />
            <rect x="3" y="10" width="4" height="5" rx="1" />
            <rect x="9" y="10" width="12" height="5" rx="1" />
            <rect x="3" y="17" width="8" height="4" rx="1" />
            <rect x="13" y="17" width="8" height="4" rx="1" />
        </>
    ),
    szerszam: (
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    ),
    nyil: <path d="m6 9 6 6 6-6" />,
    pipa: <path d="m5 12 5 5 9-10" />,
};

const KATEGORIA_IKONOK = {
    'Falazóanyagok': 'teglafal',
    'Cement és kötőanyagok': 'cement',
    'Ömlesztett anyagok és betonok': 'omlesztett',
    'Faanyagok': 'faanyag',
    'Tetőfedés': 'teto',
    'Hőszigetelés': 'szigeteles',
    'Térkövek és burkolatok': 'terko',
    'Szerszámok és kellékek': 'szerszam',
};

const OSZLOPOK = 3;
const ALAP_ELHELYEZES = { felfele: false, maxMagassag: null };
// A gomb és a panel közötti rés, plusz egy kis margó a képernyő szélétől (px).
const PANEL_TAVOLSAG = 16;

// Van-e sticky szülője az elemnek (pl. a termékszűrő oldalsávja)?
const stickyBelul = (elem) => {
    for (let szulo = elem?.parentElement; szulo; szulo = szulo.parentElement) {
        if (getComputedStyle(szulo).position === 'sticky') return true;
    }
    return false;
};

const Ikon = ({ nev, className = 'kv-ikon' }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        {ikonUtak[nev]}
    </svg>
);

/**
 * Képes kategóriaválasztó: a gomb az aktuális választást mutatja, lenyitva
 * csemperácsban jelennek meg a kategóriák. Egyszerre egy kategóriát választ;
 * ha az URL-ben több kategória szerepel, azt a gomb jelzi.
 */
const KategoriaValaszto = ({ kategoriak, kivalasztott, valaszt }) => {
    const [nyitva, setNyitva] = useState(false);
    // A panel iránya és (ha sehol sem fér el egészen) a legnagyobb magassága.
    const [elhelyezes, setElhelyezes] = useState(ALAP_ELHELYEZES);
    const kontenerRef = useRef(null);
    const gombRef = useRef(null);
    const csempeRefek = useRef([]);
    const panelRef = useRef(null);
    const panelId = useId();

    const bezar = () => {
        setNyitva(false);
        setElhelyezes(ALAP_ELHELYEZES);
    };

    // Az első csempe az „Összes”, utána a kategóriák.
    const elemek = [{ nev: '', felirat: 'Összes', ikon: 'osszes' }].concat(
        kategoriak.map((nev) => ({ nev, felirat: nev, ikon: KATEGORIA_IKONOK[nev] ?? 'osszes' })),
    );
    const aktivNev = kivalasztott.length === 1 ? kivalasztott[0] : kivalasztott.length === 0 ? '' : null;

    const gombFelirat = kivalasztott.length > 1
        ? `Több kategória (${kivalasztott.length})`
        : aktivNev || 'Összes kategória';
    const gombIkon = kivalasztott.length > 1
        ? 'tobb'
        : elemek.find((elem) => elem.nev === aktivNev)?.ikon ?? 'osszes';

    // Rajzolás előtt mérjük, hová nyíljon a panel (nyitáskor mindig lefelé nyíló
    // helyzetből indul). Görgethető helyen lefelé nyílik, és a képernyőre görgetjük.
    // Sticky oldalsávban viszont a görgetés nem viszi feljebb, ezért ha lent nem
    // fér el, felfelé nyílik; ha ott sem, a nagyobb hely felé, belső görgetéssel.
    // A görgetés is itt történik, a végleges irány ismeretében: ha egy későbbi
    // lépésben görgetnénk, az még a lefelé nyíló helyzethez igazítaná az oldalt.
    useLayoutEffect(() => {
        if (!nyitva || !panelRef.current || !gombRef.current) return;
        if (!stickyBelul(kontenerRef.current)) {
            panelRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            return;
        }

        const panelMagassag = panelRef.current.getBoundingClientRect().height;
        const gomb = gombRef.current.getBoundingClientRect();
        const navAlja = document.querySelector('.nav-kontener')?.getBoundingClientRect().bottom ?? 0;
        const lentHely = window.innerHeight - gomb.bottom - PANEL_TAVOLSAG;
        const fentHely = gomb.top - navAlja - PANEL_TAVOLSAG;

        if (panelMagassag <= lentHely) return;
        if (panelMagassag <= fentHely) {
            setElhelyezes({ felfele: true, maxMagassag: null });
        } else {
            const felfele = fentHely > lentHely;
            setElhelyezes({ felfele, maxMagassag: Math.max(felfele ? fentHely : lentHely, 160) });
        }
    }, [nyitva]);

    useEffect(() => {
        if (!nyitva) return undefined;

        // Nyitáskor a fókusz a kiválasztott (vagy az első) csempére kerül.
        const kezdo = Math.max(0, elemek.findIndex((elem) => elem.nev === aktivNev));
        csempeRefek.current[kezdo]?.focus({ preventScroll: true });

        const kivulKattintas = (event) => {
            if (!kontenerRef.current?.contains(event.target)) bezar();
        };
        const billentyu = (event) => {
            if (event.key === 'Escape') {
                bezar();
                gombRef.current?.focus();
            }
        };

        document.addEventListener('pointerdown', kivulKattintas);
        document.addEventListener('focusin', kivulKattintas);
        document.addEventListener('keydown', billentyu);
        return () => {
            document.removeEventListener('pointerdown', kivulKattintas);
            document.removeEventListener('focusin', kivulKattintas);
            document.removeEventListener('keydown', billentyu);
        };
        // Csak nyitáskor kell lefutnia, a választás változása nem mozgatja a fókuszt.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nyitva]);

    const kattintas = (nev) => {
        valaszt(nev);
        bezar();
        gombRef.current?.focus();
    };

    // Nyilakkal lehet a rácsban lépkedni.
    const racsBillentyu = (event, index) => {
        const lepes = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: OSZLOPOK, ArrowUp: -OSZLOPOK }[event.key];
        if (lepes === undefined) return;
        event.preventDefault();
        const cel = index + lepes;
        if (cel >= 0 && cel < elemek.length) csempeRefek.current[cel]?.focus();
    };

    return (
        <div className="kv" ref={kontenerRef}>
            <button
                ref={gombRef}
                type="button"
                className="kv-gomb"
                aria-expanded={nyitva}
                aria-controls={panelId}
                aria-label={`Kategória választása: ${gombFelirat}`}
                onClick={() => (nyitva ? bezar() : setNyitva(true))}
            >
                <span className="kv-gomb-ikon">
                    <Ikon nev={gombIkon} />
                </span>
                <span className="kv-gomb-felirat">{gombFelirat}</span>
                <Ikon nev="nyil" className="kv-nyil" />
            </button>

            {nyitva && (
                <div id={panelId} ref={panelRef} className={`kv-panel${elhelyezes.felfele ? ' kv-panel--felfele' : ''}`}
                    style={elhelyezes.maxMagassag ? { maxHeight: elhelyezes.maxMagassag, overflowY: 'auto' } : undefined}
                    role="group" aria-label="Kategóriák">
                    {elemek.map((elem, index) => {
                        const aktiv = elem.nev === aktivNev;
                        return (
                            <button
                                key={elem.nev || 'osszes'}
                                ref={(el) => { csempeRefek.current[index] = el; }}
                                type="button"
                                className={`kv-csempe${aktiv ? ' kv-csempe--aktiv' : ''}`}
                                aria-pressed={aktiv}
                                onClick={() => kattintas(elem.nev)}
                                onKeyDown={(event) => racsBillentyu(event, index)}
                            >
                                <span className="kv-csempe-kep">
                                    <Ikon nev={elem.ikon} />
                                    {aktiv && (
                                        <span className="kv-csempe-pipa">
                                            <Ikon nev="pipa" className="kv-pipa-ikon" />
                                        </span>
                                    )}
                                </span>
                                <span className="kv-csempe-nev">{elem.felirat}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default KategoriaValaszto;
