import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import Hoterkep from '../components/dashboard/Hoterkep';
import IdoszakValaszto from '../components/dashboard/IdoszakValaszto';
import KozelgoAtvetelek from '../components/dashboard/KozelgoAtvetelek';
import KulcsSzamok from '../components/dashboard/KulcsSzamok';
import MegoszlasSav from '../components/dashboard/MegoszlasSav';
import AllapotJelveny from '../components/rendeles/AllapotJelveny';
import OszlopDiagram from '../components/dashboard/OszlopDiagram';
import RangsorSavok from '../components/dashboard/RangsorSavok';
import SzekcioNav from '../components/dashboard/SzekcioNav';
import Valtozas from '../components/dashboard/Valtozas';
import { rendelesKeresesLink, rendelesLink, rendelesSzuroLink, termekLink } from '../utils/adminLinkek';
import { datum, forint, idopont, idotartam, ora, szam, szazalek, tomeg } from '../utils/dashboardFormazas';
import './AdminDashboard.css';

const ELORE_BEALLITOTT_IDOSZAKOK = ['7nap', '30nap', '90nap', '12honap'];
const ALAP_IDOSZAK = '30nap';

const EXPORTOK = [
    { tipus: 'rendelesek', cimke: 'Rendelések' },
    { tipus: 'idosor', cimke: 'Bevétel napi/havi bontásban' },
    { tipus: 'termekek', cimke: 'Termékeladások' },
    // A készlet aktuális állapot, az időszakválasztó nem vonatkozik rá.
    { tipus: 'keszlet', cimke: 'Teljes készlet', idoszakFuggetlen: true },
];

// A CSV-t a backend állítja elő; hitelesített letöltés, ezért fetch + blob.
const csvLetoltes = async (tipus, parameterek) => {
    const response = await fetch(`${API_URL}/dashboard/export?tipus=${tipus}&${parameterek}`, { credentials: 'include' });
    if (!response.ok) {
        const adat = await response.json().catch(() => ({}));
        throw new Error(adat.msg || 'Az exportot nem sikerült letölteni.');
    }
    const blob = await response.blob();
    const fajlnev = /filename="([^"]+)"/.exec(response.headers.get('Content-Disposition') ?? '')?.[1] ?? `${tipus}.csv`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fajlnev;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Az URL-ből a dashboard lekérdezésének paraméterei (érvénytelen értéknél az alapértelmezés).
const lekerdezesAllapot = (searchParams) => {
    const kert = searchParams.get('idoszak');
    const tol = searchParams.get('tol');
    const ig = searchParams.get('ig');
    const egyedi = kert === 'egyedi' && Boolean(tol) && Boolean(ig);
    const idoszak = egyedi ? 'egyedi' : ELORE_BEALLITOTT_IDOSZAKOK.includes(kert) ? kert : ALAP_IDOSZAK;
    const osszevetes = searchParams.get('osszevetes') === 'tavaly' ? 'tavaly' : 'elozo';
    const parameterek = new URLSearchParams({ idoszak, osszevetes });
    if (egyedi) {
        parameterek.set('tol', tol);
        parameterek.set('ig', ig);
    }
    return { idoszak, osszevetes, tol: egyedi ? tol : null, ig: egyedi ? ig : null, parameterek: parameterek.toString() };
};

// Az oldalsó navigáció pontjai; az id-k a lenti szekciókon / kártyákon vannak.
const SZEKCIOK = [
    {
        cim: 'Értékesítés',
        elemek: [
            { id: 'db-ertekesites', cimke: 'Összegzés' },
            { id: 'db-bevetel-alakulasa', cimke: 'Bevétel alakulása' },
            { id: 'db-top-termekek', cimke: 'Legnépszerűbb termékek' },
            { id: 'db-kategoriak', cimke: 'Kategóriák' },
            { id: 'db-megoszlas', cimke: 'Rendelések megoszlása' },
            { id: 'db-legjobb-vasarlok', cimke: 'Legjobb vásárlók' },
            { id: 'db-telepulesek', cimke: 'Top települések' },
            { id: 'db-vasarlok', cimke: 'Vásárlók' },
            { id: 'db-atfutas', cimke: 'Átfutási idő' },
            { id: 'db-szallitas', cimke: 'Szállítás' },
            { id: 'db-nem-fogyo', cimke: 'Nem fogyó termékek' },
            { id: 'db-rendelesi-idok', cimke: 'Rendelési idők' },
        ],
    },
    {
        cim: 'Áruház most',
        elemek: [
            { id: 'db-aruhaz', cimke: 'Aktuális állapot' },
            { id: 'db-fizetesre-var', cimke: 'Fizetésre várók' },
            { id: 'db-raklapok', cimke: 'Kint lévő raklapok' },
            { id: 'db-legutobbi', cimke: 'Legutóbbi rendelések' },
            { id: 'db-fogyoban', cimke: 'Fogyóban lévő termékek' },
        ],
    },
];

