import { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import OsszesitoSorok from '../components/arazas/OsszesitoSorok';
import Telephely from '../components/Telephely';
import { apiKeres, useLekeres } from '../utils/api';
import { napCimke, useBeallitasok } from '../utils/beallitasok';
import { TELEFON_MINTA, TELEFON_PELDA, cimSor } from '../utils/fiok';
import { useArfolyamAllapot } from '../utils/penznem';
import { egysegNev, forint } from '../utils/termek';
import { useOsszesito } from '../utils/useOsszesito';
import './Vasarlas.css';
import { helyiBeallitas, t } from '../utils/nyelv';

const cimResz = (adat) => ({
    iranyitoszam: adat?.iranyitoszam ?? '',
    telepules: adat?.telepules ?? '',
    utca: adat?.utca ?? '',
});

const CimMezok = ({ cim, frissit, tipus, letiltva = false }) => (
    <div className="vasarlas-cim-mezok">
        <label>
            {t('Irányítószám')} *
            <input autoComplete={tipus === 'szallitas' ? 'shipping postal-code' : 'billing postal-code'} inputMode="numeric" maxLength="10" value={cim.iranyitoszam} onChange={(event) => frissit('iranyitoszam', event.target.value)} placeholder="1234" required disabled={letiltva} />
        </label>
        <label>
            {t('Város')} *
            <input autoComplete={tipus === 'szallitas' ? 'shipping address-level2' : 'billing address-level2'} maxLength="100" value={cim.telepules} onChange={(event) => frissit('telepules', event.target.value)} placeholder={t('Település')} required disabled={letiltva} />
        </label>
        <label className="vasarlas-utca-mezo">
            {t('Utca / házszám / ajtó')} *
            <input autoComplete={tipus === 'szallitas' ? 'shipping street-address' : 'billing street-address'} maxLength="200" value={cim.utca} onChange={(event) => frissit('utca', event.target.value)} placeholder={t('Utca, házszám, emelet, ajtó')} required disabled={letiltva} />
        </label>
    </div>
);

// A pénztár űrlapja. Bejelentkezett vásárlónál a kezdőértékek a profil adataiból
// jönnek (`fiok`: telefon, számlázás, címjegyzék, kiszállítási beállítások), ezért
// csak azok betöltése után jelenik meg. Vendégnél `fiok` null.
const VasarlasUrlap = ({ user, fiok }) => {
    const { tetelek, vegosszeg, urit } = useCart();
    const mentettAdatok = fiok?.mentettAdatok ?? null;
    const mentettSzamlazas = mentettAdatok?.szamlazas;
    const mentettCimek = fiok?.szallitasiCimek ?? [];
    const alapCim = mentettCimek.find((cim) => cim.id === fiok?.alapertelmezettCim) ?? mentettCimek[0];
    const [email, setEmail] = useState(user?.email ?? '');
    const [telefon, setTelefon] = useState(fiok?.telefon ?? '');
    const [atvetelModja, setAtvetelModja] = useState('hazhozszallitas');
    // A szállítási cím forrása: 'szamlazasi' (a számlázási cím), 'uj' vagy egy mentett cím azonosítója.
    const [cimValasztas, setCimValasztas] = useState(alapCim?.id ?? 'szamlazasi');
    const szallitasiEgyezik = cimValasztas === 'szamlazasi';
    const [szallitasiNev, setSzallitasiNev] = useState(alapCim?.atvevoNev ?? '');
    const [szallitasiAdatok, setSzallitasiAdatok] = useState(() => cimResz(alapCim));
    const [futarnakMegjegyzes, setFutarnakMegjegyzes] = useState(alapCim?.megjegyzes ?? '');
    const [behajtas, setBehajtas] = useState(alapCim?.behajtas ?? '');
    const [szamlazasiTipus, setSzamlazasiTipus] = useState(mentettSzamlazas?.tipus ?? 'maganszemely');
    const [szamlazasiNev, setSzamlazasiNev] = useState(mentettSzamlazas?.nev ?? '');
    const [adoszam, setAdoszam] = useState(mentettSzamlazas?.adoszam ?? '');
    const [szamlazasiAdatok, setSzamlazasiAdatok] = useState(() => cimResz(mentettSzamlazas));
    const [szamlazasiMegjegyzes, setSzamlazasiMegjegyzes] = useState('');
    const [adatokMentese, setAdatokMentese] = useState(false);
    const [kuldes, setKuldes] = useState(false);
    const [hiba, setHiba] = useState('');
    const [fizetesiMod, setFizetesiMod] = useState('atutalas');
    const [rendelesAzonosito, setRendelesAzonosito] = useState('');
    const [napValasztas, setNapValasztas] = useState('');
    const [idosav, setIdosav] = useState(fiok?.szallitasiBeallitasok?.idosav || 'delelott');
    const [darus, setDarus] = useState(Boolean(fiok?.szallitasiBeallitasok?.darus));
    const { adat: beallitasok, hiba: beallitasHiba } = useBeallitasok();
    const penznem = useArfolyamAllapot();

    const hazhoz = atvetelModja === 'hazhozszallitas';
    // A választható napok a backendről jönnek (szállítási/nyitvatartási nap, ünnepek, határidő).
    const napok = beallitasok?.valaszthatoNapok?.[atvetelModja] ?? [];
    const atvetelNapja = napok.some((nap) => nap.datum === napValasztas) ? napValasztas : napok[0]?.datum ?? '';
    const szallitasiIrsz = (szallitasiEgyezik ? szamlazasiAdatok : szallitasiAdatok).iranyitoszam.trim();
    const ervenyesIrsz = /^\d{4}$/.test(szallitasiIrsz);

    const elonezet = useOsszesito(tetelek.length ? {
        tetelek: tetelek.map((tetel) => ({ termekId: tetel.id, mennyiseg: tetel.mennyiseg })),
        atvetelModja,
        iranyitoszam: hazhoz ? szallitasiIrsz : '',
        darus: hazhoz && darus,
        szamlazasiTipus,
        adoszam: szamlazasiTipus === 'ceg' ? adoszam.trim() : '',
    } : null);
    const osszesites = elonezet.osszesites;
    const minimumHiany = hazhoz ? osszesites?.minimumHiany ?? 0 : 0;

    const cimFrissit = (frissito, mezo, ertek) => {
        frissito((elozo) => ({ ...elozo, [mezo]: ertek }));
    };

    // Mentett cím választásakor az adatai kerülnek a (továbbra is szerkeszthető) mezőkbe.
    const cimValasztasa = (ertek) => {
        setCimValasztas(ertek);
        if (ertek === 'szamlazasi') return;
        const cim = mentettCimek.find((elem) => elem.id === ertek);
        setSzallitasiNev(cim?.atvevoNev ?? '');
        setSzallitasiAdatok(cimResz(cim));
        setFutarnakMegjegyzes(cim?.megjegyzes ?? '');
        setBehajtas(cim?.behajtas ?? '');
    };

    // A rendelés már rögzült: ha a profil frissítése nem sikerül, attól még nem hiúsul meg.
    const profilFrissitese = async () => {
        const szallitas = { atvevoNev: szallitasiNev, ...szallitasiAdatok, megjegyzes: futarnakMegjegyzes, behajtas };
        const valasztottCim = mentettCimek.find((cim) => cim.id === cimValasztas);
        const cimValtozott = valasztottCim && Object.entries(szallitas).some(([mezo, ertek]) => (valasztottCim[mezo] ?? '') !== ertek);
        const keresek = [
            apiKeres('/fiok/mentett-adatok', {
                method: 'PUT',
                body: { szamlazas: { tipus: szamlazasiTipus, nev: szamlazasiNev, adoszam, ...szamlazasiAdatok } },
            }),
        ];
        if (telefon.trim() && telefon.trim() !== (fiok?.telefon ?? '')) {
            keresek.push(apiKeres('/fiok', { method: 'PATCH', body: { telefon } }));
        }
        if (hazhoz && cimValasztas === 'uj') {
            keresek.push(apiKeres('/fiok/cimek', { method: 'POST', body: szallitas }));
        } else if (hazhoz && cimValtozott) {
            keresek.push(apiKeres(`/fiok/cimek/${valasztottCim.id}`, {
                method: 'PUT',
                body: { ...szallitas, megnevezes: valasztottCim.megnevezes },
            }));
        }
        await Promise.allSettled(keresek);
    };

    const rendelesLead = async (event) => {
        event.preventDefault();
        setHiba('');
        setKuldes(true);
        try {
            const response = await fetch(`${API_URL}/rendelesek`, {
                method: 'POST',
                // A munkamenet-cookie alapján a rendelés a fiókhoz kötődik (Rendeléseim).
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    telefon,
                    teljesNev: szamlazasiNev,
                    atvetelModja,
                    szallitasiEgyezik,
                    szallitasiAdatok: atvetelModja === 'hazhozszallitas'
                        ? {
                            atvevoNev: szallitasiEgyezik ? szamlazasiNev : szallitasiNev,
                            ...(szallitasiEgyezik ? szamlazasiAdatok : szallitasiAdatok),
                            megjegyzes: futarnakMegjegyzes,
                            behajtas,
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
                    atvetelNapja,
                    idosav: hazhoz ? idosav : undefined,
                    darus: hazhoz && darus,
                    fizetesiMod,
                }),
            });
            const valasz = await response.json();
            if (!response.ok) throw new Error(valasz.msg || t('A rendelést nem sikerült rögzíteni.'));

            if (user && adatokMentese) await profilFrissitese();

            if (valasz.fizetesiUrl) {
                window.location.assign(valasz.fizetesiUrl);
                return;
            }

            setRendelesAzonosito(valasz.rendeles.id);
            urit();
        } catch (error) {
            setHiba(error.message || t('A szerver nem érhető el. Próbáld újra később!'));
        } finally {
            setKuldes(false);
        }
    };

    if (rendelesAzonosito) {
        return (
            <main className="vasarlas-oldal">
                <section className="vasarlas-siker" role="status">
                    <span className="vasarlas-siker-ikon" aria-hidden="true">✓</span>
                    <span className="vasarlas-felirat">{t('RENDELÉS RÖGZÍTVE')}</span>
                    <h1>{t('Köszönjük a rendelésed!')}</h1>
                    <p>{t('A rendelésedet megkaptuk. Őrizd meg az azonosítót, ügyintézésnél hasznos lehet.')}</p>
                    <div className="vasarlas-azonosito">{t('Rendelésazonosító')} <strong>{rendelesAzonosito}</strong></div>
                    <p>{t('A visszaigazolást és a díjbekérőt elküldtük a(z) {email} címre.', { email: <strong>{email}</strong> })}</p>
                    {user && (
                        <a className="vasarlas-masodlagos-link" href={`${API_URL}/rendelesek/${rendelesAzonosito}/dijbekero`} target="_blank" rel="noreferrer">
                            {t('Díjbekérő letöltése (PDF)')} ↗
                        </a>
                    )}
                    {user ? (
                        <Link className="vasarlas-fo-gomb" to="/profil#rendeleseim">{t('Rendelés követése')}</Link>
                    ) : (
                        <p>{t('Ha legközelebb bejelentkezve rendelsz, a profilodban követheted a rendelés állapotát.')}</p>
                    )}
                    <Link className={user ? 'vasarlas-masodlagos-link' : 'vasarlas-fo-gomb'} to="/termekek">{t('Vissza a termékekhez')}</Link>
                </section>
            </main>
        );
    }

    if (tetelek.length === 0) {
        return (
            <main className="vasarlas-oldal">
                <section className="vasarlas-ures">
                    <span className="vasarlas-felirat">{t('VÁSÁRLÁS')}</span>
                    <h1>{t('Most üres a kosarad')}</h1>
                    <p>{t('Tegyél néhány terméket a kosárba, utána itt kényelmesen leadhatod a rendelést.')}</p>
                    <Link className="vasarlas-fo-gomb" to="/termekek">{t('Termékek megtekintése')}</Link>
                </section>
            </main>
        );
    }

    return (
        <main className="vasarlas-oldal">
            <header className="vasarlas-fejlec">
                <Link className="vasarlas-vissza" to="/kosar">← {t('Vissza a kosárhoz')}</Link>
                <span className="vasarlas-felirat">{t('BIZTONSÁGOS RENDELÉSLEADÁS')}</span>
                <h1>{t('Fejezd be a vásárlást')}</h1>
                <p>{t('Add meg az elérhetőségedet, a szállítási és számlázási adatokat, majd válaszd ki az átvételt.')}</p>
            </header>

            <div className="vasarlas-elrendezes">
                <form className="vasarlas-urlap" onSubmit={rendelesLead}>
                    <section className="vasarlas-kartya">
                        <div className="vasarlas-szekcio-fej">
                            <span>01</span>
                            <div><h2>{t('Kapcsolattartás')}</h2><p>{t('A rendelés egyeztetéséhez szükséges.')}</p></div>
                        </div>
                        <div className="vasarlas-mezok">
                            <label>
                                {t('E-mail-cím')}
                                <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nev@email.hu" required />
                            </label>
                            <label>
                                {t('Telefonszám')}{hazhoz ? ' *' : ''}
                                <input type="tel" autoComplete="tel" pattern={TELEFON_MINTA} title={t('Pl. {pelda}', { pelda: TELEFON_PELDA })} maxLength="40" value={telefon} onChange={(event) => setTelefon(event.target.value)} placeholder={TELEFON_PELDA} required={hazhoz} />
                                {hazhoz && <small className="vasarlas-segitseg">{t('Kiszállítás előtt ezen a számon keres a sofőr.')}</small>}
                            </label>
                        </div>
                    </section>

                    <section className="vasarlas-kartya">
                        <div className="vasarlas-szekcio-fej">
                            <span>02</span>
                            <div><h2>{t('Szállítás')}</h2><p>{t('* a megjelölt mezők kitöltése kötelező')}</p></div>
                        </div>
                        <div className="vasarlas-atvetel-valaszto">
                            <label className={`vasarlas-atvetel-kartya ${atvetelModja === 'hazhozszallitas' ? 'aktiv' : ''}`}>
                                <input type="radio" name="atvetelModja" value="hazhozszallitas" checked={atvetelModja === 'hazhozszallitas'} onChange={(event) => setAtvetelModja(event.target.value)} />
                                <span className="vasarlas-atvetel-ikon" aria-hidden="true">⌂</span>
                                <span><strong>{t('Házhoz szállítás')}</strong><small>{t('Kérjük, add meg a pontos címet.')}</small></span>
                            </label>
                            <label className={`vasarlas-atvetel-kartya ${atvetelModja === 'szemelyes_atvetel' ? 'aktiv' : ''}`}>
                                <input type="radio" name="atvetelModja" value="szemelyes_atvetel" checked={atvetelModja === 'szemelyes_atvetel'} onChange={(event) => setAtvetelModja(event.target.value)} />
                                <span className="vasarlas-atvetel-ikon" aria-hidden="true">⌖</span>
                                <span><strong>{t('Személyes átvétel')}</strong><small>{t('Átvétel a Tüzép telephelyén.')}</small></span>
                            </label>
                        </div>
                        {atvetelModja === 'hazhozszallitas' && (
                            <div className="vasarlas-cim-blokk">
                                {mentettCimek.length > 0 && (
                                    <label className="vasarlas-nev-mezo">
                                        {t('Szállítási cím')}
                                        <select value={cimValasztas} onChange={(event) => cimValasztasa(event.target.value)}>
                                            {mentettCimek.map((cim) => (
                                                <option key={cim.id} value={cim.id}>{cim.megnevezes} – {cimSor(cim)}</option>
                                            ))}
                                            <option value="szamlazasi">{t('A számlázási címre')}</option>
                                            <option value="uj">{t('Új cím megadása')}</option>
                                        </select>
                                    </label>
                                )}
                                <label className="vasarlas-nev-mezo">
                                    {t('Átvevő neve')} *
                                    <input type="text" autoComplete="shipping name" minLength="2" maxLength="120" value={szallitasiEgyezik ? szamlazasiNev : szallitasiNev} onChange={(event) => setSzallitasiNev(event.target.value)} placeholder={t('Átvevő teljes neve')} required disabled={szallitasiEgyezik} />
                                </label>
                                <CimMezok
                                    tipus="szallitas"
                                    cim={szallitasiEgyezik ? szamlazasiAdatok : szallitasiAdatok}
                                    frissit={(mezo, ertek) => cimFrissit(szallitasiEgyezik ? setSzamlazasiAdatok : setSzallitasiAdatok, mezo, ertek)}
                                    letiltva={szallitasiEgyezik}
                                />
                                {mentettCimek.length === 0 && (
                                    <label className="vasarlas-egyezik-jelolo">
                                        <input type="checkbox" checked={szallitasiEgyezik} onChange={(event) => cimValasztasa(event.target.checked ? 'szamlazasi' : 'uj')} />
                                        <span>{t('A szállítási adatok megegyeznek a számlázási adatokkal')}</span>
                                    </label>
                                )}
                                <label className="vasarlas-megjegyzes-mezo">
                                    {t('Behajtás, lerakodás')}
                                    <textarea rows="2" maxLength="300" value={behajtas} onChange={(event) => setBehajtas(event.target.value)} placeholder={t('pl. 7,5 t-s súlykorlátozás, 3 m széles kapu, a raklapokat az udvarra kérjük (nem kötelező)')} />
                                </label>
                                <label className="vasarlas-megjegyzes-mezo">
                                    {t('Megjegyzés a futárnak')}
                                    <textarea rows="3" maxLength="500" value={futarnakMegjegyzes} onChange={(event) => setFutarnakMegjegyzes(event.target.value)} placeholder={t('Kapucsengő, behajtás vagy egyéb hasznos információ (nem kötelező)')} />
                                </label>
                            </div>
                        )}
                        {beallitasHiba && <p className="vasarlas-hiba" role="alert">{beallitasHiba}</p>}
                        {beallitasok && (
                            <div className="vasarlas-idopont">
                                <label className="vasarlas-nap-mezo">
                                    {hazhoz ? t('Kiszállítás napja') : t('Átvétel napja')} *
                                    <select value={atvetelNapja} onChange={(event) => setNapValasztas(event.target.value)} required>
                                        {napok.map((nap) => (
                                            <option key={nap.datum} value={nap.datum}>{napCimke(nap.datum)}</option>
                                        ))}
                                    </select>
                                </label>
                                {hazhoz && (
                                    <fieldset className="vasarlas-idosav">
                                        <legend>{t('Idősáv')} *</legend>
                                        {beallitasok.kiszallitas.idosavok.map((sav) => (
                                            <label key={sav.kulcs} className={idosav === sav.kulcs ? 'aktiv' : ''}>
                                                <input type="radio" name="idosav" value={sav.kulcs} checked={idosav === sav.kulcs} onChange={(event) => setIdosav(event.target.value)} />
                                                {sav.cimke}
                                            </label>
                                        ))}
                                    </fieldset>
                                )}
                                <p className="vasarlas-segitseg">
                                    {hazhoz
                                        ? t('{ora} óráig leadott rendelésnél már a következő szállítási nap is választható.', { ora: beallitasok.kiszallitas.rendelesiHataridoOra })
                                        : t('{ora} óráig leadott rendelésnél már a következő nyitvatartási nap is választható.', { ora: beallitasok.kiszallitas.rendelesiHataridoOra })}
                                </p>
                            </div>
                        )}
                        {beallitasok && hazhoz && (
                            <label className="vasarlas-darus">
                                <input type="checkbox" checked={darus} onChange={(event) => setDarus(event.target.checked)} />
                                <span>
                                    <strong>{t('Darus lerakodás')}</strong>
                                    <small>{t('Raklapos, nehéz áruhoz ajánlott. +{dij} fordulónként.', { dij: forint(beallitasok.szallitas.darusPotdij) })}</small>
                                </span>
                            </label>
                        )}
                        {beallitasok && !hazhoz && (
                            <Telephely telephely={beallitasok.telephely} nyitvatartas={beallitasok.nyitvatartas} />
                        )}
                    </section>

                    <section className="vasarlas-kartya">
                        <div className="vasarlas-szekcio-fej">
                            <span>03</span>
                            <div><h2>{t('Számlázás')}</h2><p>{t('* a megjelölt mezők kitöltése kötelező')}</p></div>
                        </div>
                        <div className="vasarlas-szemely-tipus">
                            <label className={szamlazasiTipus === 'maganszemely' ? 'aktiv' : ''}>
                                <input type="radio" name="szamlazasiTipus" value="maganszemely" checked={szamlazasiTipus === 'maganszemely'} onChange={(event) => setSzamlazasiTipus(event.target.value)} />
                                {t('Magánszemély')}
                            </label>
                            <label className={szamlazasiTipus === 'ceg' ? 'aktiv' : ''}>
                                <input type="radio" name="szamlazasiTipus" value="ceg" checked={szamlazasiTipus === 'ceg'} onChange={(event) => setSzamlazasiTipus(event.target.value)} />
                                {t('Cég / jogi személy')}
                            </label>
                        </div>
                        <label className="vasarlas-nev-mezo">
                            {szamlazasiTipus === 'ceg' ? t('Cég neve') : t('Számlázási név')} *
                            <input type="text" autoComplete="billing name" minLength="2" maxLength="120" value={szamlazasiNev} onChange={(event) => setSzamlazasiNev(event.target.value)} placeholder={szamlazasiTipus === 'ceg' ? t('Cég teljes neve') : t('Számlán szereplő teljes név')} required />
                        </label>
                        {szamlazasiTipus === 'ceg' && (
                            <label className="vasarlas-adoszam-mezo">
                                {t('Adószám')} *
                                <input type="text" autoComplete="off" maxLength="32" value={adoszam} onChange={(event) => setAdoszam(event.target.value)} placeholder="12345678-1-12" required />
                                {beallitasok && (
                                    <small className="vasarlas-segitseg">
                                        {t('Érvényes adószámmal céges mennyiségi kedvezmény jár: {savok}.', {
                                            savok: beallitasok.cegesKedvezmenySavok
                                                .map((sav) => t('{osszeg} felett {szazalek}%', { osszeg: forint(sav.minimum), szazalek: sav.szazalek }))
                                                .join(', '),
                                        })}
                                    </small>
                                )}
                            </label>
                        )}
                        <CimMezok
                            tipus="szamlazas"
                            cim={szamlazasiAdatok}
                            frissit={(mezo, ertek) => cimFrissit(setSzamlazasiAdatok, mezo, ertek)}
                        />
                        <label className="vasarlas-megjegyzes-mezo">
                            {t('Megjegyzés az ügyfélszolgálatnak')}
                            <textarea rows="3" maxLength="500" value={szamlazasiMegjegyzes} onChange={(event) => setSzamlazasiMegjegyzes(event.target.value)} placeholder={t('Opcionális megjegyzés')} />
                        </label>
                        {user && (
                            <>
                                <label className="vasarlas-egyezik-jelolo">
                                    <input type="checkbox" checked={adatokMentese} onChange={(event) => setAdatokMentese(event.target.checked)} />
                                    <span>
                                        {mentettAdatok
                                            ? t('A profilom frissítése ezekkel az adatokkal (számlázás, telefonszám, szállítási cím)')
                                            : t('Adataim mentése a profilomba a következő rendeléshez (számlázás, telefonszám, szállítási cím)')}
                                    </span>
                                </label>
                                {mentettAdatok && (
                                    <p className="vasarlas-segitseg">
                                        {t('Az űrlapot a profilodban mentett adatokkal töltöttük ki.')} <Link to="/profil#adataim">{t('Mentett adatok kezelése')}</Link>
                                    </p>
                                )}
                            </>
                        )}
                    </section>

                    <section className="vasarlas-kartya">
                        <div className="vasarlas-szekcio-fej">
                            <span>04</span>
                            <div><h2>{t('Fizetési mód')}</h2><p>{t('Válaszd ki, hogyan szeretnéd rendezni a rendelést.')}</p></div>
                        </div>
                        <div className="vasarlas-szemely-tipus">
                            <label className={fizetesiMod === 'atutalas' ? 'aktiv' : ''}>
                                <input type="radio" name="fizetesiMod" value="atutalas" checked={fizetesiMod === 'atutalas'} onChange={(event) => setFizetesiMod(event.target.value)} />
                                {t('Banki átutalás / díjbekérő')}
                            </label>
                            <label className={fizetesiMod === 'stripe' ? 'aktiv' : ''}>
                                <input type="radio" name="fizetesiMod" value="stripe" checked={fizetesiMod === 'stripe'} onChange={(event) => setFizetesiMod(event.target.value)} />
                                {t('Bankkártya (Stripe)')}
                            </label>
                        </div>
                        <p className="vasarlas-segitseg">
                            {fizetesiMod === 'stripe'
                                ? t('A rendelés összegét a Stripe biztonságos fizetési oldalán tudod kifizetni.')
                                : t('A rendelés rögzítése után e-mailben küldjük a díjbekérőt.')}
                        </p>
                    </section>

                    {hiba && <p className="vasarlas-hiba" role="alert">{hiba}</p>}
                    <button className="vasarlas-fo-gomb vasarlas-leadas" type="submit" disabled={kuldes || !atvetelNapja || minimumHiany > 0 || elonezet.keszlethiany.length > 0}>
                        {kuldes ? t('Feldolgozás…') : fizetesiMod === 'stripe' ? t('Tovább a bankkártyás fizetéshez') : t('Rendelés leadása')}
                        {!kuldes && <span aria-hidden="true">→</span>}
                    </button>
                    <p className="vasarlas-megjegyzes">
                        {fizetesiMod === 'stripe'
                            ? t('A fizetési adataidat a Stripe kezeli; a kártyaadatok nem jutnak el az áruház szerverére.')
                            : t('A rendelés leadásával még nem történik online fizetés.')}
                    </p>
                </form>

                <aside className="vasarlas-osszegzes">
                    <div className="vasarlas-osszegzes-fej">
                        <div><span className="vasarlas-felirat">{t('ÖSSZESÍTÉS')}</span><h2>{t('A kosarad')}</h2></div>
                        <Link to="/kosar">{t('Módosítás')}</Link>
                    </div>
                    <ul className="vasarlas-tetelek">
                        {tetelek.map((tetel) => (
                            <li key={tetel.id}>
                                <span className="vasarlas-tetel-kep">
                                    {tetel.kep ? <img src={tetel.kep} alt="" /> : tetel.nev.charAt(0)}
                                    <small>{tetel.mennyiseg}</small>
                                </span>
                                <span className="vasarlas-tetel-adat"><strong>{tetel.nev}</strong><small>{tetel.mennyiseg} {egysegNev(tetel.egyseg || 'db')} × {forint(tetel.ar)}</small></span>
                                <strong className="vasarlas-tetel-ar">{forint(Math.round(tetel.ar * tetel.mennyiseg * 100) / 100)}</strong>
                            </li>
                        ))}
                    </ul>
                    {osszesites ? (
                        <div className={`vasarlas-osszesites${elonezet.betoltes ? ' vasarlas-osszesites--frissul' : ''}`} aria-live="polite">
                            <OsszesitoSorok
                                osszesites={osszesites}
                                atvetelModja={atvetelModja}
                                szallitasHelyett={hazhoz && !ervenyesIrsz ? t('add meg az irányítószámot') : undefined}
                                vegosszegCimke={osszesites.szallitasSzamolhato ? t('Fizetendő') : t('Fizetendő (szállítás nélkül)')}
                            />
                        </div>
                    ) : (
                        <div className="vasarlas-vegosszeg"><span>{t('Termékek')}</span><strong>{forint(vegosszeg)}</strong></div>
                    )}
                    {elonezet.hiba && <p className="vasarlas-figyelmeztetes" role="alert">{elonezet.hiba}</p>}
                    {minimumHiany > 0 && (
                        <p className="vasarlas-figyelmeztetes" role="alert">
                            {t('Házhozszállítás {minimum} termékérték felett kérhető. Még {hiany} hiányzik, vagy válaszd a személyes átvételt.', {
                                minimum: forint(osszesites.minimumRendelesiErtek),
                                hiany: forint(minimumHiany),
                            })}
                        </p>
                    )}
                    {elonezet.keszlethiany.map((hiany) => (
                        <p key={hiany.termekId} className="vasarlas-figyelmeztetes" role="alert">
                            {t('„{nev}”: készleten csak {keszlet} van, módosítsd a mennyiséget a kosárban.', { nev: hiany.nev, keszlet: hiany.keszlet })}
                        </p>
                    ))}
                    {osszesites?.arajanlatAjanlott && (
                        <div className="vasarlas-arajanlat">
                            <strong>{t('Nagy tétel?')}</strong>
                            <span>{t('Ekkora mennyiségre egyedi árajánlatot is adunk.')}</span>
                            <Link to="/arajanlat">{t('Árajánlatot kérek')} →</Link>
                        </div>
                    )}
                    {penznem.kod !== 'HUF' && (
                        <p className="vasarlas-szallitas-info">
                            {t('A {penznem} árak tájékoztató jellegűek.', { penznem: penznem.kod })}
                            {penznem.arfolyamok.datum ? ` ${t('(EKB-árfolyam, {datum})', { datum: penznem.arfolyamok.datum })}` : ''}{' '}
                            {t('A fizetés forintban történik: {osszeg}.', {
                                osszeg: <strong>{(osszesites?.vegosszeg ?? vegosszeg).toLocaleString(helyiBeallitas())} Ft</strong>,
                            })}
                        </p>
                    )}
                    <p className="vasarlas-szallitas-info">{t('A szállítási díjat a cím, a tömeg és a lerakodás módja alapján számoljuk.')}</p>
                </aside>
            </div>
        </main>
    );
};

const Vasarlas = () => {
    const { user, authReady } = useAuth();
    const fiok = useLekeres(authReady && user ? '/fiok' : null);

    // A munkamenet és a mentett adatok megérkezéséig várunk, hogy az űrlap már kitöltve jelenjen meg.
    // Ha a mentett adatok betöltése nem sikerül, a pénztár üres űrlappal ugyanúgy használható.
    if (!authReady || fiok.betoltes) {
        return (
            <main className="vasarlas-oldal">
                <section className="vasarlas-ures" aria-busy="true"><p>{t('Pénztár betöltése…')}</p></section>
            </main>
        );
    }

    return <VasarlasUrlap key={user?.id ?? 'vendeg'} user={user} fiok={fiok.adat} />;
};

export default Vasarlas;
