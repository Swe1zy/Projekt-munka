import { useState } from 'react';
import { apiKeres } from '../../utils/api';
import CimMezok from './CimMezok';
import Uzenet from './Uzenet';

const uresCim = () => ({ iranyitoszam: '', telepules: '', utca: '' });
const cimResz = (adat) => ({
    iranyitoszam: adat?.iranyitoszam ?? '',
    telepules: adat?.telepules ?? '',
    utca: adat?.utca ?? '',
});

// A pénztárat előtöltő számlázási és szállítási adatok szerkesztése.
const MentettAdatok = ({ mentettAdatok, mentve }) => {
    const szamlazas = mentettAdatok?.szamlazas;
    const szallitas = mentettAdatok?.szallitas;
    const [tipus, setTipus] = useState(szamlazas?.tipus ?? 'maganszemely');
    const [nev, setNev] = useState(szamlazas?.nev ?? '');
    const [adoszam, setAdoszam] = useState(szamlazas?.adoszam ?? '');
    const [szamlazasiCim, setSzamlazasiCim] = useState(() => cimResz(szamlazas));
    const [egyezik, setEgyezik] = useState(!szallitas);
    const [atvevoNev, setAtvevoNev] = useState(szallitas?.atvevoNev ?? '');
    const [szallitasiCim, setSzallitasiCim] = useState(() => cimResz(szallitas));
    const [megjegyzes, setMegjegyzes] = useState(szallitas?.megjegyzes ?? '');
    const [uzenet, setUzenet] = useState(null);
    const [kuldes, setKuldes] = useState(false);

    const cimFrissit = (frissito) => (mezo, ertek) => frissito((elozo) => ({ ...elozo, [mezo]: ertek }));

    const kuld = async (body, siker) => {
        setUzenet(null);
        setKuldes(true);
        try {
            const valasz = await apiKeres('/fiok/mentett-adatok', { method: 'PUT', body });
            mentve(valasz.mentettAdatok);
            siker?.();
            setUzenet({ tipus: 'siker', szoveg: valasz.msg });
        } catch (error) {
            setUzenet({ tipus: 'hiba', szoveg: error.message });
        } finally {
            setKuldes(false);
        }
    };

    const bekuld = (event) => {
        event.preventDefault();
        kuld({
            szamlazas: { tipus, nev, adoszam: tipus === 'ceg' ? adoszam : '', ...szamlazasiCim },
            szallitas: egyezik ? null : { atvevoNev, ...szallitasiCim, megjegyzes },
        });
    };

    const torol = () => {
        kuld({ szamlazas: null }, () => {
            setTipus('maganszemely');
            setNev('');
            setAdoszam('');
            setSzamlazasiCim(uresCim());
            setEgyezik(true);
            setAtvevoNev('');
            setSzallitasiCim(uresCim());
            setMegjegyzes('');
        });
    };

    return (
        <form
            className="profil-panel profil-urlap"
            onSubmit={bekuld}
        >
            <div className="profil-panel-fej">
                <h2>Számlázási és szállítási adatok</h2>
                <p>A pénztár ezekkel az adatokkal tölti ki előre az űrlapot, rendeléskor még módosíthatod őket.</p>
            </div>

            <fieldset className="profil-csoport">
                <legend>Számlázás</legend>
                <div
                    className="profil-valaszto"
                    role="radiogroup"
                    aria-label="Számlázás típusa"
                >
                    <label className={tipus === 'maganszemely' ? 'aktiv' : undefined}>
                        <input
                            type="radio"
                            name="mentett-tipus"
                            value="maganszemely"
                            checked={tipus === 'maganszemely'}
                            onChange={(event) => setTipus(event.target.value)}
                        />
                        Magánszemély
                    </label>
                    <label className={tipus === 'ceg' ? 'aktiv' : undefined}>
                        <input
                            type="radio"
                            name="mentett-tipus"
                            value="ceg"
                            checked={tipus === 'ceg'}
                            onChange={(event) => setTipus(event.target.value)}
                        />
                        Cég / jogi személy
                    </label>
                </div>

                <div className="profil-mezo-par">
                    <label className="auth-mezo">
                        {tipus === 'ceg' ? 'Cég neve' : 'Számlázási név'}
                        <input
                            type="text"
                            autoComplete="billing name"
                            minLength="2"
                            maxLength="120"
                            value={nev}
                            onChange={(event) => setNev(event.target.value)}
                            required
                        />
                    </label>
                    {tipus === 'ceg' && (
                        <label className="auth-mezo">
                            Adószám
                            <input
                                type="text"
                                autoComplete="off"
                                minLength="5"
                                maxLength="32"
                                value={adoszam}
                                onChange={(event) => setAdoszam(event.target.value)}
                                placeholder="12345678-1-12"
                                required
                            />
                        </label>
                    )}
                </div>
                <CimMezok
                    tipus="szamlazas"
                    cim={szamlazasiCim}
                    frissit={cimFrissit(setSzamlazasiCim)}
                />
            </fieldset>

            <fieldset className="profil-csoport">
                <legend>Szállítás</legend>
                <label className="auth-jelolo">
                    <input
                        type="checkbox"
                        checked={egyezik}
                        onChange={(event) => setEgyezik(event.target.checked)}
                    />
                    <span>A szállítási cím megegyezik a számlázási címmel</span>
                </label>

                {!egyezik && (
                    <>
                        <label className="auth-mezo">
                            Átvevő neve
                            <input
                                type="text"
                                autoComplete="shipping name"
                                minLength="2"
                                maxLength="120"
                                value={atvevoNev}
                                onChange={(event) => setAtvevoNev(event.target.value)}
                                required
                            />
                        </label>
                        <CimMezok
                            tipus="szallitas"
                            cim={szallitasiCim}
                            frissit={cimFrissit(setSzallitasiCim)}
                        />
                        <label className="auth-mezo">
                            Megjegyzés a futárnak
                            <textarea
                                rows="2"
                                maxLength="500"
                                value={megjegyzes}
                                onChange={(event) => setMegjegyzes(event.target.value)}
                                placeholder="Kapucsengő, behajtás vagy egyéb hasznos információ (nem kötelező)"
                            />
                        </label>
                    </>
                )}
            </fieldset>

            <Uzenet uzenet={uzenet} />

            <div className="profil-gombok">
                <button
                    type="submit"
                    className="auth-gomb"
                    disabled={kuldes}
                >
                    {kuldes ? 'Mentés…' : 'Adatok mentése'}
                </button>
                {mentettAdatok && (
                    <button
                        type="button"
                        className="profil-gomb profil-gomb-masodlagos"
                        disabled={kuldes}
                        onClick={torol}
                    >
                        Mentett adatok törlése
                    </button>
                )}
            </div>
        </form>
    );
};

export default MentettAdatok;
