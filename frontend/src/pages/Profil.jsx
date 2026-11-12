import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import OsszesitoSorok from '../components/arazas/OsszesitoSorok';
import AllapotIdovonal from '../components/rendeles/AllapotIdovonal';
import AllapotJelveny from '../components/rendeles/AllapotJelveny';
import RendelesCimek from '../components/rendeles/RendelesCimek';
import TetelLista from '../components/rendeles/TetelLista';
import { napCimke } from '../utils/beallitasok';
import { forint, szam, teljesIdopont } from '../utils/dashboardFormazas';
import './Auth.css';
import './Profil.css';

const MIN_JELSZO_HOSSZ = 8;

const SajatRendeles = ({ rendeles }) => (
    <article className={`sajat-rendeles sajat-rendeles--${rendeles.allapot}`}>
        <header className="sajat-rendeles-fej">
            <div>
                <strong>#{rendeles.rovidAzonosito}</strong>
                <span>{teljesIdopont(rendeles.datum)}</span>
            </div>
            <AllapotJelveny allapot={rendeles.allapot} cimke={rendeles.cimke} />
        </header>

        <AllapotIdovonal rendeles={rendeles} />

        <div className="sajat-rendeles-osszeg">
            <span>
                {szam(rendeles.tetelek.length)} tétel · {rendeles.atvetelCimke}
                {rendeles.atvetelNapja ? ` · ${napCimke(rendeles.atvetelNapja)}` : ''}
                {rendeles.raklapok > 0 ? ` · ${szam(rendeles.raklapok)} raklap` : ''}
            </span>
            <strong>{forint(rendeles.vegosszeg)}</strong>
        </div>

        <details className="sajat-rendeles-reszletek">
            <summary>Tételek és szállítási adatok</summary>
            <TetelLista
                tetelek={rendeles.tetelek}
                vegosszeg={rendeles.osszesites?.termekOsszeg ?? rendeles.vegosszeg}
                osszegCimke={rendeles.osszesites ? 'Termékek összesen' : 'Végösszeg'}
            />
            {rendeles.osszesites && (
                <div className="rendeles-osszesites sajat-rendeles-osszesites">
                    <OsszesitoSorok
                        osszesites={{ ...rendeles.osszesites, vegosszeg: rendeles.vegosszeg }}
                        atvetelModja={rendeles.atvetelModja}
                        visszajaroBetetdij={rendeles.visszajaroBetetdij}
                    />
                </div>
            )}
            <div className="sajat-rendeles-cimek">
                <RendelesCimek rendeles={rendeles} />
            </div>
            <a
                className="sajat-rendeles-pdf"
                href={`${API_URL}/rendelesek/${rendeles.id}/dijbekero`}
                target="_blank"
                rel="noreferrer"
            >
                Díjbekérő letöltése (PDF) ↗
            </a>
        </details>
    </article>
);

