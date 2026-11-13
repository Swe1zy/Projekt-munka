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

            if (kimaradt.length) hiba(`Már nem rendelhető, ezért kimaradt: ${felsorolas(kimaradt)}.`);
            if (kevesebb.length) hiba(`A készlet miatt kevesebb került a kosárba: ${felsorolas(kevesebb)}.`);
            if (kosarba.length === 0) return;

            siker(
                `${kosarba.length} tétel a kosárba került.${arValtozott ? ` ${arValtozott} tétel ára változott a rendelés óta, a kosár a mai árakat mutatja.` : ''}`,
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
                    cimke={rendeles.cimke}
                />
            </header>

            <AllapotIdovonal rendeles={rendeles} />

            <div className="sajat-rendeles-osszeg">
                <span>
                    {szam(rendeles.tetelek.length)} tétel · {rendeles.atvetelCimke}
                    {rendeles.atvetelNapja ? ` · ${napCimke(rendeles.atvetelNapja)}` : ''}
                    {rendeles.raklapok > 0 ? ` · ${szam(rendeles.raklapok)} raklap` : ''}
                </span>
                <strong>{forint(rendeles.vegosszeg)}</strong>
            </div>

            {fizetesJelzes && (
                <p className={`sajat-rendeles-fizetes sajat-rendeles-fizetes--${fizetesJelzes}`}>
                    <strong>{rendeles.fizetesiAllapotCimke}</strong>
                    {rendeles.fizetheto && rendeles.fizetesiHatarido && (
                        <span>
                            {' '}
                            – {ora(rendeles.fizetesiHatarido)}-ig fizetheted ki, utána a rendelés törlődik, és a
                            tételek felszabadulnak.
                        </span>
                    )}
                    {fizetesJelzes === 'fizetes_lejart' && (
                        <span> – a rendelést töröltük. Az „Újrarendelem” gombbal újra kosárba teheted a tételeket.</span>
                    )}
                </p>
            )}

            {lemondasMegerosites ? (
                <div
                    className="sajat-rendeles-megerosites"
                    role="group"
                    aria-label="Lemondás megerősítése"
                >
                    <p>Biztosan lemondod a(z) #{rendeles.rovidAzonosito} rendelést? A lefoglalt tételek felszabadulnak.</p>
                    <div className="profil-gombok">
                        <button
                            type="button"
                            className="profil-gomb profil-gomb-veszely profil-gomb-veszely-teli"
                            disabled={folyamat !== null}
                            onClick={lemondas}
                        >
                            {folyamat === 'lemondas' ? 'Lemondás…' : 'Igen, lemondom'}
                        </button>
                        <button
                            type="button"
                            className="profil-gomb profil-gomb-masodlagos"
                            disabled={folyamat !== null}
                            onClick={() => setLemondasMegerosites(false)}
                        >
                            Mégsem
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
                            {folyamat === 'fizetes' ? 'Megnyitás…' : 'Fizetés most'}
                        </button>
                    )}
                    <button
                        type="button"
                        className="profil-gomb profil-gomb-masodlagos"
                        disabled={folyamat !== null}
                        onClick={ujrarendeles}
                    >
                        {folyamat === 'ujrarendeles' ? 'Kosárba tesszük…' : 'Újrarendelem'}
                    </button>
                    {rendeles.lemondhato && (
                        <button
                            type="button"
                            className="profil-gomb profil-gomb-veszely"
                            disabled={folyamat !== null}
                            onClick={() => setLemondasMegerosites(true)}
                        >
                            Rendelés lemondása
                        </button>
                    )}
                </div>
            )}

            <details className="sajat-rendeles-reszletek">
                <summary>Tételek és szállítási adatok</summary>
                <TetelLista
                    tetelek={rendeles.tetelek}
                    vegosszeg={rendeles.osszesites?.termekOsszeg ?? rendeles.vegosszeg}
                    osszegCimke={rendeles.osszesites ? 'Termékek összesen' : 'Végösszeg'}
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
                        A már kifizetett rendelést a telephellyel egyeztetve tudod lemondani.
                    </p>
                )}
                <a
                    className="sajat-rendeles-pdf"
                    href={`${API_URL}/rendelesek/${rendeles.id}/dijbekero`}
                    target="_blank"
                    rel="noreferrer"
                >
                    Díjbekérő letöltése (PDF) ↗
                </a>
            </details>
        </article>
    );
};

export default SajatRendeles;
