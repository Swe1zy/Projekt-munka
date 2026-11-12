import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_URL } from '../config';
import { useCart } from '../context/CartContext';
import './FizetesEredmeny.css';

const StripeSikeres = () => {
    const [searchParams] = useSearchParams();
    const { urit } = useCart();
    const sessionId = searchParams.get('session_id');
    const [allapot, setAllapot] = useState({ betoltes: true, sikeres: false, uzenet: 'Ellenőrizzük a fizetés visszaigazolását…' });

    useEffect(() => {
        let aktiv = true;
        const ellenoriz = async () => {
            if (!sessionId) {
                setAllapot({ betoltes: false, sikeres: false, uzenet: 'Hiányzik a fizetési azonosító.' });
                return;
            }
            try {
                const response = await fetch(`${API_URL}/rendelesek/stripe-ellenorzes?session_id=${encodeURIComponent(sessionId)}`);
                const valasz = await response.json();
                if (!response.ok) throw new Error(valasz.msg || 'A fizetést még nem igazolta vissza a rendszer.');
                if (!aktiv) return;
                urit();
                setAllapot({ betoltes: false, sikeres: true, uzenet: 'A fizetés sikeresen megtörtént. A rendelés visszaigazolását e-mailben küldjük.' });
            } catch (error) {
                if (aktiv) setAllapot({ betoltes: false, sikeres: false, uzenet: error.message });
            }
        };
        ellenoriz();
        return () => { aktiv = false; };
    }, [sessionId, urit]);

    return (
        <main className="fizetes-eredmeny-oldal">
            <section className="fizetes-eredmeny-kartya" aria-live="polite">
                <span className={`fizetes-eredmeny-ikon ${allapot.sikeres ? 'sikeres' : allapot.betoltes ? 'folyamatban' : 'hiba'}`} aria-hidden="true">
                    {allapot.sikeres ? '✓' : allapot.betoltes ? '…' : '!' }
                </span>
                <span className="fizetes-eredmeny-felirat">ONLINE FIZETÉS</span>
                <h1>{allapot.betoltes ? 'Egy pillanat…' : allapot.sikeres ? 'Köszönjük a rendelést!' : 'A fizetés ellenőrzése sikertelen'}</h1>
                <p>{allapot.uzenet}</p>
                {allapot.sikeres ? (
                    <Link className="fizetes-eredmeny-gomb" to="/termekek">Vissza a termékekhez</Link>
                ) : (
                    <Link className="fizetes-eredmeny-gomb" to="/vasarlas">Vissza a vásárláshoz</Link>
                )}
            </section>
        </main>
    );
};

export default StripeSikeres;