const Profil = () => {
    const { user, authReady } = useAuth();
    const location = useLocation();
    const [jelszo, setJelszo] = useState('');
    const [ujJelszo, setUjJelszo] = useState('');
    const [ujJelszoMegerosites, setUjJelszoMegerosites] = useState('');
    const [hiba, setHiba] = useState('');
    const [siker, setSiker] = useState('');
    const [kuldes, setKuldes] = useState(false);
    const [rendelesValasz, setRendelesValasz] = useState({ kulcs: null, rendelesek: [], hiba: '' });

    const felhasznaloKulcs = authReady ? user?.email ?? null : null;
    const rendelesekBetoltese = rendelesValasz.kulcs !== felhasznaloKulcs;

    useEffect(() => {
        if (!felhasznaloKulcs) return undefined;
        const vezerlo = new AbortController();

        fetch(`${API_URL}/rendelesek/sajat`, { credentials: 'include', signal: vezerlo.signal })
            .then(async (response) => {
                const adat = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(adat.msg || 'A rendeléseidet nem sikerült betölteni.');
                setRendelesValasz({ kulcs: felhasznaloKulcs, rendelesek: adat.rendelesek, hiba: '' });
            })
            .catch((error) => {
                if (error.name === 'AbortError') return;
                setRendelesValasz({ kulcs: felhasznaloKulcs, rendelesek: [], hiba: error.message });
            });

        return () => vezerlo.abort();
    }, [felhasznaloKulcs]);

    // A menü „Rendeléseim” linkje (#rendeleseim) betöltés után ide görget.
    useEffect(() => {
        if (location.hash === '#rendeleseim' && !rendelesekBetoltese) {
            document.getElementById('rendeleseim')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [location.hash, rendelesekBetoltese]);

    // Oldalfrissítéskor a munkamenet ellenőrzéséig nem irányítunk át a belépéshez.
    if (!authReady) {
        return <div className="auth-kontener"><p>Munkamenet ellenőrzése…</p></div>;
    }

    if (!user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: '/profil' }}
            />
        );
    }

    const kezdobetu = (user.nev || user.email || '?')
        .trim()
        .charAt(0)
        .toUpperCase();

    const bekuld = async (event) => {
        event.preventDefault();
        setHiba('');
        setSiker('');

        if (ujJelszo !== ujJelszoMegerosites) {
            setHiba('A két új jelszó nem egyezik!');
            return;
        }

        setKuldes(true);

        try {
            const response = await fetch(`${API_URL}/auth/password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, jelszo, ujJelszo }),
            });

            const valasz = await response.json();

            if (response.ok) {
                setSiker(valasz.msg);
                setJelszo('');
                setUjJelszo('');
                setUjJelszoMegerosites('');
            } else setHiba(valasz.msg);
        } catch {
            setHiba('A szerver nem érhető el. Próbáld újra később!');
        } finally {
            setKuldes(false);
        }
    };

    return (
        <div className="auth-kontener profil-oldal">
            <div className="profil-racs">
                <div className="auth-kartya profil-kartya">
                    <div className="profil-fej">
                        <span
                            className="profil-avatar"
                            aria-hidden="true"
                        >
                            {kezdobetu}
                        </span>
                        <div className="profil-adatok">
                            <h1>{user.nev}</h1>
                            <p>{user.email}</p>
                        </div>
                    </div>

                    <form
                        className="profil-urlap"
                        onSubmit={bekuld}
                    >
                        <h2>Jelszó módosítása</h2>

                        <label className="auth-mezo">
                            Jelenlegi jelszó
                            <input
                                type="password"
                                autoComplete="current-password"
                                value={jelszo}
                                onChange={(event) => setJelszo(event.target.value)}
                                required
                            />
                        </label>
                        <label className="auth-mezo">
                            Új jelszó
                            <input
                                type="password"
                                autoComplete="new-password"
                                minLength={MIN_JELSZO_HOSSZ}
                                value={ujJelszo}
                                onChange={(event) => setUjJelszo(event.target.value)}
                                required
                            />
                            <small>Legalább {MIN_JELSZO_HOSSZ} karakter.</small>
                        </label>
                        <label className="auth-mezo">
                            Új jelszó megerősítése
                            <input
                                type="password"
                                autoComplete="new-password"
                                value={ujJelszoMegerosites}
                                onChange={(event) =>
                                    setUjJelszoMegerosites(event.target.value)
                                }
                                required
                            />
                        </label>

                        {hiba && (
                            <p
                                className="auth-uzenet auth-hiba"
                                role="alert"
                            >
                                {hiba}
                            </p>
                        )}
                        {siker && (
                            <p
                                className="auth-uzenet auth-siker"
                                role="status"
                            >
                                {siker}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="auth-gomb"
                            disabled={kuldes}
                        >
                            {kuldes ? 'Mentés…' : 'Jelszó módosítása'}
                        </button>
                    </form>
                </div>

                <section
                    id="rendeleseim"
                    className="profil-rendelesek"
                    aria-labelledby="rendeleseim-cim"
                    aria-busy={rendelesekBetoltese}
                >
                    <div className="profil-rendelesek-fej">
                        <h2 id="rendeleseim-cim">Rendeléseim</h2>
                        <p>A bejelentkezve leadott rendeléseid és azok állapota.</p>
                    </div>

                    {rendelesekBetoltese ? (
                        <p className="profil-rendelesek-uzenet">Rendelések betöltése…</p>
                    ) : rendelesValasz.hiba ? (
                        <p className="auth-uzenet auth-hiba" role="alert">{rendelesValasz.hiba}</p>
                    ) : rendelesValasz.rendelesek.length === 0 ? (
                        <div className="profil-rendelesek-uzenet">
                            <p>Még nincs rendelésed.</p>
                            <Link to="/termekek">Nézz körül a termékek között</Link>
                        </div>
                    ) : (
                        <div className="profil-rendelesek-lista">
                            {rendelesValasz.rendelesek.map((rendeles) => (
                                <SajatRendeles key={rendeles.id} rendeles={rendeles} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Profil;
