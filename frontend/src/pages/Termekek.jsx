import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './Termekek.css';
import KategoriaValaszto from '../components/KategoriaValaszto';
import Termek from '../components/Termek';
import { API_URL } from '../config';
import { t } from '../utils/nyelv';

const KATEGORIAK = [
    'Falazóanyagok',
    'Cement és kötőanyagok',
    'Ömlesztett anyagok és betonok',
    'Faanyagok',
    'Tetőfedés',
    'Hőszigetelés',
    'Térkövek és burkolatok',
    'Szerszámok és kellékek',
];

const Termekek = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [termekek, setTermekek] = useState([]);
    const [kereses, setKereses] = useState('');
    const kivalasztottKategoriak = useMemo(
        () => searchParams.getAll('kategoria').filter((kategoria) => KATEGORIAK.includes(kategoria)),
        [searchParams],
    );
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
                    throw new Error(valasz.msg || t('A termékek betöltése nem sikerült.'));
                }
                setTermekek(valasz.termekek);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    setHiba(error.message || t('A szerver nem érhető el. Próbáld újra később!'));
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

    // A képes választó egyetlen kategóriát választ, az „Összes” törli a kategóriaszűrést.
    const egyKategoriaValasztas = (kategoria) => {
        const ujParameterek = new URLSearchParams(searchParams);
        ujParameterek.delete('kategoria');
        if (kategoria) ujParameterek.append('kategoria', kategoria);
        setSearchParams(ujParameterek);
    };

    const szurokTorlese = () => {
        const ujParameterek = new URLSearchParams(searchParams);
        ujParameterek.delete('kategoria');
        setSearchParams(ujParameterek);
        setMinAr('');
        setMaxAr('');
    };

    return (
        <div className="termekek-kontener">
            <header className="termekek-fejlec">
                <span className="termekek-felirat">{t('VÁLASZTÉKUNK')}</span>
                <h1>{t('Termékeink')}</h1>
                <p>{t('Fedezd fel építőanyagainkat, és találd meg gyorsan, amire a munkádhoz szükséged van.')}</p>
            </header>
            <div className="termekek-elrendezes">
                <aside className="termek-szuro-oldalsav" aria-label={t('Termékek szűrése')}>
                    <div className="termek-szuro-fejlec">
                        <h2>{t('Szűrők')}</h2>
                        {(kivalasztottKategoriak.length > 0 || minAr !== '' || maxAr !== '') && (
                            <span className="termek-szuro-aktiv">{t('Aktív')}</span>
                        )}
                    </div>
                    <div className="termek-szuro-kategoria-blokk">
                        <span className="termek-szuro-cim">{t('Kategória')}</span>
                        <KategoriaValaszto
                            kategoriak={KATEGORIAK}
                            kivalasztott={kivalasztottKategoriak}
                            valaszt={egyKategoriaValasztas}
                        />
                    </div>
                    <fieldset className="termek-ar-szuro">
                        <legend>{t('Ártartomány (Ft)')}</legend>
                        <label>
                            {t('Minimum ár')}
                            <input type="number" min="0" step="0.01" value={minAr} onChange={(event) => setMinAr(event.target.value)} placeholder={t('Nincs minimum')} />
                        </label>
                        <label>
                            {t('Maximum ár')}
                            <input type="number" min="0" step="0.01" value={maxAr} onChange={(event) => setMaxAr(event.target.value)} placeholder={t('Nincs maximum')} />
                        </label>
                    </fieldset>
                    <button className="termek-szuro-torles" type="button" onClick={szurokTorlese}>{t('Szűrők törlése')}</button>
                </aside>
                <main className="termekek-tartalom">
                    <div className="termek-kereso">
                        <label htmlFor="termek-kereses">{t('Termék keresése név vagy kategória alapján')}</label>
                        <input
                            id="termek-kereses"
                            type="search"
                            value={kereses}
                            onChange={(event) => setKereses(event.target.value)}
                            placeholder={t('Kezdj el gépelni…')}
                            autoComplete="off"
                        />
                    </div>
                    {hiba && <p className="termek-keresesi-hiba" role="alert">{hiba}</p>}
                    {betoltes && <p className="termek-keresesi-allapot" aria-live="polite">{t('Keresés…')}</p>}
                    {!betoltes && !hiba && termekek.length === 0 && (
                        <p className="termek-keresesi-allapot">{t('Nincs a keresésnek megfelelő termék.')}</p>
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