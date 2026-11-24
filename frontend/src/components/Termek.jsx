import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { egysegNev, forint, kategoriaNev, termekKepek } from '../utils/termek';
import { useBejelentkezesKell } from '../utils/useBejelentkezesKell';
import './Termek.css';
import { helyiBeallitas, t } from '../utils/nyelv';

const Termek = ({ termek }) => {
    const { tetelek, hozzaad } = useCart();
    const toast = useToast();
    const bejelentkezve = useBejelentkezesKell();
    const kepek = termekKepek(termek);
    const kosarban = tetelek.find((elem) => elem.id === termek._id)?.mennyiseg ?? 0;
    const egyseg = egysegNev(termek.egyseg || 'db');
    const keszletIsmert = Number.isFinite(termek.keszlet);
    const keszlet = keszletIsmert ? termek.keszlet : 999;
    const keszletSzoveg = keszletIsmert
        ? Number(termek.keszlet).toLocaleString(helyiBeallitas(), { maximumFractionDigits: 2 })
        : t('Nem ismert');
    const vanKeszleten = keszlet > 0;
    const hozzaadando = Math.min(1, keszlet);

    const kosarba = () => {
        if (!bejelentkezve()) return;
        hozzaad({ ...termek, kep: kepek[0] }, hozzaadando);
        toast.siker(t('{mennyiseg} {egyseg} „{nev}” a kosárba került.', { mennyiseg: hozzaadando, egyseg, nev: termek.nev }));
    };

    return (
        <article className="termek-kontener">
            <header className="termek-kartya-fejlec">
                {termek.kategoria && <span className="termek-kategoria">{kategoriaNev(termek.kategoria)}</span>}
                <h2>
                    {/* A link az egész kártyát lefedi, így bárhová kattintva megnyílik a termék. */}
                    <Link className="termek-megnyitas" to={`/termekek/${termek._id}`}>
                        {termek.nev}
                    </Link>
                </h2>
            </header>
            <div className="termek-belso-kontener">
                {/* A listában csak a borítókép látszik; az összes kép a termékoldalon van. */}
                {kepek.length > 0 && (
                    <div className="kepek-kontener">
                        <img
                            src={kepek[0]}
                            alt={termek.nev}
                            loading="lazy"
                        />
                    </div>
                )}
                <div className="tartalom-kontener">
                    <h4>{t('Ár:')}</h4>
                    <p>{forint(termek.ar)} / {egyseg}</p>
                    <p className={`termek-keszlet ${!keszletIsmert ? 'termek-keszlet-ismeretlen' : vanKeszleten ? 'termek-keszleten' : 'termek-nincs-keszleten'}`}>
                        {!keszletIsmert ? t('Készlet:') : vanKeszleten ? t('Raktáron:') : t('Nincs raktáron:')}{' '}
                        <strong>{keszletSzoveg} {egyseg}</strong>
                    </p>
                    <h4>{t('Leírás:')}</h4>
                    <p>{termek.leiras}</p>
                </div>
            </div>
            <footer className="termek-kosar-lab">
                <button type="button" className="termek-kosarba-gomb" onClick={kosarba} disabled={keszlet < 0.01}>
                    {keszlet < 0.01 ? t('Elfogyott') : t('Kosárba ({mennyiseg} {egyseg})', { mennyiseg: hozzaadando, egyseg })}
                </button>
                {kosarban > 0 && (
                    <span className="termek-kosarban" aria-live="polite">
                        {t('A kosárban: {mennyiseg} {egyseg}', { mennyiseg: kosarban, egyseg })}
                    </span>
                )}
            </footer>
        </article>
    );
};

export default Termek;
