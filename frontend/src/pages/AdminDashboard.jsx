import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import MegoszlasSav from '../components/dashboard/MegoszlasSav';
import OszlopDiagram from '../components/dashboard/OszlopDiagram';
import RangsorSavok from '../components/dashboard/RangsorSavok';
import Valtozas from '../components/dashboard/Valtozas';
import { forint, idopont, ora, szam } from '../utils/dashboardFormazas';
import './AdminDashboard.css';

const IDOSZAKOK = [
    { kulcs: '7nap', cimke: '7 nap', osszevetes: 'előző 7 nap' },
    { kulcs: '30nap', cimke: '30 nap', osszevetes: 'előző 30 nap' },
    { kulcs: '90nap', cimke: '90 nap', osszevetes: 'előző 90 nap' },
    { kulcs: '12honap', cimke: '12 hónap', osszevetes: 'előző 12 hónap' },
];
const ALAP_IDOSZAK = '30nap';

const StatCsempe = ({ cimke, ertek, mutato, osszevetes, mellek }) => (
    <article className="db-csempe">
        <span className="db-csempe-cimke">{cimke}</span>
        <strong className="db-csempe-ertek">{ertek}</strong>
        {mutato ? <Valtozas ertek={mutato.valtozas} osszevetes={osszevetes} /> : mellek && <span className="db-csempe-mellek">{mellek}</span>}
    </article>
);

const KeszletAllapot = ({ keszlet }) => {
    const elfogyott = keszlet <= 0;
    return (
        <span className={`db-allapot ${elfogyott ? 'db-allapot--kritikus' : 'db-allapot--figyelmeztetes'}`}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
                {elfogyott ? (
                    <>
                        <circle cx="8" cy="8" r="7" />
                        <path d="M5.5 5.5l5 5m0-5l-5 5" />
                    </>
                ) : (
                    <>
                        <path d="M8 1.5l7 12.5H1z" />
                        <path d="M8 6v3.5m0 2.2v.1" />
                    </>
                )}
            </svg>
            {elfogyott ? 'Elfogyott' : 'Alacsony'}
        </span>
    );
};

