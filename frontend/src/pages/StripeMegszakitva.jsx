import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_URL } from '../config';
import './FizetesEredmeny.css';
import { t } from '../utils/nyelv';

const StripeMegszakitva = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [uzenet, setUzenet] = useState(() => t('Lezárjuk a fizetési munkamenetet…'));

    useEffect(() => {
        let aktiv = true;
        const lezar = async () => {
            if (!sessionId) {
                setUzenet(t('A fizetési folyamat megszakadt. A kosár tartalma megmaradt.'));
                return;
            }
            try {
                const response = await fetch(`${API_URL}/rendelesek/stripe-megszakit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: sessionId }),
                });
                const valasz = await response.json();
                if (!response.ok) throw new Error(valasz.msg || t('A munkamenetet nem sikerült lezárni.'));
                if (aktiv) setUzenet(valasz.msg);
            } catch (error) {
                if (aktiv) setUzenet(error.message);
            }
        };
        lezar();
        return () => { aktiv = false; };
    }, [sessionId]);

    return (
        <main className="fizetes-eredmeny-oldal">
            <section className="fizetes-eredmeny-kartya" aria-live="polite">
                <span className="fizetes-eredmeny-ikon hiba" aria-hidden="true">×</span>
                <span className="fizetes-eredmeny-felirat">{t('ONLINE FIZETÉS')}</span>
                <h1>{t('A fizetés megszakadt')}</h1>
                <p>{uzenet}</p>
                <Link className="fizetes-eredmeny-gomb" to="/kosar">{t('Vissza a kosárhoz')}</Link>
            </section>
        </main>
    );
};

export default StripeMegszakitva;
