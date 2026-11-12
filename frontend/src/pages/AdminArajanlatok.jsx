import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { forint, szam, teljesIdopont } from '../utils/dashboardFormazas';
import '../components/rendeles/Rendeles.css';
import './AdminRendelesek.css';
import './AdminArajanlatok.css';

const SZUROK = [
    { allapot: 'osszes', cimke: 'Összes' },
    { allapot: 'uj', cimke: 'Új' },
    { allapot: 'folyamatban', cimke: 'Folyamatban' },
    { allapot: 'megvalaszolva', cimke: 'Megválaszolva' },
    { allapot: 'lezarva', cimke: 'Lezárva' },
];

const AdminArajanlatok = () => {
    const { user, authReady } = useAuth();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [frissites, setFrissites] = useState(0);
    const [valasz, setValasz] = useState({ kulcs: null, adat: null, hiba: '' });
    const [nyitott, setNyitott] = useState(null);
    const [jegyzetek, setJegyzetek] = useState({});
    const [folyamatban, setFolyamatban] = useState(false);
    const [uzenet, setUzenet] = useState({ tipus: '', szoveg: '' });

    const kertAllapot = searchParams.get('allapot');
    const allapot = SZUROK.some((szuro) => szuro.allapot === kertAllapot) ? kertAllapot : 'osszes';
    const keresKulcs = `${allapot}|${frissites}`;
    const admin = user?.role === 'admin';

    useEffect(() => {
        if (!authReady || !admin) return undefined;
        const vezerlo = new AbortController();
        fetch(`${API_URL}/admin/arajanlatok?allapot=${allapot}`, { credentials: 'include', signal: vezerlo.signal })
            .then(async (response) => {
                const adat = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(adat.msg || 'Az árajánlatkéréseket nem sikerült betölteni.');
                setValasz({ kulcs: keresKulcs, adat, hiba: '' });
            })
            .catch((error) => {
                if (error.name === 'AbortError') return;
                setValasz((elozo) => ({ ...elozo, kulcs: keresKulcs, hiba: error.message }));
            });
        return () => vezerlo.abort();
    }, [authReady, admin, allapot, keresKulcs]);

    if (!authReady) return <p className="ar-allapot-szoveg">Munkamenet ellenőrzése…</p>;
    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    if (!admin) return <Navigate to="/" replace />;

    const { adat, hiba } = valasz;
    const betoltes = valasz.kulcs !== keresKulcs;

    const mentes = async (ajanlat, modositas) => {
        setFolyamatban(true);
        setUzenet({ tipus: '', szoveg: '' });
        try {
            const response = await fetch(`${API_URL}/admin/arajanlatok/${ajanlat.id}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(modositas),
            });
            const eredmeny = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(eredmeny.msg || 'A mentés nem sikerült.');
            setValasz((elozo) => ({
                ...elozo,
                adat: {
                    ...elozo.adat,
                    arajanlatok: elozo.adat.arajanlatok.map((elem) => (elem.id === ajanlat.id ? eredmeny.arajanlat : elem)),
                },
            }));
            setUzenet({ tipus: 'siker', szoveg: `#${ajanlat.rovidAzonosito}: mentve.` });
        } catch (error) {
            setUzenet({ tipus: 'hiba', szoveg: error.message });
        } finally {
            setFolyamatban(false);
            setFrissites((szamlalo) => szamlalo + 1);
        }
    };

    return (
        <main className="admin-rendelesek">
            <header className="ar-fejlec">
                <div>
                    <span>ADMINISZTRÁCIÓ</span>
                    <h1>Árajánlatkérések</h1>
                    <p>Nagy tételes és céges ajánlatkérések nyilvántartása.</p>
                </div>
                <Link to="/admin/rendelesek">Rendelések</Link>
            </header>

            <div className="ar-szurok" role="group" aria-label="Szűrés állapot szerint">
                {SZUROK.map((szuro) => (
                    <button
                        key={szuro.allapot}
                        type="button"
                        aria-pressed={szuro.allapot === allapot}
                        onClick={() => {
                            setSearchParams(szuro.allapot === 'osszes' ? {} : { allapot: szuro.allapot }, { replace: true });
                            setNyitott(null);
                        }}
                    >
                        {szuro.cimke}
                        {adat && <span className="ar-szamlalo">{szam(adat.allapotSzamok[szuro.allapot] ?? 0)}</span>}
                    </button>
                ))}
            </div>

            {uzenet.szoveg && (
                <p className={`ar-uzenet ar-uzenet--${uzenet.tipus}`} role={uzenet.tipus === 'hiba' ? 'alert' : 'status'}>{uzenet.szoveg}</p>
            )}
            {hiba && <p className="ar-uzenet ar-uzenet--hiba" role="alert">{hiba}</p>}
            {!adat && betoltes && <p className="ar-allapot-szoveg">Árajánlatkérések betöltése…</p>}

            {adat && (
                <section className={`ar-lista${betoltes ? ' ar-lista--frissul' : ''}`} aria-busy={betoltes} aria-label="Árajánlatkérések">
                    {adat.arajanlatok.length === 0 ? (
                        <p className="ar-ures">Ebben az állapotban nincs árajánlatkérés.</p>
                    ) : adat.arajanlatok.map((ajanlat) => {
                        const nyitva = nyitott === ajanlat.id;
                        const jegyzet = jegyzetek[ajanlat.id] ?? ajanlat.adminMegjegyzes;
                        return (
                            <article key={ajanlat.id} className={`ar-rendeles${nyitva ? ' ar-rendeles--nyitva' : ''}`}>
                                <button type="button" className="ar-sor aj-sor" aria-expanded={nyitva} onClick={() => setNyitott(nyitva ? null : ajanlat.id)}>
                                    <span className="ar-oszlop ar-azonosito">
                                        <strong>#{ajanlat.rovidAzonosito}</strong>
                                        <small>{teljesIdopont(ajanlat.datum)}</small>
                                    </span>
                                    <span className="ar-oszlop ar-vevo">
                                        <strong>{ajanlat.cegnev || ajanlat.nev}</strong>
                                        <small>{ajanlat.cegnev ? `${ajanlat.nev} · ` : ''}{ajanlat.email}</small>
                                    </span>
                                    <span className="ar-oszlop ar-osszeg">
                                        <strong>{ajanlat.listaOsszeg ? forint(ajanlat.listaOsszeg) : '—'}</strong>
                                        <small>{ajanlat.tetelek.length ? `${szam(ajanlat.tetelek.length)} tétel listaáron` : 'szöveges kérés'}</small>
                                    </span>
                                    <span className="ar-oszlop ar-jelveny">
                                        <span className={`aj-allapot aj-allapot--${ajanlat.allapot}`}>{ajanlat.allapotCimke}</span>
                                    </span>
                                    <span className="ar-nyil" aria-hidden="true" />
                                </button>

                                {nyitva && (
                                    <div className="ar-reszletek">
                                        <div className="ar-reszletek-racs">
                                            <div className="aj-tetelek">
                                                {ajanlat.tetelek.length > 0 && (
                                                    <table>
                                                        <thead>
                                                            <tr><th scope="col">Termék</th><th scope="col">Mennyiség</th><th scope="col">Listaár</th></tr>
                                                        </thead>
                                                        <tbody>
                                                            {ajanlat.tetelek.map((tetel) => (
                                                                <tr key={tetel.termekId}>
                                                                    <td>{tetel.nev}</td>
                                                                    <td>{szam(tetel.mennyiseg)} {tetel.egyseg}</td>
                                                                    <td>{forint(tetel.listaar * tetel.mennyiseg)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                                {ajanlat.megjegyzes && <p className="aj-megjegyzes">„{ajanlat.megjegyzes}”</p>}
                                            </div>
                                            <address className="rendeles-cim aj-elerhetoseg">
                                                <h4>Elérhetőség</h4>
                                                <strong>{ajanlat.nev}</strong>
                                                {ajanlat.cegnev && <span>{ajanlat.cegnev}{ajanlat.adoszam ? ` · ${ajanlat.adoszam}` : ''}</span>}
                                                <a href={`mailto:${ajanlat.email}`}>{ajanlat.email}</a>
                                                {ajanlat.telefon && <a href={`tel:${ajanlat.telefon.replace(/\s/g, '')}`}>{ajanlat.telefon}</a>}
                                                {(ajanlat.iranyitoszam || ajanlat.telepules) && <span>{ajanlat.iranyitoszam} {ajanlat.telepules}</span>}
                                                <span>{ajanlat.vendeg ? 'Vendég' : 'Regisztrált vásárló'}</span>
                                            </address>
                                        </div>
                                        <div className="ar-muveletek">
                                            <label>
                                                Belső megjegyzés <small>(pl. a kiküldött ajánlat összege, érvényessége)</small>
                                                <textarea
                                                    rows="2"
                                                    maxLength={2000}
                                                    value={jegyzet}
                                                    onChange={(event) => setJegyzetek((elozo) => ({ ...elozo, [ajanlat.id]: event.target.value }))}
                                                />
                                            </label>
                                            <div className="ar-gombok">
                                                <button type="button" className="ar-gomb" disabled={folyamatban} onClick={() => mentes(ajanlat, { adminMegjegyzes: jegyzet })}>
                                                    Megjegyzés mentése
                                                </button>
                                                {SZUROK.filter((szuro) => szuro.allapot !== 'osszes' && szuro.allapot !== ajanlat.allapot).map((szuro) => (
                                                    <button key={szuro.allapot} type="button" className="ar-gomb aj-gomb-masodlagos" disabled={folyamatban} onClick={() => mentes(ajanlat, { allapot: szuro.allapot, adminMegjegyzes: jegyzet })}>
                                                        → {szuro.cimke}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </section>
            )}
        </main>
    );
};

export default AdminArajanlatok;
