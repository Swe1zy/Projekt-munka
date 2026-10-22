import { useEffect, useState } from 'react';
import './Termekek.css';
import Termek from '../components/Termek';
import { API_URL } from '../config';

const KATEGORIAK = [
    'Falazóanyagok',
    'Cement és kötőanyagok',
    'Faanyagok',
    'Tetőfedés',
    'Hőszigetelés',
    'Szerszámok és kellékek',
];

const Termekek = () => {
    const [termekek, setTermekek] = useState([]);
    const [kereses, setKereses] = useState('');
    const [kivalasztottKategoriak, setKivalasztottKategoriak] = useState([]);
    const [minAr, setMinAr] = useState('');
    const [maxAr, setMaxAr] = useState('');
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
                kivalasztottKategoriak.forEach((kategoria) => params.append('kategoria', kategoria));
                if (minAr !== '') params.set('minAr', minAr);
                if (maxAr !== '') params.set('maxAr', maxAr);
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
    }, [kereses, kivalasztottKategoriak, minAr, maxAr]);

    const kategoriaValtas = (kategoria) => {
        setKivalasztottKategoriak((aktualis) =>
            aktualis.includes(kategoria)
                ? aktualis.filter((elem) => elem !== kategoria)
                : [...aktualis, kategoria],
        );
    };

    const szurokTorlese = () => {
        setKivalasztottKategoriak([]);
        setMinAr('');
        setMaxAr('');
    };

    return (
        <div className="termekek-kontener">
            <h1>Termékek</h1>
            <div className="termekek-elrendezes">
                <aside className="termek-szuro-oldalsav" aria-label="Termékek szűrése">
                    <div className="termek-szuro-fejlec">
                        <h2>Szűrők</h2>
                        {(kivalasztottKategoriak.length > 0 || minAr !== '' || maxAr !== '') && (
                            <span className="termek-szuro-aktiv">Aktív</span>
                        )}
                    </div>
                    <fieldset className="termek-szuro-kategoriak">
                        <legend>Kategóriák</legend>
                        {KATEGORIAK.map((kategoria) => (
                            <label className="termek-szuro-kategoria" key={kategoria}>
                                <input
                                    type="checkbox"
                                    checked={kivalasztottKategoriak.includes(kategoria)}
                                    onChange={() => kategoriaValtas(kategoria)}
                                />
                                <span>{kategoria}</span>
                            </label>
                        ))}
                    </fieldset>
                    <fieldset className="termek-ar-szuro">
                        <legend>Ártartomány (Ft)</legend>
                        <label>
                            Minimum ár
                            <input type="number" min="0" step="0.01" value={minAr} onChange={(event) => setMinAr(event.target.value)} placeholder="Nincs minimum" />
                        </label>
                        <label>
                            Maximum ár
                            <input type="number" min="0" step="0.01" value={maxAr} onChange={(event) => setMaxAr(event.target.value)} placeholder="Nincs maximum" />
                        </label>
                    </fieldset>
                    <button className="termek-szuro-torles" type="button" onClick={szurokTorlese}>Szűrők törlése</button>
                </aside>
                <main className="termekek-tartalom">
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
                </main>
            </div>
        </div>
    );
};

export default Termekek;