import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import OsszesitoSorok from '../components/arazas/OsszesitoSorok';
import AllapotIdovonal from '../components/rendeles/AllapotIdovonal';
import AllapotJelveny from '../components/rendeles/AllapotJelveny';
import RendelesCimek from '../components/rendeles/RendelesCimek';
import TetelLista from '../components/rendeles/TetelLista';
import { forint, szam, teljesIdopont } from '../utils/dashboardFormazas';
import './AdminRendelesek.css';

const SZUROK = [
    { allapot: 'osszes', cimke: 'Összes' },
    { allapot: 'feldolgozasra_var', cimke: 'Feldolgozásra vár' },
    { allapot: 'visszaigazolva', cimke: 'Visszaigazolva' },
    { allapot: 'kiszallitas_alatt', cimke: 'Kiszállítás alatt' },
    { allapot: 'teljesitve', cimke: 'Teljesítve' },
    { allapot: 'lemondva', cimke: 'Lemondva' },
];

const GOMB_FELIRATOK = {
    visszaigazolva: 'Visszaigazolás',
    kiszallitas_alatt: 'Kiszállításra átad',
    teljesitve: 'Teljesítettnek jelöl',
    lemondva: 'Rendelés lemondása',
};

// A visszaigazoló (vevő) és az értesítő (bolt) e-mail kiküldésének állapota.
const ErtesitesNaplo = ({ ertesitesek }) => {
    if (!ertesitesek) return <small>E-mail-értesítés: nincs adat</small>;
    const sor = (cimke, ido) => (ido ? `${cimke} ✓ ${teljesIdopont(ido)}` : `${cimke} ✕`);
    return (
        <small className={ertesitesek.hiba ? 'ar-email-hiba' : undefined} title={ertesitesek.hiba || undefined}>
            E-mail: {sor('vevő', ertesitesek.vevo)} · {sor('bolt', ertesitesek.bolt)}
            {ertesitesek.hiba && ' – küldési hiba'}
        </small>
    );
};

// Visszahozott raklapok rögzítése: ennyi betétdíjat kell visszaadni a vevőnek.
const RaklapVisszavetel = ({ rendeles, mentes, folyamatban }) => {
    const [darab, setDarab] = useState(String(rendeles.visszahozottRaklapok));
    return (
        <form
            className="ar-raklap"
            onSubmit={(event) => {
                event.preventDefault();
                mentes(rendeles, Number(darab));
            }}
        >
            <label>
                Visszahozott raklapok
                <span>
                    <input type="number" min="0" max={rendeles.raklapok} step="1" value={darab} onChange={(event) => setDarab(event.target.value)} />
                    / {szam(rendeles.raklapok)}
                </span>
            </label>
            <button type="submit" className="ar-gomb aj-gomb-masodlagos" disabled={folyamatban}>Rögzítés</button>
            <small>Visszajár eddig: {forint(rendeles.visszajaroBetetdij)}</small>
        </form>
    );
};

