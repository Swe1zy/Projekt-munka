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
        if (szoveg !== '' && Number.isInteger(szam) && szam >= 1) beallit(Math.min(max, szam));
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
                disabled={ertek <= 1}
                onClick={() => beallit(ertek - 1)}
            >
                −
            </button>
            <input
                type="number"
                inputMode="numeric"
                min="1"
                max={max}
                step="1"
                value={szerkesztett ?? ertek}
                aria-label="Mennyiség"
                onChange={valtozas}
                onBlur={() => setSzerkesztett(null)}
            />
            <button
                type="button"
                aria-label="Mennyiség növelése"
                disabled={ertek >= max}
                onClick={() => beallit(ertek + 1)}
            >
                +
            </button>
        </div>
    );
};

export default MennyisegValaszto;
