import { Link } from 'react-router-dom';
import { useLekeres } from '../../utils/api';
import { forint, szam, teljesIdopont } from '../../utils/dashboardFormazas';

const ALLAPOT_LEIRAS = {
    uj: 'Megkaptuk a kérésedet, hamarosan elkezdünk dolgozni rajta.',
    folyamatban: 'Kollégáink éppen az ajánlatodon dolgoznak.',
    megvalaszolva: 'Az ajánlatunkat elküldtük az alábbi e-mail-címre.',
    lezarva: 'Ezt az árajánlatkérést lezártuk.',
};

const Arajanlat = ({ ajanlat }) => (
    <article className="sajat-rendeles">
        <header className="sajat-rendeles-fej">
            <div>
                <strong>#{ajanlat.rovidAzonosito}</strong>
                <span>{teljesIdopont(ajanlat.datum)}</span>
            </div>
            <span className={`ajanlat-allapot ajanlat-allapot--${ajanlat.allapot}`}>{ajanlat.allapotCimke}</span>
        </header>

        <p className="ajanlat-leiras">{ALLAPOT_LEIRAS[ajanlat.allapot] ?? ''}</p>

        <div className="sajat-rendeles-osszeg">
            <span>
                {ajanlat.tetelek.length ? `${szam(ajanlat.tetelek.length)} tétel` : 'Szöveges kérés'}
                {ajanlat.cegnev ? ` · ${ajanlat.cegnev}` : ''}
                {` · ${ajanlat.email}`}
            </span>
            {ajanlat.listaOsszeg > 0 && (
                <strong>
                    {forint(ajanlat.listaOsszeg)} <small>listaáron</small>
                </strong>
            )}
        </div>

        <details className="sajat-rendeles-reszletek">
            <summary>A kérés részletei</summary>
            {ajanlat.tetelek.length > 0 && (
                <ul className="ajanlat-tetelek">
                    {ajanlat.tetelek.map((tetel) => (
                        <li key={tetel.termekId}>
                            <span>{tetel.nev}</span>
                            <span>{szam(tetel.mennyiseg)} {tetel.egyseg}</span>
                            <span>{forint(tetel.listaar * tetel.mennyiseg)}</span>
                        </li>
                    ))}
                </ul>
            )}
            {ajanlat.megjegyzes && <p className="ajanlat-megjegyzes">„{ajanlat.megjegyzes}”</p>}
            <p className="ajanlat-elerhetoseg">
                Kapcsolattartó: {ajanlat.nev}
                {ajanlat.telefon ? ` · ${ajanlat.telefon}` : ''}
                {ajanlat.iranyitoszam || ajanlat.telepules ? ` · ${ajanlat.iranyitoszam} ${ajanlat.telepules}` : ''}
            </p>
        </details>
    </article>
);

const Arajanlataim = () => {
    const { adat, hiba, betoltes } = useLekeres('/arajanlatok/sajat');

    return (
        <section
            className="profil-rendelesek"
            aria-labelledby="arajanlataim-cim"
            aria-busy={betoltes}
        >
            <div className="profil-rendelesek-fej">
                <h2 id="arajanlataim-cim">Árajánlataim</h2>
                <p>A bejelentkezve küldött árajánlatkéréseid és azok állapota.</p>
            </div>

            {hiba ? (
                <p
                    className="auth-uzenet auth-hiba"
                    role="alert"
                >
                    {hiba}
                </p>
            ) : !adat ? (
                <p className="profil-rendelesek-uzenet">Árajánlatkérések betöltése…</p>
            ) : adat.arajanlatok.length === 0 ? (
                <div className="profil-rendelesek-uzenet">
                    <p>Még nem kértél árajánlatot.</p>
                    <Link to="/arajanlat">Árajánlatot kérek</Link>
                </div>
            ) : (
                <>
                    <div className="profil-rendelesek-lista">
                        {adat.arajanlatok.map((ajanlat) => (
                            <Arajanlat
                                key={ajanlat.id}
                                ajanlat={ajanlat}
                            />
                        ))}
                    </div>
                    <Link
                        className="profil-sor-link"
                        to="/arajanlat"
                    >
                        Új árajánlatot kérek →
                    </Link>
                </>
            )}
        </section>
    );
};

export default Arajanlataim;
