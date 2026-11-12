import { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';
import { useCart } from '../context/CartContext';
import { forint } from '../utils/termek';
import './Vasarlas.css';

const uresCim = () => ({ iranyitoszam: '', telepules: '', utca: '' });

const CimMezok = ({ cim, frissit, tipus, letiltva = false }) => (
    <div className="vasarlas-cim-mezok">
        <label>
            Irányítószám *
            <input autoComplete={tipus === 'szallitas' ? 'shipping postal-code' : 'billing postal-code'} inputMode="numeric" maxLength="10" value={cim.iranyitoszam} onChange={(event) => frissit('iranyitoszam', event.target.value)} placeholder="1234" required disabled={letiltva} />
        </label>
        <label>
            Város *
            <input autoComplete={tipus === 'szallitas' ? 'shipping address-level2' : 'billing address-level2'} maxLength="100" value={cim.telepules} onChange={(event) => frissit('telepules', event.target.value)} placeholder="Település" required disabled={letiltva} />
        </label>
        <label className="vasarlas-utca-mezo">
            Utca / házszám / ajtó *
            <input autoComplete={tipus === 'szallitas' ? 'shipping street-address' : 'billing street-address'} maxLength="200" value={cim.utca} onChange={(event) => frissit('utca', event.target.value)} placeholder="Utca, házszám, emelet, ajtó" required disabled={letiltva} />
        </label>
    </div>
);

const Vasarlas = () => {
    const { tetelek, vegosszeg, urit } = useCart();
    const [email, setEmail] = useState('');
    const [atvetelModja, setAtvetelModja] = useState('hazhozszallitas');
    const [szallitasiEgyezik, setSzallitasiEgyezik] = useState(true);
    const [szallitasiNev, setSzallitasiNev] = useState('');
    const [szallitasiAdatok, setSzallitasiAdatok] = useState(uresCim);
    const [futarnakMegjegyzes, setFutarnakMegjegyzes] = useState('');
    const [szamlazasiTipus, setSzamlazasiTipus] = useState('maganszemely');
    const [szamlazasiNev, setSzamlazasiNev] = useState('');
    const [adoszam, setAdoszam] = useState('');
    const [szamlazasiAdatok, setSzamlazasiAdatok] = useState(uresCim);
    const [szamlazasiMegjegyzes, setSzamlazasiMegjegyzes] = useState('');
    const [kuldes, setKuldes] = useState(false);
    const [hiba, setHiba] = useState('');
    const [rendelesAzonosito, setRendelesAzonosito] = useState('');

    const cimFrissit = (frissito, mezo, ertek) => {
        frissito((elozo) => ({ ...elozo, [mezo]: ertek }));
    };

    const rendelesLead = async (event) => {
        event.preventDefault();
        setHiba('');
        setKuldes(true);
        try {
            const response = await fetch(`${API_URL}/rendelesek`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    teljesNev: szamlazasiNev,
                    atvetelModja,
                    szallitasiEgyezik,
                    szallitasiAdatok: atvetelModja === 'hazhozszallitas'
                        ? {
                            atvevoNev: szallitasiEgyezik ? szamlazasiNev : szallitasiNev,
                            ...(szallitasiEgyezik ? szamlazasiAdatok : szallitasiAdatok),
                            megjegyzes: futarnakMegjegyzes,
                        }
                        : null,
                    szamlazasiAdatok: {
                        tipus: szamlazasiTipus,
                        nev: szamlazasiNev,
                        adoszam: szamlazasiTipus === 'ceg' ? adoszam : '',
                        ...szamlazasiAdatok,
                        megjegyzes: szamlazasiMegjegyzes,
                    },
                    tetelek: tetelek.map((tetel) => ({ termekId: tetel.id, mennyiseg: tetel.mennyiseg })),
                }),
            });
            const valasz = await response.json();
            if (!response.ok) throw new Error(valasz.msg || 'A rendelést nem sikerült rögzíteni.');

            setRendelesAzonosito(valasz.rendeles.id);
            urit();
        } catch (error) {
            setHiba(error.message || 'A szerver nem érhető el. Próbáld újra később!');
        } finally {
            setKuldes(false);
        }
    };

    if (rendelesAzonosito) {
        return (
            <main className="vasarlas-oldal">
                <section className="vasarlas-siker" role="status">
                    <span className="vasarlas-siker-ikon" aria-hidden="true">✓</span>
                    <span className="vasarlas-felirat">RENDELÉS RÖGZÍTVE</span>
                    <h1>Köszönjük a rendelésed!</h1>
                    <p>A rendelésedet megkaptuk. Őrizd meg az azonosítót, ügyintézésnél hasznos lehet.</p>
                    <div className="vasarlas-azonosito">Rendelésazonosító <strong>{rendelesAzonosito}</strong></div>
                    <Link className="vasarlas-fo-gomb" to="/termekek">Vissza a termékekhez</Link>
                </section>
            </main>
        );
    }

    if (tetelek.length === 0) {
        return (
            <main className="vasarlas-oldal">
                <section className="vasarlas-ures">
                    <span className="vasarlas-felirat">VÁSÁRLÁS</span>
                    <h1>Most üres a kosarad</h1>
                    <p>Tegyél néhány terméket a kosárba, utána itt kényelmesen leadhatod a rendelést.</p>
                    <Link className="vasarlas-fo-gomb" to="/termekek">Termékek megtekintése</Link>
                </section>
            </main>
        );
    }

    return (
        <main className="vasarlas-oldal">
            <header className="vasarlas-fejlec">
                <Link className="vasarlas-vissza" to="/kosar">← Vissza a kosárhoz</Link>
                <span className="vasarlas-felirat">BIZTONSÁGOS RENDELÉSLEADÁS</span>
                <h1>Fejezd be a vásárlást</h1>
                <p>Add meg az elérhetőségedet, a szállítási és számlázási adatokat, majd válaszd ki az átvételt.</p>
            </header>

            <div className="vasarlas-elrendezes">
                <form className="vasarlas-urlap" onSubmit={rendelesLead}>
                    <section className="vasarlas-kartya">
                        <div className="vasarlas-szekcio-fej">
                            <span>01</span>
                            <div><h2>Kapcsolattartás</h2><p>A rendelés egyeztetéséhez szükséges.</p></div>
                        </div>
                        <div className="vasarlas-mezok">
                            <label>
                                E-mail-cím
                                <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nev@email.hu" required />
                            </label>
                        </div>
                    </section>

                    <section className="vasarlas-kartya">
                        <div className="vasarlas-szekcio-fej">
                            <span>02</span>
                            <div><h2>Szállítás</h2><p>* a megjelölt mezők kitöltése kötelező</p></div>
                        </div>
                        <div className="vasarlas-atvetel-valaszto">
                            <label className={`vasarlas-atvetel-kartya ${atvetelModja === 'hazhozszallitas' ? 'aktiv' : ''}`}>
                                <input type="radio" name="atvetelModja" value="hazhozszallitas" checked={atvetelModja === 'hazhozszallitas'} onChange={(event) => setAtvetelModja(event.target.value)} />
                                <span className="vasarlas-atvetel-ikon" aria-hidden="true">⌂</span>
                                <span><strong>Házhoz szállítás</strong><small>Kérjük, add meg a pontos címet.</small></span>
                            </label>
                            <label className={`vasarlas-atvetel-kartya ${atvetelModja === 'szemelyes_atvetel' ? 'aktiv' : ''}`}>
                                <input type="radio" name="atvetelModja" value="szemelyes_atvetel" checked={atvetelModja === 'szemelyes_atvetel'} onChange={(event) => setAtvetelModja(event.target.value)} />
                                <span className="vasarlas-atvetel-ikon" aria-hidden="true">⌖</span>
                                <span><strong>Személyes átvétel</strong><small>Átvétel a Tüzép telephelyén.</small></span>
                            </label>
                        </div>
                        {atvetelModja === 'hazhozszallitas' && (
                            <div className="vasarlas-cim-blokk">
                                <label className="vasarlas-nev-mezo">
                                    Átvevő neve *
                                    <input type="text" autoComplete="shipping name" minLength="2" maxLength="120" value={szallitasiEgyezik ? szamlazasiNev : szallitasiNev} onChange={(event) => setSzallitasiNev(event.target.value)} placeholder="Átvevő teljes neve" required disabled={szallitasiEgyezik} />
                                </label>
                                <CimMezok
                                    tipus="szallitas"
                                    cim={szallitasiEgyezik ? szamlazasiAdatok : szallitasiAdatok}
                                    frissit={(mezo, ertek) => cimFrissit(szallitasiEgyezik ? setSzamlazasiAdatok : setSzallitasiAdatok, mezo, ertek)}
                                    letiltva={szallitasiEgyezik}
                                />
                                <label className="vasarlas-egyezik-jelolo">
                                    <input type="checkbox" checked={szallitasiEgyezik} onChange={(event) => setSzallitasiEgyezik(event.target.checked)} />
                                    <span>A szállítási adatok megegyeznek a számlázási adatokkal</span>
                                </label>
                                <label className="vasarlas-megjegyzes-mezo">
                                    Megjegyzés a futárnak
                                    <textarea rows="3" maxLength="500" value={futarnakMegjegyzes} onChange={(event) => setFutarnakMegjegyzes(event.target.value)} placeholder="Kapucsengő, behajtás vagy egyéb hasznos információ (nem kötelező)" />
                                </label>
                            </div>
                        )}
                    </section>

                    <section className="vasarlas-kartya">
                        <div className="vasarlas-szekcio-fej">
                            <span>03</span>
                            <div><h2>Számlázás</h2><p>* a megjelölt mezők kitöltése kötelező</p></div>
                        </div>
                        <div className="vasarlas-szemely-tipus">
                            <label className={szamlazasiTipus === 'maganszemely' ? 'aktiv' : ''}>
                                <input type="radio" name="szamlazasiTipus" value="maganszemely" checked={szamlazasiTipus === 'maganszemely'} onChange={(event) => setSzamlazasiTipus(event.target.value)} />
                                Magánszemély
                            </label>
                            <label className={szamlazasiTipus === 'ceg' ? 'aktiv' : ''}>
                                <input type="radio" name="szamlazasiTipus" value="ceg" checked={szamlazasiTipus === 'ceg'} onChange={(event) => setSzamlazasiTipus(event.target.value)} />
                                Cég / jogi személy
                            </label>
                        </div>
                        <label className="vasarlas-nev-mezo">
                            {szamlazasiTipus === 'ceg' ? 'Cég neve *' : 'Számlázási név *'}
                            <input type="text" autoComplete="billing name" minLength="2" maxLength="120" value={szamlazasiNev} onChange={(event) => setSzamlazasiNev(event.target.value)} placeholder={szamlazasiTipus === 'ceg' ? 'Cég teljes neve' : 'Számlán szereplő teljes név'} required />
                        </label>
                        {szamlazasiTipus === 'ceg' && (
                            <label className="vasarlas-adoszam-mezo">
                                Adószám *
                                <input type="text" autoComplete="off" maxLength="32" value={adoszam} onChange={(event) => setAdoszam(event.target.value)} placeholder="12345678-1-12" required />
                            </label>
                        )}
                        <CimMezok
                            tipus="szamlazas"
                            cim={szamlazasiAdatok}
                            frissit={(mezo, ertek) => cimFrissit(setSzamlazasiAdatok, mezo, ertek)}
                        />
                        <label className="vasarlas-megjegyzes-mezo">
                            Megjegyzés az ügyfélszolgálatnak
                            <textarea rows="3" maxLength="500" value={szamlazasiMegjegyzes} onChange={(event) => setSzamlazasiMegjegyzes(event.target.value)} placeholder="Opcionális megjegyzés" />
                        </label>
                    </section>

                    {hiba && <p className="vasarlas-hiba" role="alert">{hiba}</p>}
                    <button className="vasarlas-fo-gomb vasarlas-leadas" type="submit" disabled={kuldes}>
                        {kuldes ? 'Rendelés rögzítése…' : 'Rendelés leadása'}
                        {!kuldes && <span aria-hidden="true">→</span>}
                    </button>
                    <p className="vasarlas-megjegyzes">A rendelés leadásával még nem történik online fizetés.</p>
                </form>

                <aside className="vasarlas-osszegzes">
                    <div className="vasarlas-osszegzes-fej">
                        <div><span className="vasarlas-felirat">ÖSSZESÍTÉS</span><h2>A kosarad</h2></div>
                        <Link to="/kosar">Módosítás</Link>
                    </div>
                    <ul className="vasarlas-tetelek">
                        {tetelek.map((tetel) => (
                            <li key={tetel.id}>
                                <span className="vasarlas-tetel-kep">
                                    {tetel.kep ? <img src={tetel.kep} alt="" /> : tetel.nev.charAt(0)}
                                    <small>{tetel.mennyiseg}</small>
                                </span>
                                <span className="vasarlas-tetel-adat"><strong>{tetel.nev}</strong><small>{tetel.mennyiseg} {tetel.egyseg || 'db'} × {forint(tetel.ar)}</small></span>
                                <strong className="vasarlas-tetel-ar">{forint(Math.round(tetel.ar * tetel.mennyiseg * 100) / 100)}</strong>
                            </li>
                        ))}
                    </ul>
                    <div className="vasarlas-vegosszeg"><span>Végösszeg</span><strong>{forint(vegosszeg)}</strong></div>
                    <p className="vasarlas-szallitas-info">A szállítási díjról és a teljesítésről a rendelés egyeztetésekor tájékoztatunk.</p>
                </aside>
            </div>
        </main>
    );
};

export default Vasarlas;