const AdminRendelesek = () => {
    const { user, authReady } = useAuth();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [keresesMezo, setKeresesMezo] = useState('');
    // A keresés és az oldalszám együtt változik: új keresésnél az első oldalra ugrunk.
    const [lekerdezes, setLekerdezes] = useState({ kereses: '', oldal: 1 });
    const [frissites, setFrissites] = useState(0);
    const [valasz, setValasz] = useState({ kulcs: null, adat: null, hiba: '' });
    const [nyitott, setNyitott] = useState(null);
    const [megjegyzes, setMegjegyzes] = useState('');
    const [folyamatban, setFolyamatban] = useState(false);
    const [uzenet, setUzenet] = useState({ tipus: '', szoveg: '' });

    const kertAllapot = searchParams.get('allapot');
    const allapot = SZUROK.some((szuro) => szuro.allapot === kertAllapot) ? kertAllapot : 'osszes';
    const { kereses, oldal } = lekerdezes;
    const keresKulcs = `${allapot}|${kereses}|${oldal}|${frissites}`;
    const admin = user?.role === 'admin';

    // Gépelés közben nem kérdezünk le minden betűre, csak egy rövid szünet után.
    useEffect(() => {
        const idozito = window.setTimeout(() => {
            const uj = keresesMezo.trim();
            setLekerdezes((elozo) => (elozo.kereses === uj ? elozo : { kereses: uj, oldal: 1 }));
        }, 300);
        return () => window.clearTimeout(idozito);
    }, [keresesMezo]);

    useEffect(() => {
        if (!authReady || !admin) return undefined;
        const vezerlo = new AbortController();
        const parameterek = new URLSearchParams({ allapot, oldal: String(oldal) });
        if (kereses) parameterek.set('kereses', kereses);

        fetch(`${API_URL}/admin/rendelesek?${parameterek}`, { credentials: 'include', signal: vezerlo.signal })
            .then(async (response) => {
                const adat = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(adat.msg || 'A rendeléseket nem sikerült betölteni.');
                setValasz({ kulcs: keresKulcs, adat, hiba: '' });
            })
            .catch((error) => {
                if (error.name === 'AbortError') return;
                setValasz((elozo) => ({ ...elozo, kulcs: keresKulcs, hiba: error.message }));
            });

        return () => vezerlo.abort();
    }, [authReady, admin, allapot, kereses, oldal, keresKulcs]);

    if (!authReady) return <p className="ar-allapot-szoveg">Munkamenet ellenőrzése…</p>;
    // Csak a kijelentkezett felhasználót küldjük a belépéshez; a bejelentkezett, de nem
    // admin felhasználót a főoldalra, különben a belépés oldal visszairányítaná ide (végtelen ciklus).
    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    if (!admin) return <Navigate to="/" replace />;

    const { adat, hiba } = valasz;
    const betoltes = valasz.kulcs !== keresKulcs;

    const szuroValtas = (uj) => {
        setSearchParams(uj === 'osszes' ? {} : { allapot: uj }, { replace: true });
        setLekerdezes((elozo) => ({ ...elozo, oldal: 1 }));
        setNyitott(null);
    };

    const lapozas = (irany) => {
        setLekerdezes((elozo) => ({ ...elozo, oldal: elozo.oldal + irany }));
        setNyitott(null);
    };

    const lenyitas = (id) => {
        setNyitott((elozo) => (elozo === id ? null : id));
        setMegjegyzes('');
    };

    const raklapMentes = async (rendeles, visszahozottRaklapok) => {
        setFolyamatban(true);
        setUzenet({ tipus: '', szoveg: '' });
        try {
            const response = await fetch(`${API_URL}/admin/rendelesek/${rendeles.id}/raklap`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visszahozottRaklapok }),
            });
            const eredmeny = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(eredmeny.msg || 'A raklapok visszavételét nem sikerült rögzíteni.');
            setValasz((elozo) => ({
                ...elozo,
                adat: {
                    ...elozo.adat,
                    rendelesek: elozo.adat.rendelesek.map((elem) => (elem.id === rendeles.id ? eredmeny.rendeles : elem)),
                },
            }));
            setUzenet({ tipus: 'siker', szoveg: `#${rendeles.rovidAzonosito}: ${eredmeny.msg}` });
        } catch (error) {
            setUzenet({ tipus: 'hiba', szoveg: error.message });
        } finally {
            setFolyamatban(false);
        }
    };

    const allapotValtas = async (rendeles, ujAllapot) => {
        if (ujAllapot === 'lemondva' && !window.confirm(
            `Biztosan lemondod a #${rendeles.rovidAzonosito} rendelést? A tételek visszakerülnek a készletbe, és ez nem vonható vissza.`,
        )) return;

        setFolyamatban(true);
        setUzenet({ tipus: '', szoveg: '' });
        try {
            const response = await fetch(`${API_URL}/admin/rendelesek/${rendeles.id}/allapot`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ allapot: ujAllapot, megjegyzes }),
            });
            const eredmeny = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(eredmeny.msg || 'Az állapotot nem sikerült módosítani.');

            setValasz((elozo) => ({
                ...elozo,
                adat: {
                    ...elozo.adat,
                    rendelesek: elozo.adat.rendelesek.map((elem) => (elem.id === rendeles.id ? eredmeny.rendeles : elem)),
                },
            }));
            setMegjegyzes('');
            setUzenet({ tipus: 'siker', szoveg: `#${rendeles.rovidAzonosito}: ${eredmeny.msg}` });
        } catch (error) {
            setUzenet({ tipus: 'hiba', szoveg: error.message });
        } finally {
            setFolyamatban(false);
            // A számlálók és a szűrt lista frissítése (pl. ha a rendelés kikerül a fülből).
            setFrissites((szamlalo) => szamlalo + 1);
        }
    };

    return (
        <main className="admin-rendelesek">
            <header className="ar-fejlec">
                <div>
                    <span>ADMINISZTRÁCIÓ</span>
                    <h1>Rendelések</h1>
                    <p>Rendelések követése, visszaigazolása, kiszállítása és lemondása.</p>
                </div>
                <Link to="/admin/dashboard">Dashboard</Link>
            </header>

            <div className="ar-eszkozsor">
                <div className="ar-szurok" role="group" aria-label="Szűrés állapot szerint">
                    {SZUROK.map((szuro) => (
                        <button
                            key={szuro.allapot}
                            type="button"
                            aria-pressed={szuro.allapot === allapot}
                            onClick={() => szuroValtas(szuro.allapot)}
                        >
                            {szuro.cimke}
                            {adat && <span className="ar-szamlalo">{szam(adat.allapotSzamok[szuro.allapot] ?? 0)}</span>}
                        </button>
                    ))}
                </div>
                <label className="ar-kereso">
                    <span className="ar-rejtett">Keresés</span>
                    <input
                        type="search"
                        value={keresesMezo}
                        onChange={(event) => setKeresesMezo(event.target.value)}
                        placeholder="Keresés név, e-mail, település vagy azonosító szerint…"
                        autoComplete="off"
                    />
                </label>
            </div>

            {uzenet.szoveg && (
                <p className={`ar-uzenet ar-uzenet--${uzenet.tipus}`} role={uzenet.tipus === 'hiba' ? 'alert' : 'status'}>
                    {uzenet.szoveg}
                </p>
            )}
            {hiba && <p className="ar-uzenet ar-uzenet--hiba" role="alert">{hiba}</p>}
            {!adat && betoltes && <p className="ar-allapot-szoveg">Rendelések betöltése…</p>}

            {adat && (
                <section className={`ar-lista${betoltes ? ' ar-lista--frissul' : ''}`} aria-busy={betoltes} aria-label="Rendelések">
                    {adat.rendelesek.length === 0 ? (
                        <p className="ar-ures">
                            {kereses ? 'Nincs a keresésnek megfelelő rendelés.' : 'Ebben az állapotban nincs rendelés.'}
                        </p>
                    ) : adat.rendelesek.map((rendeles) => {
                        const nyitva = nyitott === rendeles.id;
                        return (
                            <article key={rendeles.id} className={`ar-rendeles${nyitva ? ' ar-rendeles--nyitva' : ''}`}>
                                <button
                                    type="button"
                                    className="ar-sor"
                                    aria-expanded={nyitva}
                                    aria-controls={`rendeles-${rendeles.id}`}
                                    onClick={() => lenyitas(rendeles.id)}
                                >
                                    <span className="ar-oszlop ar-azonosito">
                                        <strong>#{rendeles.rovidAzonosito}</strong>
                                        <small>{teljesIdopont(rendeles.datum)}</small>
                                    </span>
                                    <span className="ar-oszlop ar-vevo">
                                        <strong>{rendeles.nev}</strong>
                                        <small>{rendeles.email}{rendeles.vendeg ? ' · vendég' : ''}</small>
                                    </span>
                                    <span className="ar-oszlop ar-atvetel">
                                        <strong>{rendeles.atvetelCimke}</strong>
                                        <small>{rendeles.szallitasiAdatok?.telepules ?? 'Telephelyen'}</small>
                                    </span>
                                    <span className="ar-oszlop ar-osszeg">
                                        <strong>{forint(rendeles.vegosszeg)}</strong>
                                        <small>{szam(rendeles.tetelek.length)} tétel</small>
                                    </span>
                                    <span className="ar-oszlop ar-jelveny">
                                        <AllapotJelveny allapot={rendeles.allapot} cimke={rendeles.cimke} />
                                    </span>
                                    <span className="ar-nyil" aria-hidden="true" />
                                </button>

                                {nyitva && (
                                    <div className="ar-reszletek" id={`rendeles-${rendeles.id}`}>
                                        <AllapotIdovonal rendeles={rendeles} />
                                        <div className="ar-reszletek-racs">
                                            <div className="ar-tetel-oszlop">
                                                <TetelLista
                                                    tetelek={rendeles.tetelek}
                                                    vegosszeg={rendeles.osszesites?.termekOsszeg ?? rendeles.vegosszeg}
                                                    osszegCimke={rendeles.osszesites ? 'Termékek összesen' : 'Végösszeg'}
                                                />
                                                {rendeles.osszesites && (
                                                    <div className="rendeles-osszesites">
                                                        <OsszesitoSorok
                                                            osszesites={{ ...rendeles.osszesites, vegosszeg: rendeles.vegosszeg }}
                                                            atvetelModja={rendeles.atvetelModja}
                                                            visszajaroBetetdij={rendeles.visszajaroBetetdij}
                                                        />
                                                    </div>
                                                )}
                                                {rendeles.raklapok > 0 && (
                                                    <RaklapVisszavetel
                                                        key={`${rendeles.id}-${rendeles.visszahozottRaklapok}`}
                                                        rendeles={rendeles}
                                                        mentes={raklapMentes}
                                                        folyamatban={folyamatban}
                                                    />
                                                )}
                                            </div>
                                            <div className="ar-cimek">
                                                <RendelesCimek rendeles={rendeles} />
                                                <div className="ar-dokumentumok">
                                                    <a href={`${API_URL}/rendelesek/${rendeles.id}/dijbekero`} target="_blank" rel="noreferrer">
                                                        Díjbekérő (PDF) ↗
                                                    </a>
                                                    <ErtesitesNaplo ertesitesek={rendeles.ertesitesek} />
                                                </div>
                                            </div>
                                        </div>

                                        {rendeles.kovetkezoAllapotok.length > 0 ? (
                                            <div className="ar-muveletek">
                                                <label>
                                                    Megjegyzés a vásárlónak <small>(nem kötelező, a profiljában látja)</small>
                                                    <textarea
                                                        rows="2"
                                                        maxLength={300}
                                                        value={megjegyzes}
                                                        onChange={(event) => setMegjegyzes(event.target.value)}
                                                        placeholder="Pl. kiszállítás csütörtökön 8 és 12 óra között"
                                                    />
                                                </label>
                                                <div className="ar-gombok">
                                                    {rendeles.kovetkezoAllapotok.map((kovetkezo) => (
                                                        <button
                                                            key={kovetkezo.allapot}
                                                            type="button"
                                                            className={kovetkezo.allapot === 'lemondva' ? 'ar-gomb ar-gomb--veszely' : 'ar-gomb'}
                                                            disabled={folyamatban}
                                                            onClick={() => allapotValtas(rendeles, kovetkezo.allapot)}
                                                        >
                                                            {GOMB_FELIRATOK[kovetkezo.allapot] ?? kovetkezo.cimke}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="ar-lezart">Lezárt rendelés, az állapota már nem módosítható.</p>
                                        )}
                                    </div>
                                )}
                            </article>
                        );
                    })}

                    {adat.oldalak > 1 && (
                        <nav className="ar-lapozo" aria-label="Lapozás">
                            <button type="button" disabled={oldal <= 1 || betoltes} onClick={() => lapozas(-1)}>
                                ← Előző
                            </button>
                            <span>{szam(adat.oldal)} / {szam(adat.oldalak)} oldal · {szam(adat.talalatok)} rendelés</span>
                            <button type="button" disabled={oldal >= adat.oldalak || betoltes} onClick={() => lapozas(1)}>
                                Következő →
                            </button>
                        </nav>
                    )}
                </section>
            )}
        </main>
    );
};

export default AdminRendelesek;
