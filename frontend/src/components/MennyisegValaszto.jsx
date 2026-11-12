import { useState } from 'react';
import { MAX_MENNYISEG } from '../context/CartContext';
import './MennyisegValaszto.css';

const MennyisegValaszto = ({ ertek, beallit, nev, max = MAX_MENNYISEG, egyseg = 'm³', className = '' }) => {
    // Gépelés közben az üres mező is megengedett, kifelé csak érvényes szám megy.
    const [szerkesztett, setSzerkesztett] = useState(null);
    const lepes = egyseg === 'db' ? 1 : 0.01;
    const minimum = egyseg === 'db' ? 1 : 0.01;

    const valtozas = (event) => {
        const szoveg = event.target.value;
        setSzerkesztett(szoveg);

        const szam = Number(szoveg);
        if (szoveg !== '' && Number.isFinite(szam) && szam >= minimum) {
            beallit(egyseg === 'db'
                ? Math.round(Math.min(max, szam))
                : Math.round(Math.min(max, szam) * 100) / 100);
        }
    };

    return (
        <div
            className={`mennyiseg-valaszto ${className}`.trim()}
            role="group"
            aria-label={`${nev} mennyisége`}
        >
            <button
                type="button"
                aria-label="Mennyiség csökkentése"
                disabled={ertek <= minimum}
                onClick={() => beallit(egyseg === 'db'
                    ? Math.max(minimum, ertek - lepes)
                    : Math.max(minimum, Math.round((ertek - lepes) * 100) / 100))}
            >
                −
            </button>
            <input
                type="number"
                inputMode="decimal"
                min={minimum}
                max={max}
                step={lepes}
                value={szerkesztett ?? ertek}
                aria-label="Mennyiség"
                onChange={valtozas}
                onBlur={() => setSzerkesztett(null)}
            />
            <button
                type="button"
                aria-label="Mennyiség növelése"
                disabled={ertek >= max}
                onClick={() => beallit(egyseg === 'db'
                    ? Math.min(max, ertek + lepes)
                    : Math.min(max, Math.round((ertek + lepes) * 100) / 100))}
            >
                +
            </button>
        </div>
    );
};

export default MennyisegValaszto;
