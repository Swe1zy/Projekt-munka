import { Link } from 'react-router-dom';
import { useLekeres } from '../../utils/api';
import { forint, szam, teljesIdopont } from '../../utils/dashboardFormazas';
import { egysegNev } from '../../utils/termek';
import { t } from '../../utils/nyelv';

const allapotLeiras = () => ({
    uj: t('Megkaptuk a kérésedet, hamarosan elkezdünk dolgozni rajta.'),
    folyamatban: t('Kollégáink éppen az ajánlatodon dolgoznak.'),
    megvalaszolva: t('Az ajánlatunkat elküldtük az alábbi e-mail-címre.'),
    lezarva: t('Ezt az árajánlatkérést lezártuk.'),
});

// Az állapot felirata a felület nyelvén; ismeretlen állapotnál a backend magyar felirata marad.
const allapotCimke = (ajanlat) => ({
    uj: t('Új'),
    folyamatban: t('Folyamatban'),
    megvalaszolva: t('Megválaszolva'),
    lezarva: t('Lezárva'),
})[ajanlat.allapot] ?? ajanlat.allapotCimke;

const Arajanlat = ({ ajanlat }) => (
    <article className="sajat-rendeles">
        <header className="sajat-rendeles-fej">
            <div>
                <strong>#{ajanlat.rovidAzonosito}</strong>
                <span>{teljesIdopont(ajanlat.datum)}</span>
            </div>
            <span className={`ajanlat-allapot ajanlat-allapot--${ajanlat.allapot}`}>{allapotCimke(ajanlat)}</span>
        </header>

        <p className="ajanlat-leiras">{allapotLeiras()[ajanlat.allapot] ?? ''}</p>

        <div className="sajat-rendeles-osszeg">
            <span>
                {ajanlat.tetelek.length ? t('{db} tétel', { db: szam(ajanlat.tetelek.length) }) : t('Szöveges kérés')}
                {ajanlat.cegnev ? ` · ${ajanlat.cegnev}` : ''}
                {` · ${ajanlat.email}`}
            </span>
            {ajanlat.listaOsszeg > 0 && (
                <strong>
                    {forint(ajanlat.listaOsszeg)} <small>{t('listaáron')}</small>
                </strong>
            )}
        </div>

        <details className="sajat-rendeles-reszletek">
            <summary>{t('A kérés részletei')}</summary>
            {ajanlat.tetelek.length > 0 && (
                <ul className="ajanlat-tetelek">
                    {ajanlat.tetelek.map((tetel) => (
                        <li key={tetel.termekId}>
                            <span>{tetel.nev}</span>
                            <span>{szam(tetel.mennyiseg)} {egysegNev(tetel.egyseg)}</span>
                            <span>{forint(tetel.listaar * tetel.mennyiseg)}</span>
                        </li>
                    ))}
                </ul>
            )}
            {ajanlat.megjegyzes && <p className="ajanlat-megjegyzes">„{ajanlat.megjegyzes}”</p>}
            <p className="ajanlat-elerhetoseg">
                {t('Kapcsolattartó: {nev}', { nev: ajanlat.nev })}
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
                <h2 id="arajanlataim-cim">{t('Árajánlataim')}</h2>
                <p>{t('A bejelentkezve küldött árajánlatkéréseid és azok állapota.')}</p>
            </div>

            {hiba ? (
                <p
                    className="auth-uzenet auth-hiba"
                    role="alert"
                >
                    {hiba}
                </p>
            ) : !adat ? (
                <p className="profil-rendelesek-uzenet">{t('Árajánlatkérések betöltése…')}</p>
            ) : adat.arajanlatok.length === 0 ? (
                <div className="profil-rendelesek-uzenet">
                    <p>{t('Még nem kértél árajánlatot.')}</p>
                    <Link to="/arajanlat">{t('Árajánlatot kérek')}</Link>
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
                        {t('Új árajánlatot kérek')} →
                    </Link>
                </>
            )}
        </section>
    );
};

export default Arajanlataim;
