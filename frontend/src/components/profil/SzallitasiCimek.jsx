import { useState } from 'react';
import { apiKeres } from '../../utils/api';
import { cimSor, szallitasiCimMezok, uresSzallitasiCim } from '../../utils/fiok';
import CimMezok from './CimMezok';
import Uzenet from './Uzenet';
import { t } from '../../utils/nyelv';

const MAX_CIM = 10;

// Egy cím szerkesztő űrlapja (új cím vagy meglévő módosítása).
const CimUrlap = ({ kezdo, alapLehet, mentes, megse, kuldes }) => {
    const [cim, setCim] = useState(kezdo);
    const [alapertelmezett, setAlapertelmezett] = useState(false);
    const frissit = (mezo, ertek) => setCim((elozo) => ({ ...elozo, [mezo]: ertek }));

    return (
        <form
            className="profil-cim-urlap"
            onSubmit={(event) => {
                event.preventDefault();
                mentes({ ...cim, alapertelmezett });
            }}
        >
            <div className="profil-mezo-par">
                <label className="auth-mezo">
                    {t('Megnevezés')}
                    <input
                        type="text"
                        maxLength="60"
                        value={cim.megnevezes}
                        onChange={(event) => frissit('megnevezes', event.target.value)}
                        placeholder={t('pl. Családi ház – Göd')}
                    />
                    <small>{t('Üresen hagyva a cím lesz a neve.')}</small>
                </label>
                <label className="auth-mezo">
                    {t('Átvevő neve')}
                    <input
                        type="text"
                        autoComplete="shipping name"
                        minLength="2"
                        maxLength="120"
                        value={cim.atvevoNev}
                        onChange={(event) => frissit('atvevoNev', event.target.value)}
                        required
                    />
                </label>
            </div>
            <CimMezok
                tipus="szallitas"
                cim={cim}
                frissit={frissit}
            />
            <label className="auth-mezo">
                {t('Behajtás, lerakodás')}
                <textarea
                    rows="2"
                    maxLength="300"
                    value={cim.behajtas}
                    onChange={(event) => frissit('behajtas', event.target.value)}
                    placeholder={t('pl. 7,5 t-s súlykorlátozás, 3 m széles kapu, a raklapokat az udvarra kérjük')}
                />
                <small>{t('A teherautó és a darus kiszállítás tervezéséhez (nem kötelező).')}</small>
            </label>
            <label className="auth-mezo">
                {t('Megjegyzés a futárnak')}
                <textarea
                    rows="2"
                    maxLength="500"
                    value={cim.megjegyzes}
                    onChange={(event) => frissit('megjegyzes', event.target.value)}
                    placeholder={t('Kapucsengő, emelet vagy egyéb hasznos információ (nem kötelező)')}
                />
            </label>
            {alapLehet && (
                <label className="auth-jelolo">
                    <input
                        type="checkbox"
                        checked={alapertelmezett}
                        onChange={(event) => setAlapertelmezett(event.target.checked)}
                    />
                    <span>{t('Ez legyen az alapértelmezett szállítási cím')}</span>
                </label>
            )}
            <div className="profil-gombok">
                <button
                    type="submit"
                    className="profil-gomb profil-gomb-elsodleges"
                    disabled={kuldes}
                >
                    {kuldes ? t('Mentés…') : t('Cím mentése')}
                </button>
                <button
                    type="button"
                    className="profil-gomb profil-gomb-masodlagos"
                    disabled={kuldes}
                    onClick={megse}
                >
                    {t('Mégsem')}
                </button>
            </div>
        </form>
    );
};

/**
 * Címjegyzék: több elnevezett szállítási cím (pl. építkezések), amelyek közül
 * a pénztárban lehet választani. Az alapértelmezett cím töltődik ki elsőként.
 */
