import { useState } from 'react';
import { MAX_MENNYISEG } from '../context/CartContext';
import './MennyisegValaszto.css';

const MennyisegValaszto = ({ ertek, beallit, nev, max = MAX_MENNYISEG, className = '' }) => {
    // Gépelés közben az üres mező is megengedett, kifelé csak érvényes szám megy.
    const [szerkesztett, setSzerkesztett] = useState(null);

    const valtozas = (event) => {
        const szoveg = event.target.value;
        setSzerkesztett(szoveg);

        const szam = Number(szoveg);
        if (szoveg !== '' && Number.isFinite(szam) && szam >= 0.01) {
            beallit(Math.round(Math.min(max, szam) * 100) / 100);
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
                disabled={ertek <= 0.01}
                onClick={() => beallit(Math.max(0.01, Math.round((ertek - 0.01) * 100) / 100))}
            >
                −
            </button>
            <input
                type="number"
                inputMode="decimal"
                min="0.01"
                max={max}
                step="0.01"
                value={szerkesztett ?? ertek}
                aria-label="Mennyiség"
                onChange={valtozas}
                onBlur={() => setSzerkesztett(null)}
            />
            <button
                type="button"
                aria-label="Mennyiség növelése"
                disabled={ertek >= max}
                onClick={() => beallit(Math.min(max, Math.round((ertek + 0.01) * 100) / 100))}
            >
                +
            </button>
        </div>
    );
};

export default MennyisegValaszto;
