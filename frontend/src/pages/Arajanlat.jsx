import { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useBeallitasok } from '../utils/beallitasok';
import { forint, szam } from '../utils/dashboardFormazas';
import './Arajanlat.css';

const Arajanlat = () => {
    const { user } = useAuth();
    const { tetelek, vegosszeg } = useCart();
    const { adat: beallitasok } = useBeallitasok();
    const [urlap, setUrlap] = useState({
        // null = még nem írt bele, ilyenkor a fiók adata látszik
        nev: null,
        cegnev: '',
        adoszam: '',
        email: null,
        telefon: '',
        iranyitoszam: '',
        telepules: '',
        megjegyzes: '',
    });
    const [kosarCsatolas, setKosarCsatolas] = useState(true);
    const [kuldes, setKuldes] = useState(false);
    const [hiba, setHiba] = useState('');
    const [elkuldve, setElkuldve] = useState(null);

    // A bejelentkezett vásárló nevét és e-mail-címét felajánljuk, amíg ki nem tölti.
    const ertek = (mezo) => urlap[mezo] ?? (mezo === 'nev' ? user?.nev : user?.email) ?? '';
    const beallit = (mezo) => (event) => setUrlap((elozo) => ({ ...elozo, [mezo]: event.target.value }));
    const csatolt = kosarCsatolas && tetelek.length > 0;

    const bekuld = async (event) => {
        event.preventDefault();
        setHiba('');
        if (!csatolt && urlap.megjegyzes.trim().length < 10) {
            setHiba('Írd le néhány mondatban, mire kérsz ajánlatot, vagy csatold a kosarad tartalmát.');
            return;
        }
        setKuldes(true);
        try {
            const response = await fetch(`${API_URL}/arajanlatok`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...urlap,
                    nev: ertek('nev'),
                    email: ertek('email'),
                    tetelek: csatolt ? tetelek.map((tetel) => ({ termekId: tetel.id, mennyiseg: tetel.mennyiseg })) : [],
                }),
            });
            const valasz = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(valasz.msg || 'Az árajánlatkérést nem sikerült elküldeni.');
            setElkuldve(valasz.arajanlat);
        } catch (error) {
            setHiba(error.message || 'A szerver nem érhető el. Próbáld újra később!');
        } finally {
            setKuldes(false);
        }
    };

    if (elkuldve) {
        return (
            <main className="arajanlat-oldal">
                <section className="arajanlat-siker" role="status">
                    <span className="arajanlat-siker-ikon" aria-hidden="true">✓</span>
                    <h1>Megkaptuk az árajánlatkérésed</h1>
                    <p>Hamarosan jelentkezünk a megadott elérhetőségeiden. Az azonosító: <strong>#{elkuldve.rovidAzonosito}</strong></p>
                    <div className="arajanlat-gombok">
                        <Link className="arajanlat-gomb" to="/termekek">Vissza a termékekhez</Link>
                        {tetelek.length > 0 && <Link className="arajanlat-link" to="/kosar">A kosár megmaradt →</Link>}
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="arajanlat-oldal">
            <header className="arajanlat-fejlec">
                <span>EGYEDI ÁRAJÁNLAT</span>
                <h1>Kérjen árajánlatot</h1>
                <p>Nagyobb mennyiségre, építkezéshez vagy viszonteladóként egyedi árat és szállítási feltételeket adunk. Munkanapokon 24 órán belül válaszolunk.</p>
            </header>

            <div className="arajanlat-racs">
                <form className="arajanlat-kartya" onSubmit={bekuld}>
                    <h2>Elérhetőség</h2>
                    <div className="arajanlat-mezok">
                        <label>Név *<input value={ertek('nev')} onChange={beallit('nev')} autoComplete="name" maxLength={120} required /></label>
                        <label>E-mail-cím *<input type="email" value={ertek('email')} onChange={beallit('email')} autoComplete="email" required /></label>
                        <label>Telefonszám<input type="tel" value={urlap.telefon} onChange={beallit('telefon')} autoComplete="tel" placeholder="+36 30 123 4567" maxLength={40} /></label>
                        <label>Cégnév<input value={urlap.cegnev} onChange={beallit('cegnev')} autoComplete="organization" maxLength={160} /></label>
                        <label>Adószám<input value={urlap.adoszam} onChange={beallit('adoszam')} placeholder="12345678-1-12" maxLength={32} /></label>
                        <div className="arajanlat-cim">
                            <label>Irányítószám<input inputMode="numeric" value={urlap.iranyitoszam} onChange={beallit('iranyitoszam')} placeholder="1234" maxLength={4} /></label>
                            <label>Település<input value={urlap.telepules} onChange={beallit('telepules')} maxLength={100} /></label>
                        </div>
                    </div>

                    <h2>Mire kér ajánlatot?</h2>
                    {tetelek.length > 0 && (
                        <label className="arajanlat-jelolo">
                            <input type="checkbox" checked={kosarCsatolas} onChange={(event) => setKosarCsatolas(event.target.checked)} />
                            <span>A kosaram tartalmát ({szam(tetelek.length)} tétel) csatolom</span>
                        </label>
                    )}
                    <label className="arajanlat-megjegyzes">
                        Részletek {csatolt ? '' : '*'}
                        <textarea
                            rows="5"
                            maxLength={2000}
                            value={urlap.megjegyzes}
                            onChange={beallit('megjegyzes')}
                            placeholder="Pl. családi ház falazása, 180 m² Porotherm 30, szállítás Budaörsre márciusban, darus lerakodással."
                        />
                    </label>

                    {hiba && <p className="arajanlat-hiba" role="alert">{hiba}</p>}
                    <button type="submit" className="arajanlat-gomb" disabled={kuldes}>
                        {kuldes ? 'Küldés…' : 'Árajánlatkérés elküldése'}
                    </button>
                </form>

                <aside className="arajanlat-kartya arajanlat-oldalsav">
                    <h2>{csatolt ? 'Csatolt tételek' : 'Jó tudni'}</h2>
                    {csatolt ? (
                        <>
                            <ul className="arajanlat-tetelek">
                                {tetelek.map((tetel) => (
                                    <li key={tetel.id}>
                                        <span>{tetel.nev}</span>
                                        <strong>{szam(tetel.mennyiseg)} {tetel.egyseg}</strong>
                                    </li>
                                ))}
                            </ul>
                            <div className="arajanlat-osszeg">
                                <span>Listaáron</span>
                                <strong>{forint(vegosszeg)}</strong>
                            </div>
                            <p className="arajanlat-info">Árajánlatnál a készleten lévőnél nagyobb mennyiség is kérhető.</p>
                        </>
                    ) : (
                        <p className="arajanlat-info">Írd le, milyen munkához mennyi anyagra van szükséged. Ha nem tudod a pontos mennyiséget, használd a <Link to="/kalkulator">kalkulátort</Link>.</p>
                    )}
                    {beallitasok && (
                        <p className="arajanlat-info">
                            Webshopos céges kedvezményünk adószámmal: {beallitasok.cegesKedvezmenySavok
                                .map((sav) => `${forint(sav.minimum)} felett ${sav.szazalek}%`)
                                .join(', ')}. Ennél nagyobb tételre egyedi árat adunk.
                        </p>
                    )}
                </aside>
            </div>
        </main>
    );
};

export default Arajanlat;
