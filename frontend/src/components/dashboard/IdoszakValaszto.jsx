import { useState } from 'react';

const IDOSZAK_GOMBOK = [
    { kulcs: '7nap', cimke: '7 nap' },
    { kulcs: '30nap', cimke: '30 nap' },
    { kulcs: '90nap', cimke: '90 nap' },
    { kulcs: '12honap', cimke: '12 hónap' },
];

// A böngésző helyi naptári napja „ÉÉÉÉ-HH-NN” alakban.
const maiNap = () => new Date().toLocaleDateString('sv-SE');

const napEltolas = (kulcs, napok) => {
    const [ev, honap, nap] = kulcs.split('-').map(Number);
    return new Date(Date.UTC(ev, honap - 1, nap + napok)).toISOString().slice(0, 10);
};

const EgyediUrlap = ({ tol, ig, onAlkalmaz }) => {
    const ma = maiNap();
    const [mezok, setMezok] = useState({ tol: tol ?? napEltolas(ma, -29), ig: ig ?? ma });
    const [hiba, setHiba] = useState('');

    const mentes = (event) => {
        event.preventDefault();
        if (!mezok.tol || !mezok.ig) {
            setHiba('Add meg mindkét napot.');
            return;
        }
        if (mezok.tol > mezok.ig) {
            setHiba('A kezdő nap nem lehet későbbi a záró napnál.');
            return;
        }
        if (mezok.ig > ma) {
            setHiba('A záró nap nem lehet a jövőben.');
            return;
        }
        const menu = event.currentTarget.closest('details');
        onAlkalmaz(mezok);
        if (menu) menu.open = false;
    };

    return (
        <form className="db-egyedi-urlap" onSubmit={mentes} noValidate>
            <label>
                Kezdő nap
                <input
                    type="date"
                    value={mezok.tol}
                    max={mezok.ig || ma}
                    onChange={(event) => setMezok((elozo) => ({ ...elozo, tol: event.target.value }))}
                />
            </label>
            <label>
                Záró nap
                <input
                    type="date"
                    value={mezok.ig}
                    min={mezok.tol || undefined}
                    max={ma}
                    onChange={(event) => setMezok((elozo) => ({ ...elozo, ig: event.target.value }))}
                />
            </label>
            {hiba && <p className="db-urlap-hiba" role="alert">{hiba}</p>}
            <button type="submit" className="db-alkalmaz">Alkalmaz</button>
            <small>92 napig napi, felette havi bontás; legfeljebb 3 év.</small>
        </form>
    );
};

/**
 * Időszakválasztó: előre beállított időszakok, egyedi dátumtartomány és az
 * összevetés módja (előző, ugyanolyan hosszú időszak vagy tavaly ugyanekkor).
 */
const IdoszakValaszto = ({ idoszak, tol, ig, osszevetes, onValtas }) => {
    const egyedi = idoszak === 'egyedi';
    return (
        <>
            <div className="db-idoszak" role="group" aria-label="Időszak">
                {IDOSZAK_GOMBOK.map((elem) => (
                    <button
                        key={elem.kulcs}
                        type="button"
                        aria-pressed={elem.kulcs === idoszak}
                        onClick={() => onValtas({ idoszak: elem.kulcs })}
                    >
                        {elem.cimke}
                    </button>
                ))}
            </div>
            <details className={`db-export db-egyedi${egyedi ? ' db-egyedi--aktiv' : ''}`}>
                <summary>{egyedi ? 'Egyedi időszak ✓' : 'Egyedi időszak'}</summary>
                <div className="db-export-menu">
                    <EgyediUrlap
                        key={`${tol}|${ig}`}
                        tol={tol}
                        ig={ig}
                        onAlkalmaz={(mezok) => onValtas({ idoszak: 'egyedi', ...mezok })}
                    />
                </div>
            </details>
            <label className="db-osszevetes">
                <span>Összevetés:</span>
                <select value={osszevetes} onChange={(event) => onValtas({ osszevetes: event.target.value })}>
                    <option value="elozo">előző időszak</option>
                    <option value="tavaly">tavaly ugyanekkor</option>
                </select>
            </label>
        </>
    );
};

export default IdoszakValaszto;
