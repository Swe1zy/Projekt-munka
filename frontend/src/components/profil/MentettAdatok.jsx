import { useState } from 'react';
import { apiKeres } from '../../utils/api';
import { useBeallitasok } from '../../utils/beallitasok';
import { ervenyesAdoszam } from '../../utils/fiok';
import { forint } from '../../utils/termek';
import CimMezok from './CimMezok';
import Uzenet from './Uzenet';
import { t } from '../../utils/nyelv';

const uresCim = () => ({ iranyitoszam: '', telepules: '', utca: '' });
const cimResz = (adat) => ({
    iranyitoszam: adat?.iranyitoszam ?? '',
    telepules: adat?.telepules ?? '',
    utca: adat?.utca ?? '',
});

// Céges számlázásnál jelzi, jár-e (és mekkora) mennyiségi kedvezmény az adószámmal.
const KedvezmenyJelzes = ({ adoszam }) => {
    const { adat: beallitasok } = useBeallitasok();
    const savok = beallitasok?.cegesKedvezmenySavok ?? [];
    if (!adoszam.trim()) return null;

    if (!ervenyesAdoszam(adoszam)) {
        return (
            <p className="profil-kedvezmeny profil-kedvezmeny--nem">
                {t('Ez az adószám nem a megszokott formátumú (12345678-1-12), ezért céges kedvezmény nem jár rá.')}
            </p>
        );
    }
    return (
        <p className="profil-kedvezmeny">
            <strong>✓ {t('Jogosult vagy céges mennyiségi kedvezményre.')}</strong>
            {savok.length > 0 && (
                <span> {t('{savok} a termékek árából.', { savok: savok.map((sav) => t('{osszeg} felett {szazalek}%', { osszeg: forint(sav.minimum), szazalek: sav.szazalek })).join(', ') })}</span>
            )}
        </p>
    );
};

// A pénztárat előtöltő számlázási adatok szerkesztése.
const MentettAdatok = ({ mentettAdatok, frissult }) => {
    const szamlazas = mentettAdatok?.szamlazas;
    const [tipus, setTipus] = useState(szamlazas?.tipus ?? 'maganszemely');
    const [nev, setNev] = useState(szamlazas?.nev ?? '');
    const [adoszam, setAdoszam] = useState(szamlazas?.adoszam ?? '');
    const [szamlazasiCim, setSzamlazasiCim] = useState(() => cimResz(szamlazas));
    const [uzenet, setUzenet] = useState(null);
    const [kuldes, setKuldes] = useState(false);

    const cimFrissit = (mezo, ertek) => setSzamlazasiCim((elozo) => ({ ...elozo, [mezo]: ertek }));

    const kuld = async (body, siker) => {
        setUzenet(null);
        setKuldes(true);
        try {
            const valasz = await apiKeres('/fiok/mentett-adatok', { method: 'PUT', body });
            frissult(valasz);
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
        kuld({ szamlazas: { tipus, nev, adoszam: tipus === 'ceg' ? adoszam : '', ...szamlazasiCim } });
    };

    const torol = () => {
        kuld({ szamlazas: null }, () => {
            setTipus('maganszemely');
            setNev('');
            setAdoszam('');
            setSzamlazasiCim(uresCim());
        });
    };

    return (
        <form
            className="profil-panel profil-urlap"
            onSubmit={bekuld}
        >
            <div className="profil-panel-fej">
                <h2>{t('Számlázási adatok')}</h2>
                <p>{t('A pénztár ezekkel az adatokkal tölti ki előre az űrlapot, rendeléskor még módosíthatod őket.')}</p>
            </div>

            <div
                className="profil-valaszto"
                role="radiogroup"
                aria-label={t('Számlázás típusa')}
            >
                <label className={tipus === 'maganszemely' ? 'aktiv' : undefined}>
                    <input
                        type="radio"
                        name="mentett-tipus"
                        value="maganszemely"
                        checked={tipus === 'maganszemely'}
                        onChange={(event) => setTipus(event.target.value)}
                    />
                    {t('Magánszemély')}
                </label>
                <label className={tipus === 'ceg' ? 'aktiv' : undefined}>
                    <input
                        type="radio"
                        name="mentett-tipus"
                        value="ceg"
                        checked={tipus === 'ceg'}
                        onChange={(event) => setTipus(event.target.value)}
                    />
                    {t('Cég / jogi személy')}
                </label>
            </div>

            <div className="profil-mezo-par">
                <label className="auth-mezo">
                    {tipus === 'ceg' ? t('Cég neve') : t('Számlázási név')}
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
                        {t('Adószám')}
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
            {tipus === 'ceg' && <KedvezmenyJelzes adoszam={adoszam} />}
            <CimMezok
                tipus="szamlazas"
                cim={szamlazasiCim}
                frissit={cimFrissit}
            />

            <Uzenet uzenet={uzenet} />

            <div className="profil-gombok">
                <button
                    type="submit"
                    className="auth-gomb"
                    disabled={kuldes}
                >
                    {kuldes ? t('Mentés…') : t('Számlázási adatok mentése')}
                </button>
                {mentettAdatok && (
                    <button
                        type="button"
                        className="profil-gomb profil-gomb-masodlagos"
                        disabled={kuldes}
                        onClick={torol}
                    >
                        {t('Mentett adatok törlése')}
                    </button>
                )}
            </div>
        </form>
    );
};

export default MentettAdatok;
