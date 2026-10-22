import { useEffect, useState } from 'react';
import './Termekek.css';
import Termek from '../components/Termek';
import { API_URL } from '../config';

const Termekek = () => {
    const [termekek, setTermekek] = useState([]);
    const [kereses, setKereses] = useState('');
    const [betoltes, setBetoltes] = useState(true);
    const [hiba, setHiba] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        const timeout = window.setTimeout(async () => {
            setBetoltes(true);
            setHiba('');

            try {
                const params = new URLSearchParams();
                if (kereses.trim()) params.set('q', kereses.trim());
                const query = params.toString();
                const response = await fetch(
                    `${API_URL}/frontend-termekek${query ? `?${query}` : ''}`,
                    { signal: controller.signal },
                );
                const valasz = await response.json();

                if (!response.ok) {
                    throw new Error(valasz.msg || 'A termékek betöltése nem sikerült.');
                }
                setTermekek(valasz.termekek);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    setHiba(error.message || 'A szerver nem érhető el. Próbáld újra később!');
                }
            } finally {
                if (!controller.signal.aborted) setBetoltes(false);
            }
        }, 180);

        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [kereses]);

    return (
        <div className="termekek-kontener">
            <h1>Termékek</h1>
            <div className="termek-kereso">
                <label htmlFor="termek-kereses">Termék keresése név vagy kategória alapján</label>
                <input
                    id="termek-kereses"
                    type="search"
                    value={kereses}
                    onChange={(event) => setKereses(event.target.value)}
                    placeholder="Kezdj el gépelni…"
                    autoComplete="off"
                />
            </div>
            {hiba && <p className="termek-keresesi-hiba" role="alert">{hiba}</p>}
            {betoltes && <p className="termek-keresesi-allapot" aria-live="polite">Keresés…</p>}
            {!betoltes && !hiba && termekek.length === 0 && (
                <p className="termek-keresesi-allapot">Nincs a keresésnek megfelelő termék.</p>
            )}
            <div id="termekek-kontener" aria-live="polite">
                {termekek.map((termek) => (
                    <Termek key={termek._id} termek={termek} />
                ))}
            </div>
        </div>
    );
};

export default Termekek;