const AdminDashboard = () => {
    const { user, authReady } = useAuth();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [frissites, setFrissites] = useState(0);
    const [tablazat, setTablazat] = useState(false);
    const [valasz, setValasz] = useState({ kulcs: null, adat: null, hiba: '' });

    const kertIdoszak = searchParams.get('idoszak');
    const idoszak = IDOSZAKOK.find((elem) => elem.kulcs === kertIdoszak) ?? IDOSZAKOK.find((elem) => elem.kulcs === ALAP_IDOSZAK);
    const keresKulcs = `${idoszak.kulcs}|${frissites}`;
    const admin = user?.role === 'admin';

    useEffect(() => {
        if (!authReady || !admin) return undefined;
        const vezerlo = new AbortController();

        fetch(`${API_URL}/dashboard?idoszak=${encodeURIComponent(idoszak.kulcs)}`, {
            credentials: 'include',
            signal: vezerlo.signal,
        })
            .then(async (response) => {
                const adat = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(adat.msg || 'A dashboard betöltése nem sikerült.');
                setValasz({ kulcs: keresKulcs, adat, hiba: '' });
            })
            .catch((error) => {
                if (error.name === 'AbortError') return;
                setValasz((elozo) => ({
                    ...elozo,
                    kulcs: keresKulcs,
                    hiba: error.message || 'A dashboard betöltése nem sikerült.',
                }));
            });

        return () => vezerlo.abort();
    }, [authReady, admin, idoszak.kulcs, keresKulcs]);

    if (!authReady) return <p className="db-oldal-allapot">Munkamenet ellenőrzése…</p>;
    if (!admin) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

    const { adat, hiba } = valasz;
    const betoltes = valasz.kulcs !== keresKulcs;
    const idoszakValtas = (kulcs) => setSearchParams(kulcs === ALAP_IDOSZAK ? {} : { idoszak: kulcs }, { replace: true });

    return (
        <main className="dashboard">
            <header className="db-fejlec">
                <div>
                    <span>ADMINISZTRÁCIÓ</span>
                    <h1>Dashboard</h1>
                    <p>Bevétel, rendelések, vásárlók és készlet egy helyen.</p>
                </div>
                <Link to="/admin/termekek">Termékkezelés</Link>
            </header>

            <section className="db-szakasz" aria-labelledby="db-ertekesites-cim">
                <div className="db-szakasz-fej">
                    <h2 id="db-ertekesites-cim">Értékesítés</h2>
                    <div className="db-szurosor">
                        <div className="db-idoszak" role="group" aria-label="Időszak">
                            {IDOSZAKOK.map((elem) => (
                                <button
                                    key={elem.kulcs}
                                    type="button"
                                    aria-pressed={elem.kulcs === idoszak.kulcs}
                                    onClick={() => idoszakValtas(elem.kulcs)}
                                >
                                    {elem.cimke}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            className="db-frissit"
                            onClick={() => setFrissites((szamlalo) => szamlalo + 1)}
                            disabled={betoltes}
                        >
                            {betoltes && adat ? 'Frissítés…' : 'Frissítés'}
                        </button>
                        {adat && <span className="db-frissitve">Frissítve {ora(adat.generalva)}</span>}
                    </div>
                </div>

                {hiba && <p className="db-hiba" role="alert">{hiba}</p>}
                {!adat && betoltes && <p className="db-oldal-allapot">Adatok betöltése…</p>}

                {adat && (
                    <div className={`db-tartalom${betoltes ? ' db-tartalom--frissul' : ''}`} aria-busy={betoltes}>
                        <div className="db-kpi">
                            <article className="db-hero">
                                <span className="db-csempe-cimke">Bevétel · {adat.idoszak.cimke.toLowerCase()}</span>
                                <strong className="db-hero-ertek">{forint(adat.osszegzes.bevetel.ertek)}</strong>
                                <Valtozas ertek={adat.osszegzes.bevetel.valtozas} osszevetes={idoszak.osszevetes} />
                                <span className="db-csempe-mellek">Előző időszak: {forint(adat.osszegzes.bevetel.elozo)}</span>
                            </article>
                            <div className="db-csempek">
                                <StatCsempe cimke="Rendelések" ertek={szam(adat.osszegzes.rendelesek.ertek)} mutato={adat.osszegzes.rendelesek} osszevetes={idoszak.osszevetes} />
                                <StatCsempe cimke="Átlagos kosárérték" ertek={forint(adat.osszegzes.atlagosKosar.ertek)} mutato={adat.osszegzes.atlagosKosar} osszevetes={idoszak.osszevetes} />
                                <StatCsempe cimke="Vásárlók" ertek={szam(adat.osszegzes.vasarlok.ertek)} mutato={adat.osszegzes.vasarlok} osszevetes={idoszak.osszevetes} />
                                <StatCsempe cimke="Új regisztrációk" ertek={szam(adat.osszegzes.ujFelhasznalok.ertek)} mutato={adat.osszegzes.ujFelhasznalok} osszevetes={idoszak.osszevetes} />
                            </div>
                        </div>

                        <section className="db-kartya">
                            <div className="db-kartya-fej">
                                <div>
                                    <h3>Bevétel alakulása</h3>
                                    <p>{adat.idoszak.bontas === 'honap' ? 'Havi' : 'Napi'} bontás, forintban</p>
                                </div>
                                <button type="button" className="db-nezet-gomb" onClick={() => setTablazat((elozo) => !elozo)}>
                                    {tablazat ? 'Diagram nézet' : 'Táblázat nézet'}
                                </button>
                            </div>
                            <OszlopDiagram adatok={adat.idosor} bontas={adat.idoszak.bontas} tablazat={tablazat} />
                        </section>

                        <div className="db-racs db-racs--2">
                            <section className="db-kartya">
                                <div className="db-kartya-fej">
                                    <div>
                                        <h3>Legnépszerűbb termékek</h3>
                                        <p>Bevétel szerint</p>
                                    </div>
                                </div>
                                <RangsorSavok
                                    sorok={adat.topTermekek.map((termek) => ({
                                        kulcs: termek.termekId,
                                        cimke: termek.nev,
                                        mellek: `${szam(termek.mennyiseg)} ${termek.egyseg} · ${szam(termek.rendelesek)} rendelésben`,
                                        ertek: termek.bevetel,
                                    }))}
                                    formazo={forint}
                                    ures="Ebben az időszakban még nem fogyott termék."
                                />
                            </section>
                            <section className="db-kartya">
                                <div className="db-kartya-fej">
                                    <div>
                                        <h3>Bevétel kategóriánként</h3>
                                        <p>A rendelt tételek értéke</p>
                                    </div>
                                </div>
                                <RangsorSavok
                                    sorok={adat.kategoriak.map((sor) => ({
                                        kulcs: sor.kategoria,
                                        cimke: sor.kategoria,
                                        mellek: `${szam(sor.tetelek)} tétel`,
                                        ertek: sor.bevetel,
                                    }))}
                                    formazo={forint}
                                    ures="Nincs kategóriaadat ebben az időszakban."
                                />
                            </section>
                        </div>

                        <div className="db-racs db-racs--3">
                            <section className="db-kartya">
                                <div className="db-kartya-fej">
                                    <div>
                                        <h3>Rendelések megoszlása</h3>
                                        <p>Rendelések száma szerint</p>
                                    </div>
                                </div>
                                <MegoszlasSav cim="Átvételi mód" reszek={adat.atvetelModok} />
                                <MegoszlasSav cim="Vevő típusa" reszek={adat.vevoTipusok} />
                            </section>
                            <section className="db-kartya">
                                <div className="db-kartya-fej">
                                    <div>
                                        <h3>Legjobb vásárlók</h3>
                                        <p>Elköltött összeg szerint</p>
                                    </div>
                                </div>
                                {adat.topVasarlok.length ? (
                                    <ol className="db-lista">
                                        {adat.topVasarlok.map((vasarlo) => (
                                            <li key={vasarlo.email}>
                                                <div>
                                                    <strong>{vasarlo.nev}</strong>
                                                    <span>{vasarlo.email}</span>
                                                </div>
                                                <div className="db-lista-ertek">
                                                    <strong>{forint(vasarlo.bevetel)}</strong>
                                                    <span>{szam(vasarlo.rendelesek)} rendelés</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                ) : <p className="db-ures">Ebben az időszakban nem volt vásárlás.</p>}
                            </section>
                            <section className="db-kartya">
                                <div className="db-kartya-fej">
                                    <div>
                                        <h3>Top települések</h3>
                                        <p>Házhozszállítások száma szerint</p>
                                    </div>
                                </div>
                                <RangsorSavok
                                    sorok={adat.telepulesek.map((sor) => ({
                                        kulcs: sor.telepules,
                                        cimke: sor.telepules,
                                        mellek: forint(sor.bevetel),
                                        ertek: sor.rendelesek,
                                    }))}
                                    formazo={(ertek) => `${szam(ertek)} rendelés`}
                                    ures="Nem volt házhozszállítás ebben az időszakban."
                                />
                            </section>
                        </div>
                    </div>
                )}
            </section>

            {adat && (
                <section className={`db-szakasz${betoltes ? ' db-tartalom--frissul' : ''}`} aria-labelledby="db-aruhaz-cim">
                    <div className="db-szakasz-fej">
                        <h2 id="db-aruhaz-cim">Áruház most</h2>
                        <p>Aktuális állapot – az időszakválasztó erre a részre nem vonatkozik.</p>
                    </div>

                    <div className="db-csempek db-csempek--sor">
                        <StatCsempe cimke="Összes bevétel" ertek={forint(adat.mindenkori.bevetel)} mellek={`${szam(adat.mindenkori.rendelesek)} rendelésből`} />
                        <StatCsempe cimke="Regisztrált vásárlók" ertek={szam(adat.mindenkori.felhasznalok)} mellek="admin fiókok nélkül" />
                        <StatCsempe cimke="Termékek" ertek={szam(adat.keszlet.termekek)} mellek={`Készletérték: ${forint(adat.keszlet.keszletErtek)}`} />
                        <StatCsempe
                            cimke="Készlethiány"
                            ertek={`${szam(adat.keszlet.elfogyott)} elfogyott`}
                            mellek={`további ${szam(adat.keszlet.alacsony)} fogyóban (≤ ${szam(adat.keszlet.kuszob)})`}
                        />
                    </div>

                    <div className="db-racs db-racs--2">
                        <section className="db-kartya">
                            <div className="db-kartya-fej">
                                <div>
                                    <h3>Legutóbbi rendelések</h3>
                                    <p>Az utolsó {adat.legutobbiRendelesek.length || ''} rendelés</p>
                                </div>
                            </div>
                            {adat.legutobbiRendelesek.length ? (
                                <div className="db-tablazat-gorgeto">
                                    <table className="db-tablazat">
                                        <thead>
                                            <tr>
                                                <th scope="col">Időpont</th>
                                                <th scope="col">Vevő</th>
                                                <th scope="col">Átvétel</th>
                                                <th scope="col" className="db-szam">Végösszeg</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {adat.legutobbiRendelesek.map((rendeles) => (
                                                <tr key={rendeles.id}>
                                                    <td className="db-nowrap">{idopont(rendeles.datum)}</td>
                                                    <td>
                                                        <span className="db-cella-fo">{rendeles.nev}</span>
                                                        <span className="db-cella-mellek">{szam(rendeles.tetelSzam)} tétel · {rendeles.allapot}</span>
                                                    </td>
                                                    <td>{rendeles.atvetelModja}</td>
                                                    <td className="db-szam db-nowrap">{forint(rendeles.vegosszeg)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : <p className="db-ures">Még nem érkezett rendelés.</p>}
                        </section>

                        <section className="db-kartya">
                            <div className="db-kartya-fej">
                                <div>
                                    <h3>Fogyóban lévő termékek</h3>
                                    <p>Legfeljebb {szam(adat.keszlet.kuszob)} egység raktáron</p>
                                </div>
                                <Link className="db-nezet-gomb" to="/admin/termekek">Készlet kezelése</Link>
                            </div>
                            {adat.keszlet.alacsonyTermekek.length ? (
                                <div className="db-tablazat-gorgeto">
                                    <table className="db-tablazat">
                                        <thead>
                                            <tr>
                                                <th scope="col">Termék</th>
                                                <th scope="col" className="db-szam">Készlet</th>
                                                <th scope="col">Állapot</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {adat.keszlet.alacsonyTermekek.map((termek) => (
                                                <tr key={termek.id}>
                                                    <td>
                                                        <span className="db-cella-fo">{termek.nev}</span>
                                                        <span className="db-cella-mellek">{termek.kategoria} · {forint(termek.ar)}/{termek.egyseg}</span>
                                                    </td>
                                                    <td className="db-szam db-nowrap">{szam(termek.keszlet)} {termek.egyseg}</td>
                                                    <td><KeszletAllapot keszlet={termek.keszlet} /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : <p className="db-ures">Minden termékből van elegendő készlet.</p>}
                        </section>
                    </div>
                </section>
            )}
        </main>
    );
};

export default AdminDashboard;
