import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import MennyisegValaszto from '../components/MennyisegValaszto';
import { API_URL } from '../config';
import { MAX_MENNYISEG, useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { forint, termekKepek } from '../utils/termek';
import './TermekReszlet.css';

const VisszaLink = () => (
    <Link className="termek-reszlet-vissza" to="/termekek">
        ← Vissza a termékekhez
    </Link>
);

const Galeria = ({ nev, kepek }) => {
    const [aktiv, setAktiv] = useState(0);

    if (kepek.length === 0) {
        return (
            <div className="termek-reszlet-galeria">
                <div className="termek-reszlet-fokep termek-reszlet-nincs-kep" aria-hidden="true">
                    {nev.charAt(0)}
                </div>
            </div>
        );
    }

    return (
        <div className="termek-reszlet-galeria">
            <div className="termek-reszlet-fokep">
                <img src={kepek[aktiv]} alt={`${nev} – ${aktiv + 1}. kép`} />
            </div>
            {kepek.length > 1 && (
                <div className="termek-reszlet-belyegkepek">
                    {kepek.map((kep, index) => (
                        <button
                            key={`${kep}-${index}`}
                            type="button"
                            aria-label={`${index + 1}. kép megjelenítése`}
                            aria-pressed={index === aktiv}
                            onClick={() => setAktiv(index)}
                        >
                            <img src={kep} alt="" loading="lazy" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const Vasarlas = ({ termek, kep }) => {
    const { tetelek, hozzaad, mennyisegBeallit } = useCart();
    const toast = useToast();
    const kosarban = tetelek.find((elem) => elem.id === termek._id)?.mennyiseg ?? 0;
    const egyseg = termek.egyseg || 'db';
    const keszlet = Number.isFinite(termek.keszlet) ? termek.keszlet : MAX_MENNYISEG;
    // Ha a termék már a kosárban van, annak mennyiségéből indulunk, és azt írjuk felül.
    const [mennyiseg, setMennyiseg] = useState(kosarban || Math.min(1, keszlet));
    const valtozott = mennyiseg !== kosarban;

    const mentes = () => {
        if (kosarban > 0) {
            mennyisegBeallit(termek._id, mennyiseg);
            toast.siker(`„${termek.nev}” mennyisége a kosárban: ${mennyiseg} ${egyseg}.`);
        } else {
            hozzaad({ ...termek, kep }, mennyiseg);
            toast.siker(`${mennyiseg} ${egyseg} „${termek.nev}” a kosárba került.`);
        }
    };

    return (
        <section className="termek-reszlet-vasarlas" aria-label="Vásárlás">
            <div className="termek-reszlet-mennyiseg-sor">
                <span className="termek-reszlet-cimke">Mennyiség</span>
                <MennyisegValaszto
                    className="termek-reszlet-mennyiseg"
                    nev={termek.nev}
                    ertek={mennyiseg}
                    beallit={setMennyiseg}
                    max={keszlet}
                />
                <span>Elérhető: {termek.keszlet ?? '—'} {egyseg}</span>
            </div>
            <div className="termek-reszlet-osszesen">
                <span>Összesen</span>
                <strong>{forint(Math.round(termek.ar * mennyiseg * 100) / 100)}</strong>
            </div>
            <button
                type="button"
                className="termek-reszlet-kosarba"
                onClick={mentes}
                disabled={!valtozott || keszlet < 0.01}
            >
                {kosarban === 0
                                        ? `Kosárba (${mennyiseg} ${egyseg})`
                    : valtozott
                                            ? `Kosár frissítése (${mennyiseg} ${egyseg})`
                      : 'A kosárban van'}
            </button>
            {kosarban > 0 && (
                <p className="termek-reszlet-kosarban" aria-live="polite">
                    A kosárban: {kosarban} {egyseg} · <Link to="/kosar">Ugrás a kosárhoz</Link>
                </p>
            )}
        </section>
    );
};

const TermekAdatok = ({ id }) => {
    const [termek, setTermek] = useState(null);
    const [hiba, setHiba] = useState('');

    useEffect(() => {
        const controller = new AbortController();

        (async () => {
            try {
                const response = await fetch(
                    `${API_URL}/frontend-termekek/${encodeURIComponent(id)}`,
                    { signal: controller.signal },
                );
                const valasz = await response.json().catch(() => ({}));

                if (!response.ok) {
                    setHiba(valasz.msg || 'A termék betöltése nem sikerült.');
                    return;
                }
                setTermek(valasz.termek);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    setHiba('A szerver nem érhető el. Próbáld újra később!');
                }
            }
        })();

        return () => controller.abort();
    }, [id]);

    if (hiba) {
        return (
            <section className="termek-reszlet-uzenet" role="alert">
                <h1>{hiba}</h1>
                <VisszaLink />
            </section>
        );
    }

    if (!termek) {
        return (
            <p className="termek-reszlet-betoltes" aria-live="polite">
                Betöltés…
            </p>
        );
    }

    const kepek = termekKepek(termek);

    return (
        <>
            <VisszaLink />
            <article className="termek-reszlet">
                <Galeria nev={termek.nev} kepek={kepek} />
                <div className="termek-reszlet-adatok">
                    {termek.kategoria && (
                        <span className="termek-reszlet-kategoria">{termek.kategoria}</span>
                    )}
                    <h1>{termek.nev}</h1>
                    <p className="termek-reszlet-ar">
                        {forint(termek.ar)} <span>/ {termek.egyseg || 'db'}</span>
                    </p>
                    <h2>Leírás</h2>
                    <p className="termek-reszlet-leiras">{termek.leiras}</p>
                    <Vasarlas termek={termek} kep={kepek[0]} />
                </div>
            </article>
        </>
    );
};

const TermekReszlet = () => {
    const { id } = useParams();

    return (
        <div className="termek-reszlet-kontener">
            {/* A kulcs miatt másik termékre lépve minden állapot alaphelyzetbe áll. */}
            <TermekAdatok key={id} id={id} />
        </div>
    );
};

export default TermekReszlet;
