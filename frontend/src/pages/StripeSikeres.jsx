import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './FizetesEredmeny.css';
import { t } from '../utils/nyelv';

const StripeSikeres = () => {
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const { urit, rendeltTetelekTorlese } = useCart();
    const sessionId = searchParams.get('session_id');
    const [allapot, setAllapot] = useState({ betoltes: true, sikeres: false, uzenet: t('Ellenőrizzük a fizetés visszaigazolását…') });

    useEffect(() => {
        let aktiv = true;
        const ellenoriz = async () => {
            if (!sessionId) {
                setAllapot({ betoltes: false, sikeres: false, uzenet: t('Hiányzik a fizetési azonosító.') });
                return;
            }
            try {
                const response = await fetch(`${API_URL}/rendelesek/stripe-ellenorzes?session_id=${encodeURIComponent(sessionId)}`);
                const valasz = await response.json();
                if (!response.ok) throw new Error(valasz.msg || t('A fizetést még nem igazolta vissza a rendszer.'));
                if (!aktiv) return;
                // A profilból pótolt fizetésnél a kosárban már más is lehet, ezért csak
                // a most kifizetett rendelés tételeit vesszük ki belőle.
                if (Array.isArray(valasz.rendeles?.tetelek)) rendeltTetelekTorlese(valasz.rendeles.tetelek);
                else urit();
                setAllapot({ betoltes: false, sikeres: true, uzenet: t('A fizetés sikeresen megtörtént. A rendelés visszaigazolását e-mailben küldjük.') });
            } catch (error) {
                if (aktiv) setAllapot({ betoltes: false, sikeres: false, uzenet: error.message });
            }
        };
        ellenoriz();
        return () => { aktiv = false; };
    }, [sessionId, urit, rendeltTetelekTorlese]);

    return (
        <main className="fizetes-eredmeny-oldal">
            <section className="fizetes-eredmeny-kartya" aria-live="polite">
                <span className={`fizetes-eredmeny-ikon ${allapot.sikeres ? 'sikeres' : allapot.betoltes ? 'folyamatban' : 'hiba'}`} aria-hidden="true">
                    {allapot.sikeres ? '✓' : allapot.betoltes ? '…' : '!' }
                </span>
                <span className="fizetes-eredmeny-felirat">{t('ONLINE FIZETÉS')}</span>
                <h1>{allapot.betoltes ? t('Egy pillanat…') : allapot.sikeres ? t('Köszönjük a rendelést!') : t('A fizetés ellenőrzése sikertelen')}</h1>
                <p>{allapot.uzenet}</p>
                {allapot.sikeres ? (
                    <Link className="fizetes-eredmeny-gomb" to={user ? '/profil#rendeleseim' : '/termekek'}>
                        {user ? t('Rendelés követése') : t('Vissza a termékekhez')}
                    </Link>
                ) : (
                    <Link className="fizetes-eredmeny-gomb" to="/vasarlas">{t('Vissza a vásárláshoz')}</Link>
                )}
            </section>
        </main>
    );
};

export default StripeSikeres;
