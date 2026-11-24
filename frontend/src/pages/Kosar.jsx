import { Link } from 'react-router-dom';
import MennyisegValaszto from '../components/MennyisegValaszto';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import OsszesitoSorok from '../components/arazas/OsszesitoSorok';
import { useBeallitasok } from '../utils/beallitasok';
import { egysegNev, forint, kategoriaNev } from '../utils/termek';
import { useOsszesito } from '../utils/useOsszesito';
import './Kosar.css';
import { t } from '../utils/nyelv';

const Ikon = ({ children }) => (
    <svg
        className="kosar-ikon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        {children}
    </svg>
);

const Kosar = () => {
    const { tetelek, vegosszeg, mennyisegBeallit, torol, urit } = useCart();
    const toast = useToast();
    const { adat: beallitasok } = useBeallitasok();
    // Előnézet szállítás nélkül: a raklap-betétdíj és a végösszeg már itt látszik,
    // a szállítási díjat a pénztár számolja a cím alapján.
    const elonezet = useOsszesito(tetelek.length ? {
        tetelek: tetelek.map((tetel) => ({ termekId: tetel.id, mennyiseg: tetel.mennyiseg })),
        atvetelModja: 'szemelyes_atvetel',
    } : null);
    const osszesites = elonezet.osszesites;

    const tetelTorlese = (tetel) => {
        torol(tetel.id);
        toast.siker(t('„{nev}” törölve a kosárból.', { nev: tetel.nev }));
    };

    const kosarUritese = () => {
        urit();
        toast.siker(t('A kosár kiürült.'));
    };

    return (
        <div className="kosar-kontener">
            <header className="kosar-fejlec">
                <span className="kosar-felirat">{t('KOSÁR')}</span>
                <h1>{t('Kosarad')}</h1>
                {tetelek.length > 0 && (
                    <p>
                        {t('{db} féle termék van a kosaradban.', { db: tetelek.length })}
                    </p>
                )}
            </header>

            {tetelek.length === 0 ? (
                <section className="kosar-ures">
                    <Ikon>
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </Ikon>
                    <h2>{t('A kosarad üres')}</h2>
                    <p>{t('Válogass az építőanyagaink közül, és tedd kosárba, amire szükséged van.')}</p>
                    <Link className="kosar-gomb-elso" to="/termekek">
                        {t('Tovább a termékekhez')}
                    </Link>
                </section>
            ) : (
                <div className="kosar-elrendezes">
                    <ul className="kosar-lista" aria-label={t('Kosár tartalma')}>
                        {tetelek.map((tetel) => (
                            <li className="kosar-tetel" key={tetel.id}>
                                <div className="kosar-kep">
                                    {tetel.kep ? (
                                        <img src={tetel.kep} alt={tetel.nev} loading="lazy" />
                                    ) : (
                                        <span aria-hidden="true">{tetel.nev.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="kosar-adatok">
                                    {tetel.kategoria && (
                                        <span className="kosar-kategoria">{kategoriaNev(tetel.kategoria)}</span>
                                    )}
                                    <h2>
                                        <Link to={`/termekek/${tetel.id}`}>{tetel.nev}</Link>
                                    </h2>
                                    <p>{forint(tetel.ar)} / {egysegNev(tetel.egyseg || 'db')}</p>
                                </div>
                                <MennyisegValaszto
                                    className="kosar-mennyiseg"
                                    nev={tetel.nev}
                                    ertek={tetel.mennyiseg}
                                    egyseg={tetel.egyseg}
                                    beallit={(mennyiseg) => mennyisegBeallit(tetel.id, mennyiseg)}
                                    max={Number.isFinite(tetel.keszlet) ? tetel.keszlet : undefined}
                                />
                                <strong className="kosar-reszosszeg">
                                    {forint(Math.round(tetel.ar * tetel.mennyiseg * 100) / 100)}
                                </strong>
                                <button
                                    type="button"
                                    className="kosar-torles"
                                    aria-label={t('{nev} törlése a kosárból', { nev: tetel.nev })}
                                    onClick={() => tetelTorlese(tetel)}
                                >
                                    <Ikon>
                                        <path d="M3 6h18" />
                                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                        <path d="M10 11v6" />
                                        <path d="M14 11v6" />
                                    </Ikon>
                                    {t('Törlés')}
                                </button>
                            </li>
                        ))}
                    </ul>

                    <aside className="kosar-osszegzo" aria-label={t('Összegzés')}>
                        <h2>{t('Összegzés')}</h2>
                        {osszesites ? (
                            <div className={elonezet.betoltes ? 'kosar-arazas kosar-arazas--frissul' : 'kosar-arazas'}>
                                <OsszesitoSorok
                                    osszesites={{ ...osszesites, szallitas: null }}
                                    atvetelModja="hazhozszallitas"
                                    szallitasHelyett={t('a pénztárban, cím alapján')}
                                    vegosszegCimke={t('Összesen (szállítás nélkül)')}
                                />
                            </div>
                        ) : (
                            <dl>
                                <div>
                                    <dt>{t('Termékek')}</dt>
                                    <dd>{t('{db} féle termék', { db: tetelek.length })}</dd>
                                </div>
                                <div className="kosar-vegosszeg">
                                    <dt>{t('Végösszeg')}</dt>
                                    <dd>{forint(vegosszeg)}</dd>
                                </div>
                            </dl>
                        )}
                        {elonezet.keszlethiany.map((hiany) => (
                            <p key={hiany.termekId} className="kosar-figyelmeztetes" role="alert">
                                {t('„{nev}”: készleten csak {keszlet} van.', { nev: hiany.nev, keszlet: hiany.keszlet })}
                            </p>
                        ))}
                        {osszesites?.arajanlatAjanlott && (
                            <div className="kosar-arajanlat">
                                <strong>{t('Nagy tétel?')}</strong>
                                <span>{t('Ekkora mennyiségre egyedi árajánlatot is adunk.')}</span>
                                <Link to="/arajanlat">{t('Árajánlatot kérek')} →</Link>
                            </div>
                        )}
                        {beallitasok && (
                            <p className="kosar-ceges-info">
                                {t('Céges vásárlóként, érvényes adószámmal mennyiségi kedvezmény jár: {savok}.', {
                                    savok: beallitasok.cegesKedvezmenySavok
                                        .map((sav) => t('{osszeg} felett {szazalek}%', { osszeg: forint(sav.minimum), szazalek: sav.szazalek }))
                                        .join(', '),
                                })}
                            </p>
                        )}
                        <Link className="kosar-gomb-masodik" to="/termekek">
                            {t('Vásárlás folytatása')}
                        </Link>
                        <Link className="kosar-vasarlas" to="/vasarlas">{t('Vásárlás')}</Link>
                        <button type="button" className="kosar-uritese" onClick={kosarUritese}>
                            {t('Kosár ürítése')}
                        </button>
                    </aside>
                </div>
            )}
        </div>
    );
};

export default Kosar;