const SzallitasiCimek = ({ cimek, alapertelmezettCim, frissult }) => {
    // null: nincs nyitott űrlap, 'uj': új cím, különben a szerkesztett cím azonosítója.
    const [szerkesztett, setSzerkesztett] = useState(null);
    const [uzenet, setUzenet] = useState(null);
    const [kuldes, setKuldes] = useState(false);

    const kuld = async (utvonal, method, body) => {
        setUzenet(null);
        setKuldes(true);
        try {
            const valasz = await apiKeres(utvonal, { method, body });
            frissult(valasz);
            setSzerkesztett(null);
            setUzenet({ tipus: 'siker', szoveg: valasz.msg });
        } catch (error) {
            setUzenet({ tipus: 'hiba', szoveg: error.message });
        } finally {
            setKuldes(false);
        }
    };

    const torol = (cim) => {
        if (!window.confirm(t('Biztosan törlöd ezt a címet: {nev}?', { nev: cim.megnevezes }))) return;
        kuld(`/fiok/cimek/${cim.id}`, 'DELETE');
    };

    return (
        <section className="profil-panel profil-urlap">
            <div className="profil-panel-fej">
                <h2>{t('Szállítási címek')}</h2>
                <p>
                    {t('Mentsd el az építkezéseid, telephelyeid címét. A pénztárban egy kattintással választhatsz közülük, a behajtási információk pedig a rendeléssel együtt a sofőrhöz kerülnek.')}
                </p>
            </div>

            {cimek.length === 0 && szerkesztett !== 'uj' && (
                <p className="profil-megjegyzes">{t('Még nincs mentett szállítási címed.')}</p>
            )}

            {cimek.length > 0 && (
                <ul className="profil-cim-lista">
                    {cimek.map((cim) => {
                        const alap = String(cim.id) === String(alapertelmezettCim);
                        if (szerkesztett === cim.id) {
                            return (
                                <li key={cim.id} className="profil-cim-kartya profil-cim-kartya--szerkesztes">
                                    <CimUrlap
                                        kezdo={szallitasiCimMezok(cim)}
                                        alapLehet={!alap}
                                        kuldes={kuldes}
                                        megse={() => setSzerkesztett(null)}
                                        mentes={(adat) => kuld(`/fiok/cimek/${cim.id}`, 'PUT', adat)}
                                    />
                                </li>
                            );
                        }
                        return (
                            <li key={cim.id} className={`profil-cim-kartya${alap ? ' profil-cim-kartya--alap' : ''}`}>
                                <div className="profil-cim-kartya-fej">
                                    <strong>{cim.megnevezes}</strong>
                                    {alap && <span className="profil-cim-jelveny">{t('Alapértelmezett')}</span>}
                                </div>
                                <address>
                                    <span>{cim.atvevoNev}</span>
                                    <span>{cimSor(cim)}</span>
                                    {cim.behajtas && <span><em>{t('Behajtás, lerakodás:')}</em> {cim.behajtas}</span>}
                                    {cim.megjegyzes && <span><em>{t('Futárnak:')}</em> {cim.megjegyzes}</span>}
                                </address>
                                <div className="profil-gombok">
                                    <button
                                        type="button"
                                        className="profil-gomb profil-gomb-masodlagos"
                                        disabled={kuldes || szerkesztett !== null}
                                        onClick={() => setSzerkesztett(cim.id)}
                                    >
                                        {t('Szerkesztés')}
                                    </button>
                                    {!alap && (
                                        <button
                                            type="button"
                                            className="profil-gomb profil-gomb-masodlagos"
                                            disabled={kuldes || szerkesztett !== null}
                                            onClick={() => kuld(`/fiok/cimek/${cim.id}`, 'PUT', { ...szallitasiCimMezok(cim), alapertelmezett: true })}
                                        >
                                            {t('Legyen alapértelmezett')}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="profil-gomb profil-gomb-veszely"
                                        disabled={kuldes || szerkesztett !== null}
                                        onClick={() => torol(cim)}
                                    >
                                        {t('Törlés')}
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {szerkesztett === 'uj' && (
                <div className="profil-cim-kartya profil-cim-kartya--szerkesztes">
                    <CimUrlap
                        kezdo={uresSzallitasiCim()}
                        alapLehet={cimek.length > 0}
                        kuldes={kuldes}
                        megse={() => setSzerkesztett(null)}
                        mentes={(adat) => kuld('/fiok/cimek', 'POST', adat)}
                    />
                </div>
            )}

            <Uzenet uzenet={uzenet} />

            {szerkesztett === null && (
                cimek.length < MAX_CIM ? (
                    <div className="profil-gombok">
                        <button
                            type="button"
                            className="auth-gomb"
                            disabled={kuldes}
                            onClick={() => { setUzenet(null); setSzerkesztett('uj'); }}
                        >
                            + {t('Új cím hozzáadása')}
                        </button>
                    </div>
                ) : (
                    <p className="profil-megjegyzes">{t('Legfeljebb {db} címet menthetsz; újhoz törölj egy régit.', { db: MAX_CIM })}</p>
                )
            )}
        </section>
    );
};

export default SzallitasiCimek;
