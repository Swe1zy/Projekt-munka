import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { apiKeres } from '../../utils/api';
import { napCimke } from '../../utils/beallitasok';
import { forint, ora, szam, teljesIdopont } from '../../utils/dashboardFormazas';
import { ujrarendelesElokeszites } from '../../utils/ujrarendeles';
import OsszesitoSorok from '../arazas/OsszesitoSorok';
import AllapotIdovonal from '../rendeles/AllapotIdovonal';
import AllapotJelveny from '../rendeles/AllapotJelveny';
import RendelesCimek from '../rendeles/RendelesCimek';
import TetelLista from '../rendeles/TetelLista';
import { atvetelModCimke, fizetesiAllapotCimke, rendelesAllapotCimke } from '../../utils/rendelesCimkek';
import { t } from '../../utils/nyelv';

const felsorolas = (nevek) => nevek.map((nev) => `„${nev}”`).join(', ');

/**
 * Egy saját rendelés kártyája a műveleteivel: félbehagyott bankkártyás fizetés
 * folytatása, újrarendelés, és – amíg a bolt nem kezdte el feldolgozni – lemondás.
 * `frissult` a szervertől kapott új állapotot írja be a listába, `ujratolt` az egész listát frissíti.
 */
const SajatRendeles = ({ rendeles, frissult, ujratolt }) => {
    const { hozzaad } = useCart();
    const { siker, hiba } = useToast();
    const navigate = useNavigate();
    const [folyamat, setFolyamat] = useState(null);
    const [lemondasMegerosites, setLemondasMegerosites] = useState(false);

    // Átutalásnál a beérkezést a bolt nem rögzíti a rendszerben, ezért csak a
    // bankkártyás rendelések fizetési állapotát mutatjuk.
    const fizetesJelzes = rendeles.fizetesiMod === 'stripe' ? rendeles.fizetesiAllapot : null;

    const ujrarendeles = async () => {
        setFolyamat('ujrarendeles');
        try {
            const { kosarba, kimaradt, kevesebb, arValtozott } = await ujrarendelesElokeszites(rendeles);
            for (const { termek, mennyiseg } of kosarba) hozzaad(termek, mennyiseg);

            if (kimaradt.length) hiba(t('Már nem rendelhető, ezért kimaradt: {nevek}.', { nevek: felsorolas(kimaradt) }));
            if (kevesebb.length) hiba(t('A készlet miatt kevesebb került a kosárba: {nevek}.', { nevek: felsorolas(kevesebb) }));
            if (kosarba.length === 0) return;

            siker(
                t('{db} tétel a kosárba került.', { db: kosarba.length })
                + (arValtozott ? ` ${t('{db} tétel ára változott a rendelés óta, a kosár a mai árakat mutatja.', { db: arValtozott })}` : ''),
            );
            navigate('/kosar');
        } catch (error) {
            hiba(error.message);
        } finally {
            setFolyamat(null);
        }
    };

    const fizetes = async () => {
        setFolyamat('fizetes');
        try {
            const valasz = await apiKeres(`/rendelesek/${rendeles.id}/fizetes`, { method: 'POST' });
            if (valasz.fizetesiUrl) {
                window.location.assign(valasz.fizetesiUrl);
                return;
            }
            siker(valasz.msg);
            ujratolt();
        } catch (error) {
            hiba(error.message);
            // Lejárt határidőnél a szerver lemondta a rendelést: az új állapotot mutatjuk.
            ujratolt();
        }
        setFolyamat(null);
    };

    const lemondas = async () => {
        setFolyamat('lemondas');
        try {
            const valasz = await apiKeres(`/rendelesek/${rendeles.id}/lemondas`, { method: 'POST' });
            frissult(valasz.rendeles);
            siker(valasz.msg);
        } catch (error) {
            hiba(error.message);
            ujratolt();
        } finally {
            setFolyamat(null);
            setLemondasMegerosites(false);
        }
    };

    return (
        <article className={`sajat-rendeles sajat-rendeles--${rendeles.allapot}`}>
            <header className="sajat-rendeles-fej">
                <div>
                    <strong>#{rendeles.rovidAzonosito}</strong>
                    <span>{teljesIdopont(rendeles.datum)}</span>
                </div>
                <AllapotJelveny
                    allapot={rendeles.allapot}
                    cimke={rendelesAllapotCimke(rendeles.allapot, rendeles.cimke)}
                />
            </header>

            <AllapotIdovonal rendeles={rendeles} />

            <div className="sajat-rendeles-osszeg">
                <span>
                    {t('{db} tétel', { db: szam(rendeles.tetelek.length) })} · {atvetelModCimke(rendeles.atvetelModja, rendeles.atvetelCimke)}
                    {rendeles.atvetelNapja ? ` · ${napCimke(rendeles.atvetelNapja)}` : ''}
                    {rendeles.raklapok > 0 ? ` · ${t('{db} raklap', { db: szam(rendeles.raklapok) })}` : ''}
                </span>
                <strong>{forint(rendeles.vegosszeg)}</strong>
            </div>

            {fizetesJelzes && (
                <p className={`sajat-rendeles-fizetes sajat-rendeles-fizetes--${fizetesJelzes}`}>
                    <strong>{fizetesiAllapotCimke(rendeles.fizetesiAllapot, rendeles.fizetesiAllapotCimke)}</strong>
                    {rendeles.fizetheto && rendeles.fizetesiHatarido && (
                        <span>
                            {' '}
                            – {t('{ido}-ig fizetheted ki, utána a rendelés törlődik, és a tételek felszabadulnak.', { ido: ora(rendeles.fizetesiHatarido) })}
                        </span>
                    )}
                    {fizetesJelzes === 'fizetes_lejart' && (
                        <span> – {t('a rendelést töröltük. Az „Újrarendelem” gombbal újra kosárba teheted a tételeket.')}</span>
                    )}
                </p>
            )}

            {lemondasMegerosites ? (
                <div
                    className="sajat-rendeles-megerosites"
                    role="group"
                    aria-label={t('Lemondás megerősítése')}
                >
                    <p>{t('Biztosan lemondod a(z) #{azonosito} rendelést? A lefoglalt tételek felszabadulnak.', { azonosito: rendeles.rovidAzonosito })}</p>
                    <div className="profil-gombok">
                        <button
                            type="button"
                            className="profil-gomb profil-gomb-veszely profil-gomb-veszely-teli"
                            disabled={folyamat !== null}
                            onClick={lemondas}
                        >
                            {folyamat === 'lemondas' ? t('Lemondás…') : t('Igen, lemondom')}
                        </button>
                        <button
                            type="button"
                            className="profil-gomb profil-gomb-masodlagos"
                            disabled={folyamat !== null}
                            onClick={() => setLemondasMegerosites(false)}
                        >
                            {t('Mégsem')}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="profil-gombok sajat-rendeles-muveletek">
                    {rendeles.fizetheto && (
                        <button
                            type="button"
                            className="profil-gomb profil-gomb-elsodleges"
                            disabled={folyamat !== null}
                            onClick={fizetes}
                        >
                            {folyamat === 'fizetes' ? t('Megnyitás…') : t('Fizetés most')}
                        </button>
                    )}
                    <button
                        type="button"
                        className="profil-gomb profil-gomb-masodlagos"
                        disabled={folyamat !== null}
                        onClick={ujrarendeles}
                    >
                        {folyamat === 'ujrarendeles' ? t('Kosárba tesszük…') : t('Újrarendelem')}
                    </button>
                    {rendeles.lemondhato && (
                        <button
                            type="button"
                            className="profil-gomb profil-gomb-veszely"
                            disabled={folyamat !== null}
                            onClick={() => setLemondasMegerosites(true)}
                        >
                            {t('Rendelés lemondása')}
                        </button>
                    )}
                </div>
            )}

            <details className="sajat-rendeles-reszletek">
                <summary>{t('Tételek és szállítási adatok')}</summary>
                <TetelLista
                    tetelek={rendeles.tetelek}
                    vegosszeg={rendeles.osszesites?.termekOsszeg ?? rendeles.vegosszeg}
                    osszegCimke={rendeles.osszesites ? t('Termékek összesen') : t('Végösszeg')}
                />
                {rendeles.osszesites && (
                    <div className="rendeles-osszesites sajat-rendeles-osszesites">
                        <OsszesitoSorok
                            osszesites={{ ...rendeles.osszesites, vegosszeg: rendeles.vegosszeg }}
                            atvetelModja={rendeles.atvetelModja}
                            visszajaroBetetdij={rendeles.visszajaroBetetdij}
                        />
                    </div>
                )}
                <div className="sajat-rendeles-cimek">
                    <RendelesCimek rendeles={rendeles} />
                </div>
                {rendeles.allapot === 'feldolgozasra_var' && rendeles.fizetesiAllapot === 'fizetve' && (
                    <p className="profil-megjegyzes">
                        {t('A már kifizetett rendelést a telephellyel egyeztetve tudod lemondani.')}
                    </p>
                )}
                <a
                    className="sajat-rendeles-pdf"
                    href={`${API_URL}/rendelesek/${rendeles.id}/dijbekero`}
                    target="_blank"
                    rel="noreferrer"
                >
                    {t('Díjbekérő letöltése (PDF)')} ↗
                </a>
            </details>
        </article>
    );
};

export default SajatRendeles;
