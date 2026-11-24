import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import MennyisegValaszto from '../components/MennyisegValaszto';
import { API_URL } from '../config';
import { MAX_MENNYISEG, useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { termekRaklapon, useBeallitasok } from '../utils/beallitasok';
import { egysegNev, forint, kategoriaNev, termekKepek } from '../utils/termek';
import { useBejelentkezesKell } from '../utils/useBejelentkezesKell';
import './TermekReszlet.css';
import { helyiBeallitas, t } from '../utils/nyelv';

const VisszaLink = () => (
    <Link className="termek-reszlet-vissza" to="/termekek">
        ← {t('Vissza a termékekhez')}
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
                <img src={kepek[aktiv]} alt={t('{nev} – {szam}. kép', { nev, szam: aktiv + 1 })} />
            </div>
            {kepek.length > 1 && (
                <div className="termek-reszlet-belyegkepek">
                    {kepek.map((kep, index) => (
                        <button
                            key={`${kep}-${index}`}
                            type="button"
                            aria-label={t('{szam}. kép megjelenítése', { szam: index + 1 })}
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
    const { adat: beallitasok } = useBeallitasok();
    const raklapon = termekRaklapon(termek, beallitasok);
    const { tetelek, hozzaad, mennyisegBeallit } = useCart();
    const toast = useToast();
    const bejelentkezve = useBejelentkezesKell();
    const kosarban = tetelek.find((elem) => elem.id === termek._id)?.mennyiseg ?? 0;
    const egyseg = termek.egyseg || 'db';
    const egysegFelirat = egysegNev(egyseg);
    const keszlet = Number.isFinite(termek.keszlet) ? termek.keszlet : MAX_MENNYISEG;
    // Ha a termék már a kosárban van, annak mennyiségéből indulunk, és azt írjuk felül.
    const [mennyiseg, setMennyiseg] = useState(kosarban || Math.min(1, keszlet));
    const valtozott = mennyiseg !== kosarban;

    const mentes = () => {
        if (!bejelentkezve()) return;
        if (kosarban > 0) {
            mennyisegBeallit(termek._id, mennyiseg);
            toast.siker(t('„{nev}” mennyisége a kosárban: {mennyiseg} {egyseg}.', { nev: termek.nev, mennyiseg, egyseg: egysegFelirat }));
        } else {
            hozzaad({ ...termek, kep }, mennyiseg);
            toast.siker(t('{mennyiseg} {egyseg} „{nev}” a kosárba került.', { mennyiseg, egyseg: egysegFelirat, nev: termek.nev }));
        }
    };

    return (
        <section className="termek-reszlet-vasarlas" aria-label={t('Vásárlás')}>
            <div className="termek-reszlet-mennyiseg-sor">
                <span className="termek-reszlet-cimke">{t('Mennyiség')}</span>
                <MennyisegValaszto
                    className="termek-reszlet-mennyiseg"
                    nev={termek.nev}
                    ertek={mennyiseg}
                    egyseg={egyseg}
                    beallit={setMennyiseg}
                    max={keszlet}
                />
                <span>{t('Elérhető: {mennyiseg} {egyseg}', { mennyiseg: termek.keszlet ?? '—', egyseg: egysegFelirat })}</span>
            </div>
            <div className="termek-reszlet-osszesen">
                <span>{t('Összesen')}</span>
                <strong>{forint(Math.round(termek.ar * mennyiseg * 100) / 100)}</strong>
            </div>
            {raklapon && beallitasok && (
                <p className="termek-reszlet-raklap">
                    {t('Raklapos áru: {mennyiseg} {egyseg}/raklap. Raklaponként {dij} betétdíj, ami a raklap visszahozásakor visszajár.', {
                        mennyiseg: raklapon.toLocaleString(helyiBeallitas()),
                        egyseg: egysegFelirat,
                        dij: forint(beallitasok.raklapBetetdij),
                    })}
                </p>
            )}
            <button
                type="button"
                className="termek-reszlet-kosarba"
                onClick={mentes}
                disabled={!valtozott || keszlet < 0.01}
            >
                {kosarban === 0
                    ? t('Kosárba ({mennyiseg} {egyseg})', { mennyiseg, egyseg: egysegFelirat })
                    : valtozott
                        ? t('Kosár frissítése ({mennyiseg} {egyseg})', { mennyiseg, egyseg: egysegFelirat })
                        : t('A kosárban van')}
            </button>
            {kosarban > 0 && (
                <p className="termek-reszlet-kosarban" aria-live="polite">
                    {t('A kosárban: {mennyiseg} {egyseg}', { mennyiseg: kosarban, egyseg: egysegFelirat })} · <Link to="/kosar">{t('Ugrás a kosárhoz')}</Link>
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
                    setHiba(valasz.msg || t('A termék betöltése nem sikerült.'));
                    return;
                }
                setTermek(valasz.termek);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    setHiba(t('A szerver nem érhető el. Próbáld újra később!'));
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
                {t('Betöltés…')}
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
                        <span className="termek-reszlet-kategoria">{kategoriaNev(termek.kategoria)}</span>
                    )}
                    <h1>{termek.nev}</h1>
                    <p className="termek-reszlet-ar">
                        {forint(termek.ar)} <span>/ {egysegNev(termek.egyseg || 'db')}</span>
                    </p>
                    <h2>{t('Leírás')}</h2>
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