const StatCsempe = ({ cimke, ertek, mutato, osszevetes, mellek, figyelmeztetes }) => (
    <article className={`db-csempe${figyelmeztetes ? ' db-csempe--figyelmeztetes' : ''}`}>
        <span className="db-csempe-cimke">{cimke}</span>
        <strong className="db-csempe-ertek">{ertek}</strong>
        {mutato ? <Valtozas ertek={mutato.valtozas} osszevetes={osszevetes} /> : mellek && <span className="db-csempe-mellek">{mellek}</span>}
    </article>
);

const KartyaFej = ({ cim, alcim, children }) => (
    <div className="db-kartya-fej">
        <div>
            <h3>{cim}</h3>
            {alcim && <p>{alcim}</p>}
        </div>
        {children}
    </div>
);

const KESZLET_ALLAPOTOK = {
    elfogyott: { cimke: 'Elfogyott', osztaly: 'kritikus' },
    alacsony: { cimke: 'Alacsony', osztaly: 'figyelmeztetes' },
    hamarosan: { cimke: 'Hamar fogy', osztaly: 'figyelmeztetes' },
};

const KeszletAllapot = ({ allapot }) => {
    const { cimke, osztaly } = KESZLET_ALLAPOTOK[allapot] ?? KESZLET_ALLAPOTOK.alacsony;
    return (
        <span className={`db-allapot db-allapot--${osztaly}`}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
                {allapot === 'elfogyott' ? (
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
            {cimke}
        </span>
    );
};

const elegMeg = (termek) => {
    if (termek.keszlet <= 0) return { fo: 'elfogyott', mellek: null };
    if (termek.elegNap === null) return { fo: 'nincs friss eladás', mellek: null };
    return {
        fo: termek.elegNap < 1 ? '1 napon belül' : `kb. ${szam(Math.round(termek.elegNap))} nap`,
        mellek: `${szam(termek.napiUtem)} ${termek.egyseg}/nap`,
    };
};

const AdminDashboard = () => {
    const { user, authReady } = useAuth();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [frissites, setFrissites] = useState(0);
    const [tablazat, setTablazat] = useState(false);
    const [exportAllapot, setExportAllapot] = useState({ folyamatban: null, hiba: '' });
    const [valasz, setValasz] = useState({ kulcs: null, adat: null, hiba: '' });

    const lekerdezes = lekerdezesAllapot(searchParams);
    const keresKulcs = `${lekerdezes.parameterek}|${frissites}`;
    const admin = user?.role === 'admin';

    useEffect(() => {
        if (!authReady || !admin) return undefined;
        const vezerlo = new AbortController();

        fetch(`${API_URL}/dashboard?${lekerdezes.parameterek}`, {
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
    }, [authReady, admin, lekerdezes.parameterek, keresKulcs]);

    if (!authReady) return <p className="db-oldal-allapot">Munkamenet ellenőrzése…</p>;
    // Csak a kijelentkezett felhasználót küldjük a belépéshez; a bejelentkezett, de nem
    // admin felhasználót a főoldalra, különben a belépés oldal visszairányítaná ide (végtelen ciklus).
    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    if (!admin) return <Navigate to="/" replace />;

    const { adat, hiba } = valasz;
    const betoltes = valasz.kulcs !== keresKulcs;
    const osszevetes = adat?.idoszak.osszevetesCimke ?? '';

    // Az URL-ben csak az alapértelmezéstől eltérő beállítás marad.
    const idoszakValtas = (valtozas) => {
        const uj = { ...lekerdezes, ...valtozas };
        const parameterek = new URLSearchParams();
        if (uj.idoszak !== ALAP_IDOSZAK) parameterek.set('idoszak', uj.idoszak);
        if (uj.idoszak === 'egyedi') {
            parameterek.set('tol', uj.tol);
            parameterek.set('ig', uj.ig);
        }
        if (uj.osszevetes !== 'elozo') parameterek.set('osszevetes', uj.osszevetes);
        setSearchParams(parameterek, { replace: true });
    };

    return (
        <main className="dashboard">
            <SzekcioNav
                csoportok={SZEKCIOK}
                kesz={Boolean(adat)}
            />

            <div className="db-fo">
                <header className="db-fejlec">
                    <div>
                        <span>ADMINISZTRÁCIÓ</span>
                        <h1>Dashboard</h1>
                        <p>Bevétel, rendelések, vásárlók, szállítás és készlet egy helyen.</p>
                    </div>
                    <nav className="db-fejlec-linkek" aria-label="Admin oldalak">
                        <Link to="/admin/rendelesek">Rendelések</Link>
                        <Link to="/admin/arajanlatok">Árajánlatok</Link>
                        <Link to="/admin/termekek">Termékkezelés</Link>
                    </nav>
                </header>

                <section className="db-szakasz" id="db-ertekesites" aria-labelledby="db-ertekesites-cim">
                    <div className="db-szakasz-fej">
                        <h2 id="db-ertekesites-cim">Értékesítés</h2>
                        <div className="db-szurosor">
                            <IdoszakValaszto
                                idoszak={lekerdezes.idoszak}
                                tol={lekerdezes.tol}
                                ig={lekerdezes.ig}
                                osszevetes={lekerdezes.osszevetes}
                                onValtas={idoszakValtas}
                            />
                            <button
                                type="button"
                                className="db-frissit"
                                onClick={() => setFrissites((szamlalo) => szamlalo + 1)}
                                disabled={betoltes}
                            >
                                {betoltes && adat ? 'Frissítés…' : 'Frissítés'}
                            </button>
                            <details className="db-export">
                                <summary>CSV-export</summary>
                                <div className="db-export-menu">
                                    {EXPORTOK.map((elem) => (
                                        <button
                                            key={elem.tipus}
                                            type="button"
                                            disabled={Boolean(exportAllapot.folyamatban)}
                                            onClick={async (event) => {
                                                const menu = event.currentTarget.closest('details');
                                                setExportAllapot({ folyamatban: elem.tipus, hiba: '' });
                                                try {
                                                    await csvLetoltes(elem.tipus, lekerdezes.parameterek);
                                                    setExportAllapot({ folyamatban: null, hiba: '' });
                                                    if (menu) menu.open = false;
                                                } catch (error) {
                                                    setExportAllapot({ folyamatban: null, hiba: error.message });
                                                }
                                            }}
                                        >
                                            <strong>{exportAllapot.folyamatban === elem.tipus ? 'Készül…' : elem.cimke}</strong>
                                            <small>{elem.idoszakFuggetlen ? 'aktuális állapot' : adat?.idoszak.cimke.toLowerCase()}</small>
                                        </button>
                                    ))}
                                </div>
                            </details>
                            {adat && <span className="db-frissitve">Frissítve {ora(adat.generalva)}</span>}
                        </div>
                    </div>

                    {hiba && <p className="db-hiba" role="alert">{hiba}</p>}
                    {exportAllapot.hiba && <p className="db-hiba" role="alert">{exportAllapot.hiba}</p>}
                    {!adat && betoltes && <p className="db-oldal-allapot">Adatok betöltése…</p>}

                    {adat && (
                        <div className={`db-tartalom${betoltes ? ' db-tartalom--frissul' : ''}`} aria-busy={betoltes}>
                            <div className="db-kpi">
                                <article className="db-hero">
                                    <span className="db-csempe-cimke">Bevétel · {adat.idoszak.cimke.toLowerCase()}</span>
                                    <strong className="db-hero-ertek">{forint(adat.osszegzes.bevetel.ertek)}</strong>
                                    <Valtozas ertek={adat.osszegzes.bevetel.valtozas} osszevetes={osszevetes} />
                                    <span className="db-csempe-mellek">
                                        {adat.idoszak.osszevetes === 'tavaly' ? 'Tavaly ugyanekkor' : 'Előző időszak'}: {forint(adat.osszegzes.bevetel.elozo)}
                                    </span>
                                    <span className="db-csempe-mellek">Lemondott rendelések és raklap-betétdíj nélkül</span>
                                </article>
                                <div className="db-csempek">
                                    <StatCsempe cimke="Rendelések" ertek={szam(adat.osszegzes.rendelesek.ertek)} mutato={adat.osszegzes.rendelesek} osszevetes={osszevetes} />
                                    <StatCsempe cimke="Átlagos kosárérték" ertek={forint(adat.osszegzes.atlagosKosar.ertek)} mutato={adat.osszegzes.atlagosKosar} osszevetes={osszevetes} />
                                    <StatCsempe cimke="Vásárlók" ertek={szam(adat.osszegzes.vasarlok.ertek)} mutato={adat.osszegzes.vasarlok} osszevetes={osszevetes} />
                                    <StatCsempe cimke="Új regisztrációk" ertek={szam(adat.osszegzes.ujFelhasznalok.ertek)} mutato={adat.osszegzes.ujFelhasznalok} osszevetes={osszevetes} />
                                    <StatCsempe
                                        cimke="Lemondási arány"
                                        ertek={szazalek(adat.osszegzes.lemondott.arany)}
                                        mellek={`${szam(adat.osszegzes.lemondott.rendelesek)} lemondva (${forint(adat.osszegzes.lemondott.ertek)}) · ${osszevetes}: ${szazalek(adat.osszegzes.lemondott.elozoArany)}`}
                                    />
                                    <StatCsempe
                                        cimke="Adott kedvezmények"
                                        ertek={forint(adat.osszegzes.kedvezmeny.ertek)}
                                        mellek={`${szam(adat.osszegzes.kedvezmeny.rendelesek)} rendelésnél · ${osszevetes}: ${forint(adat.osszegzes.kedvezmeny.elozo)}`}
                                    />
                                </div>
                            </div>

                            <section className="db-kartya" id="db-bevetel-alakulasa">
                                <KartyaFej cim="Bevétel alakulása" alcim={`${adat.idoszak.bontas === 'honap' ? 'Havi' : 'Napi'} bontás, forintban`}>
                                    <button type="button" className="db-nezet-gomb" onClick={() => setTablazat((elozo) => !elozo)}>
                                        {tablazat ? 'Diagram nézet' : 'Táblázat nézet'}
                                    </button>
                                </KartyaFej>
                                <OszlopDiagram adatok={adat.idosor} bontas={adat.idoszak.bontas} tablazat={tablazat} />
                            </section>

                            <div className="db-racs db-racs--2">
                                <section className="db-kartya" id="db-top-termekek">
                                    <KartyaFej cim="Legnépszerűbb termékek" alcim="Bevétel szerint · a névre kattintva szerkeszthető" />
                                    <RangsorSavok
                                        sorok={adat.topTermekek.map((termek) => ({
                                            kulcs: termek.termekId,
                                            cimke: termek.nev,
                                            link: termekLink(termek.termekId),
                                            mellek: `${szam(termek.mennyiseg)} ${termek.egyseg} · ${szam(termek.rendelesek)} rendelésben`,
                                            ertek: termek.bevetel,
                                        }))}
                                        formazo={forint}
                                        ures="Ebben az időszakban még nem fogyott termék."
                                    />
                                </section>
                                <section className="db-kartya" id="db-kategoriak">
                                    <KartyaFej cim="Bevétel kategóriánként" alcim="A rendelt tételek értéke" />
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
                                <section className="db-kartya" id="db-megoszlas">
                                    <KartyaFej cim="Rendelések megoszlása" alcim="Rendelések száma szerint" />
                                    <MegoszlasSav cim="Átvételi mód" reszek={adat.atvetelModok} />
                                    <MegoszlasSav cim="Vevő típusa" reszek={adat.vevoTipusok} />
                                    <MegoszlasSav cim="Fizetési mód" reszek={adat.fizetesiModok} />
                                </section>
                                <section className="db-kartya" id="db-legjobb-vasarlok">
                                    <KartyaFej cim="Legjobb vásárlók" alcim="Elköltött összeg szerint" />
                                    {adat.topVasarlok.length ? (
                                        <ol className="db-lista">
                                            {adat.topVasarlok.map((vasarlo) => (
                                                <li key={vasarlo.email}>
                                                    <div>
                                                        <Link className="db-link" to={rendelesKeresesLink(vasarlo.email)}><strong>{vasarlo.nev}</strong></Link>
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
                                <section className="db-kartya" id="db-telepulesek">
                                    <KartyaFej cim="Top települések" alcim="Házhozszállítások száma szerint" />
                                    <RangsorSavok
                                        sorok={adat.telepulesek.map((sor) => ({
                                            kulcs: sor.telepules,
                                            cimke: sor.telepules,
                                            link: rendelesKeresesLink(sor.telepules),
                                            mellek: forint(sor.bevetel),
                                            ertek: sor.rendelesek,
                                        }))}
                                        formazo={(ertek) => `${szam(ertek)} rendelés`}
                                        ures="Nem volt házhozszállítás ebben az időszakban."
                                    />
                                </section>
                            </div>

                            <div className="db-racs db-racs--3">
                                <section className="db-kartya" id="db-vasarlok">
                                    <KartyaFej cim="Vásárlók" alcim="Visszatérők és fiókhasználat" />
                                    <MegoszlasSav cim="Új és visszatérő vásárlók" reszek={adat.vasarloTipusok} egyseg="vásárló" />
                                    <MegoszlasSav cim="Fiókkal vagy vendégként" reszek={adat.fiokTipusok} />
                                </section>
                                <section className="db-kartya">
                                    <KartyaFej
                                        cim="Árajánlatok"
                                        alcim={`Az időszakban érkezett kérések; rendelés = ${adat.arajanlatok.konverziosNapok} napon belül ugyanattól a vevőtől`}
                                    >
                                        <Link className="db-nezet-gomb" to="/admin/arajanlatok">Árajánlatok</Link>
                                    </KartyaFej>
                                    <KulcsSzamok
                                        sorok={[
                                            {
                                                cimke: 'Rendelés lett belőle',
                                                ertek: adat.arajanlatok.ajanlatok ? szazalek(adat.arajanlatok.konverzio) : '–',
                                                mellek: `${szam(adat.arajanlatok.rendelesLett)} / ${szam(adat.arajanlatok.ajanlatok)} kérés`,
                                                kiemelt: true,
                                            },
                                            {
                                                cimke: 'Ebből bevétel',
                                                ertek: forint(adat.arajanlatok.rendelesBevetel),
                                                mellek: `kért listaérték: ${forint(adat.arajanlatok.listaOsszeg)}`,
                                            },
                                            {
                                                cimke: 'Nyitott ajánlatok most',
                                                ertek: forint(adat.arajanlatok.nyitott.listaOsszeg),
                                                mellek: `${szam(adat.arajanlatok.nyitott.db)} db, listaáron`,
                                            },
                                        ]}
                                    />
                                    <ul className="db-chipek" aria-label="Az időszak ajánlatkérései állapot szerint">
                                        {adat.arajanlatok.allapotok.map((allapot) => (
                                            <li key={allapot.kulcs}>
                                                <Link to={`/admin/arajanlatok?allapot=${allapot.kulcs}`}>
                                                    {allapot.cimke} <strong>{szam(allapot.db)}</strong>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                                <section className="db-kartya" id="db-atfutas">
                                    <KartyaFej cim="Átfutási idő" alcim="Az időszakban leadott rendelések, a leadástól számítva" />
                                    <KulcsSzamok
                                        sorok={[
                                            {
                                                cimke: 'Visszaigazolásig (medián)',
                                                ertek: idotartam(adat.atfutas.visszaigazolas.medianMs),
                                                mellek: adat.atfutas.visszaigazolas.db
                                                    ? `átlag ${idotartam(adat.atfutas.visszaigazolas.atlagMs)} · ${szam(adat.atfutas.visszaigazolas.db)} rendelés`
                                                    : 'még nincs visszaigazolt rendelés',
                                                kiemelt: true,
                                            },
                                            {
                                                cimke: 'Teljesítésig (medián)',
                                                ertek: idotartam(adat.atfutas.teljesites.medianMs),
                                                mellek: adat.atfutas.teljesites.db
                                                    ? `átlag ${idotartam(adat.atfutas.teljesites.atlagMs)} · ${szam(adat.atfutas.teljesites.db)} rendelés`
                                                    : 'még nincs teljesített rendelés',
                                                kiemelt: true,
                                            },
                                        ]}
                                    />
                                    <p className="db-megjegyzes">
                                        A medián a „tipikus” rendelés ideje, ezt egy-egy elhúzódó rendelés nem torzítja úgy, mint az átlagot.
                                    </p>
                                </section>
                            </div>

                            <div className="db-racs db-racs--2">
                                <section className="db-kartya" id="db-szallitas">
                                    <KartyaFej cim="Szállítás" alcim="Az időszak házhozszállításai" />
                                    <KulcsSzamok
                                        sorok={[
                                            { cimke: 'Kiszállítások', ertek: szam(adat.szallitas.rendelesek), mellek: `${szam(adat.szallitas.fuvarok)} forduló` },
                                            { cimke: 'Kiszállított tömeg', ertek: tomeg(adat.szallitas.sulyKg) },
                                            { cimke: 'Szállítási díjbevétel', ertek: forint(adat.szallitas.szallitasiDij) },
                                            {
                                                cimke: 'Darus lerakodás',
                                                ertek: szam(adat.szallitas.darus),
                                                mellek: `a kiszállítások ${szazalek(adat.szallitas.darusArany)}-a`,
                                            },
                                        ]}
                                    />
                                    <h4 className="db-alcim">Zónák szerint</h4>
                                    <RangsorSavok
                                        sorok={adat.szallitas.zonak.map((zona) => ({
                                            kulcs: zona.kulcs,
                                            cimke: zona.nev,
                                            mellek: `${forint(zona.szallitasiDij)} szállítási díj`,
                                            ertek: zona.rendelesek,
                                        }))}
                                        formazo={(ertek) => `${szam(ertek)} kiszállítás`}
                                        ures="Nem volt házhozszállítás ebben az időszakban."
                                    />
                                </section>
                                <section className="db-kartya" id="db-nem-fogyo">
                                    <KartyaFej cim="Nem fogyó termékek" alcim="Van készleten, de az időszakban egyszer sem kelt el (a közben felvettek nélkül)" />
                                    <KulcsSzamok
                                        sorok={[
                                            { cimke: 'Termékek', ertek: szam(adat.nemFogyo.db), mellek: `a ${szam(adat.keszlet.termekek)} termékből` },
                                            { cimke: 'Lekötött készletérték', ertek: forint(adat.nemFogyo.ertek), mellek: 'listaáron' },
                                        ]}
                                    />
                                    {adat.nemFogyo.termekek.length ? (
                                        <div className="db-tablazat-gorgeto">
                                            <table className="db-tablazat">
                                                <thead>
                                                    <tr>
                                                        <th scope="col">Termék</th>
                                                        <th scope="col" className="db-szam">Készlet</th>
                                                        <th scope="col" className="db-szam">Érték</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {adat.nemFogyo.termekek.map((termek) => (
                                                        <tr key={termek.id}>
                                                            <td>
                                                                <Link className="db-cella-fo db-link" to={termekLink(termek.id)}>{termek.nev}</Link>
                                                                <span className="db-cella-mellek">
                                                                    {termek.kategoria} · {termek.utolsoEladas ? `utoljára eladva: ${datum(termek.utolsoEladas)}` : 'még sosem kelt el'}
                                                                </span>
                                                            </td>
                                                            <td className="db-szam db-nowrap">{szam(termek.keszlet)} {termek.egyseg}</td>
                                                            <td className="db-szam db-nowrap">{forint(termek.ertek)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : <p className="db-ures">Minden készleten lévő termékből fogyott ebben az időszakban.</p>}
                                </section>
                            </div>

                            <section className="db-kartya" id="db-rendelesi-idok">
                                <KartyaFej cim="Mikor érkeznek a rendelések" alcim="A hét napjai és a nap órái szerint, magyar idő" />
                                <Hoterkep adat={adat.hoterkep} />
                            </section>
                        </div>
                    )}
                </section>

                {adat && (
                    <section className={`db-szakasz${betoltes ? ' db-tartalom--frissul' : ''}`} id="db-aruhaz" aria-labelledby="db-aruhaz-cim">
                        <div className="db-szakasz-fej">
                            <h2 id="db-aruhaz-cim">Áruház most</h2>
                            <p>Aktuális állapot – az időszakválasztó erre a részre nem vonatkozik.</p>
                        </div>

                        {adat.emailHibak.db > 0 && (
                            <div className="db-riasztas" role="alert">
                                <strong>
                                    {szam(adat.emailHibak.db)} rendelésnél a vevő nem kapta meg a visszaigazoló e-mailt
                                    {' '}(utolsó {szam(adat.emailHibak.napok)} nap). Érdemes felvenni vele a kapcsolatot, és ellenőrizni az SMTP-beállításokat.
                                </strong>
                                <ul>
                                    {adat.emailHibak.rendelesek.map((rendeles) => (
                                        <li key={rendeles.id}>
                                            <Link className="db-link" to={rendelesLink(rendeles)}>#{rendeles.rovidAzonosito} · {rendeles.nev}</Link>
                                            {' '}<span>{rendeles.email} · {idopont(rendeles.datum)}</span>
                                            {rendeles.hiba && <small title={rendeles.hiba}>{rendeles.hiba.split(' | ')[0]}</small>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="db-csempek db-csempek--sor">
                            <StatCsempe
                                cimke="Feldolgozásra vár"
                                ertek={`${szam(adat.rendelesAllapotok.feldolgozasra_var)} rendelés`}
                                mellek={<Link className="db-csempe-link" to="/admin/rendelesek?allapot=feldolgozasra_var">Rendelések kezelése →</Link>}
                            />
                            <StatCsempe
                                cimke="Új árajánlatkérés"
                                ertek={`${szam(adat.ujArajanlatok ?? 0)} db`}
                                mellek={<Link className="db-csempe-link" to="/admin/arajanlatok?allapot=uj">Árajánlatok →</Link>}
                            />
                            <StatCsempe
                                cimke="Átutalásra vár"
                                ertek={forint(adat.fizetesek.atutalas.osszeg)}
                                figyelmeztetes={adat.fizetesek.atutalas.lejart > 0}
                                mellek={(
                                    <>
                                        {szam(adat.fizetesek.atutalas.db)} rendelés
                                        {adat.fizetesek.atutalas.lejart > 0 && `, ebből ${szam(adat.fizetesek.atutalas.lejart)} határidőn túl`}
                                        {' · '}
                                        <Link className="db-csempe-link" to={rendelesSzuroLink({ fizetes: 'atutalasra_var' })}>Megnézem →</Link>
                                    </>
                                )}
                            />
                            <StatCsempe
                                cimke="Raklap a vevőknél"
                                ertek={`${szam(adat.raklapok.kint)} db`}
                                mellek={`${forint(adat.raklapok.betetdij)} betétdíj jár vissza értük`}
                            />
                            <StatCsempe cimke="Összes bevétel" ertek={forint(adat.mindenkori.bevetel)} mellek={`${szam(adat.mindenkori.rendelesek)} rendelésből, lemondottak és betétdíj nélkül`} />
                            <StatCsempe cimke="Regisztrált vásárlók" ertek={szam(adat.mindenkori.felhasznalok)} mellek="admin fiókok nélkül" />
                            <StatCsempe cimke="Termékek" ertek={szam(adat.keszlet.termekek)} mellek={`Készletérték: ${forint(adat.keszlet.keszletErtek)}`} />
                            <StatCsempe
                                cimke="Készlethiány"
                                ertek={`${szam(adat.keszlet.elfogyott)} elfogyott`}
                                mellek={`${szam(adat.keszlet.alacsony)} fogyóban (≤ ${szam(adat.keszlet.kuszob)}), ${szam(adat.keszlet.hamarosan)} ${szam(adat.keszlet.elorejelzesNapok)} napon belül fogyhat ki`}
                            />
                        </div>

                        <section className="db-kartya">
                            <KartyaFej
                                cim="Közelgő kiszállítások és átvételek"
                                alcim={`Ma és a következő 6 nap, valamint a lejárt napú, még nyitott rendelések${adat.kozelgo.tobb ? ' – csak az első 60 látszik' : ''}`}
                            >
                                <Link className="db-nezet-gomb" to="/admin/rendelesek?allapot=visszaigazolva">Visszaigazolt rendelések</Link>
                            </KartyaFej>
                            <KozelgoAtvetelek adat={adat.kozelgo} />
                        </section>

                        <div className="db-racs db-racs--2">
                            <section className="db-kartya" id="db-fizetesre-var">
                                <KartyaFej cim="Fizetésre váró rendelések" alcim={`Átutalás határideje: ${szam(adat.fizetesek.hataridoNap)} nap a rendeléstől`} />
                                <KulcsSzamok
                                    sorok={[
                                        {
                                            cimke: 'Átutalás nem érkezett meg',
                                            ertek: forint(adat.fizetesek.atutalas.osszeg),
                                            mellek: `${szam(adat.fizetesek.atutalas.db)} rendelés`,
                                        },
                                        {
                                            cimke: 'Ebből határidőn túl',
                                            ertek: forint(adat.fizetesek.atutalas.lejartOsszeg),
                                            mellek: `${szam(adat.fizetesek.atutalas.lejart)} rendelés`,
                                        },
                                        {
                                            cimke: 'Lejárt kártyás fizetés',
                                            ertek: forint(adat.fizetesek.stripeLejart.osszeg),
                                            mellek: `${szam(adat.fizetesek.stripeLejart.db)} rendelés, utolsó ${szam(adat.fizetesek.stripeLejart.napok)} nap (ezek lemondódtak)`,
                                        },
                                        {
                                            cimke: 'Teljesítve, de nincs fizetve',
                                            ertek: forint(adat.fizetesek.teljesitveFizetetlen.osszeg),
                                            mellek: `${szam(adat.fizetesek.teljesitveFizetetlen.db)} rendelés`,
                                        },
                                    ]}
                                />
                                {adat.fizetesek.teljesitveFizetetlen.rendelesek.length > 0 && (
                                    <>
                                        <h4 className="db-alcim">Teljesített, ki nem fizetett rendelések</h4>
                                        <ol className="db-lista">
                                            {adat.fizetesek.teljesitveFizetetlen.rendelesek.map((rendeles) => (
                                                <li key={rendeles.id}>
                                                    <div>
                                                        <Link className="db-link" to={rendelesLink(rendeles)}><strong>{rendeles.nev}</strong></Link>
                                                        <span>#{rendeles.rovidAzonosito} · {rendeles.fizetesiMod} · {datum(rendeles.datum)}</span>
                                                    </div>
                                                    <div className="db-lista-ertek">
                                                        <strong>{forint(rendeles.vegosszeg)}</strong>
                                                    </div>
                                                </li>
                                            ))}
                                        </ol>
                                    </>
                                )}
                                <div className="db-kartya-linkek">
                                    <Link className="db-nezet-gomb" to={rendelesSzuroLink({ fizetes: 'atutalasra_var' })}>Átutalásra várók</Link>
                                    <Link className="db-nezet-gomb" to={rendelesSzuroLink({ allapot: 'teljesitve', fizetes: 'atutalasra_var' })}>Teljesített, fizetetlen</Link>
                                </div>
                            </section>

                            <section className="db-kartya" id="db-raklapok">
                                <KartyaFej cim="Kint lévő raklapok" alcim="Teljesített rendelésekből, még vissza nem hozott raklapok" />
                                <KulcsSzamok
                                    sorok={[
                                        { cimke: 'Raklap a vevőknél', ertek: `${szam(adat.raklapok.kint)} db`, mellek: `${szam(adat.raklapok.vevokSzama)} vevőnél`, kiemelt: true },
                                        { cimke: 'Visszajáró betétdíj', ertek: forint(adat.raklapok.betetdij), mellek: 'ha mindet visszahozzák', kiemelt: true },
                                    ]}
                                />
                                {adat.raklapok.vevok.length ? (
                                    <ol className="db-lista">
                                        {adat.raklapok.vevok.map((vevo) => (
                                            <li key={vevo.email}>
                                                <div>
                                                    <Link className="db-link" to={rendelesKeresesLink(vevo.email, { allapot: 'teljesitve' })}><strong>{vevo.nev}</strong></Link>
                                                    <span>{vevo.email} · legrégebbi: {datum(vevo.legregebbi)}</span>
                                                </div>
                                                <div className="db-lista-ertek">
                                                    <strong>{szam(vevo.kint)} raklap</strong>
                                                    <span>{forint(vevo.betetdij)}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                ) : <p className="db-ures">Minden raklap visszakerült.</p>}
                            </section>
                        </div>

                        <div className="db-racs db-racs--2">
                            <section className="db-kartya" id="db-legutobbi">
                                <KartyaFej cim="Legutóbbi rendelések" alcim="Legfrissebb elöl, lemondottakkal együtt">
                                    <Link className="db-nezet-gomb" to="/admin/rendelesek">Összes rendelés</Link>
                                </KartyaFej>
                                {adat.legutobbiRendelesek.length ? (
                                    <div className="db-tablazat-gorgeto">
                                        <table className="db-tablazat">
                                            <thead>
                                                <tr>
                                                    <th scope="col">Időpont</th>
                                                    <th scope="col">Vevő</th>
                                                    <th scope="col">Állapot</th>
                                                    <th scope="col" className="db-szam">Végösszeg</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {adat.legutobbiRendelesek.map((rendeles) => (
                                                    <tr key={rendeles.id}>
                                                        <td className="db-nowrap">{idopont(rendeles.datum)}</td>
                                                        <td>
                                                            <Link className="db-cella-fo db-link" to={rendelesLink(rendeles)}>{rendeles.nev}</Link>
                                                            <span className="db-cella-mellek">#{rendeles.rovidAzonosito} · {szam(rendeles.tetelSzam)} tétel · {rendeles.atvetelModja}</span>
                                                        </td>
                                                        <td><AllapotJelveny allapot={rendeles.allapot} cimke={rendeles.allapotCimke} /></td>
                                                        <td className="db-szam db-nowrap">{forint(rendeles.vegosszeg)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : <p className="db-ures">Még nem érkezett rendelés.</p>}
                            </section>

                            <section className="db-kartya" id="db-fogyoban">
                                <KartyaFej
                                    cim="Fogyóban lévő termékek"
                                    alcim={`Legfeljebb ${szam(adat.keszlet.kuszob)} egység, vagy az utolsó ${szam(adat.keszlet.utemNapok)} nap üteme szerint ${szam(adat.keszlet.elorejelzesNapok)} napon belül elfogy`}
                                >
                                    <Link className="db-nezet-gomb" to="/admin/termekek">Készlet kezelése</Link>
                                </KartyaFej>
                                {adat.keszlet.alacsonyTermekek.length ? (
                                    <div className="db-tablazat-gorgeto">
                                        <table className="db-tablazat">
                                            <thead>
                                                <tr>
                                                    <th scope="col">Termék</th>
                                                    <th scope="col" className="db-szam">Készlet</th>
                                                    <th scope="col">Elég még</th>
                                                    <th scope="col">Állapot</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {adat.keszlet.alacsonyTermekek.map((termek) => {
                                                    const eleg = elegMeg(termek);
                                                    return (
                                                        <tr key={termek.id}>
                                                            <td>
                                                                <Link className="db-cella-fo db-link" to={termekLink(termek.id)}>{termek.nev}</Link>
                                                                <span className="db-cella-mellek">{termek.kategoria} · {forint(termek.ar)}/{termek.egyseg}</span>
                                                            </td>
                                                            <td className="db-szam db-nowrap">{szam(termek.keszlet)} {termek.egyseg}</td>
                                                            <td className="db-nowrap">
                                                                <span className={eleg.mellek ? 'db-cella-fo' : 'db-cella-mellek'}>{eleg.fo}</span>
                                                                {eleg.mellek && <span className="db-cella-mellek">{eleg.mellek}</span>}
                                                            </td>
                                                            <td><KeszletAllapot allapot={termek.allapot} /></td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : <p className="db-ures">Minden termékből van elegendő készlet.</p>}
                            </section>
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
};

export default AdminDashboard;
