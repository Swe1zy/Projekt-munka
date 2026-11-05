import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MAX_MENNYISEG, useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import './Kosar.css';

const forint = (osszeg) => `${osszeg.toLocaleString('hu-HU')} Ft`;

const Ikon = ({ children }) => (
    <svg
        className="kosar-ikon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        {children}
    </svg>
);

const MennyisegValaszto = ({ tetel, beallit }) => {
    // Gépelés közben az üres mező is megengedett, a kosár csak érvényes számot kap.
    const [szerkesztett, setSzerkesztett] = useState(null);

    const valtozas = (event) => {
        const ertek = event.target.value;
        setSzerkesztett(ertek);

        const szam = Number(ertek);
        if (ertek !== '' && Number.isInteger(szam) && szam >= 1) beallit(tetel.id, szam);
    };

    return (
        <div className="kosar-mennyiseg" role="group" aria-label={`${tetel.nev} mennyisége`}>
            <button
                type="button"
                aria-label="Mennyiség csökkentése"
                disabled={tetel.mennyiseg <= 1}
                onClick={() => beallit(tetel.id, tetel.mennyiseg - 1)}
            >
                −
            </button>
            <input
                type="number"
                inputMode="numeric"
                min="1"
                max={MAX_MENNYISEG}
                step="1"
                value={szerkesztett ?? tetel.mennyiseg}
                aria-label="Mennyiség"
                onChange={valtozas}
                onBlur={() => setSzerkesztett(null)}
            />
            <button
                type="button"
                aria-label="Mennyiség növelése"
                disabled={tetel.mennyiseg >= MAX_MENNYISEG}
                onClick={() => beallit(tetel.id, tetel.mennyiseg + 1)}
            >
                +
            </button>
        </div>
    );
};

const Kosar = () => {
    const { tetelek, osszesDarab, vegosszeg, mennyisegBeallit, torol, urit } = useCart();
    const toast = useToast();

    const tetelTorlese = (tetel) => {
        torol(tetel.id);
        toast.siker(`„${tetel.nev}” törölve a kosárból.`);
    };

    const kosarUritese = () => {
        urit();
        toast.siker('A kosár kiürült.');
    };

    return (
        <div className="kosar-kontener">
            <header className="kosar-fejlec">
                <span className="kosar-felirat">KOSÁR</span>
                <h1>Kosarad</h1>
                {tetelek.length > 0 && (
                    <p>
                        {tetelek.length} féle termék, összesen {osszesDarab} db.
                    </p>
                )}
            </header>

            {tetelek.length === 0 ? (
                <section className="kosar-ures">
                    <Ikon>
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </Ikon>
                    <h2>A kosarad üres</h2>
                    <p>Válogass az építőanyagaink közül, és tedd kosárba, amire szükséged van.</p>
                    <Link className="kosar-gomb-elso" to="/termekek">
                        Tovább a termékekhez
                    </Link>
                </section>
            ) : (
                <div className="kosar-elrendezes">
                    <ul className="kosar-lista" aria-label="Kosár tartalma">
                        {tetelek.map((tetel) => (
                            <li className="kosar-tetel" key={tetel.id}>
                                <div className="kosar-kep">
                                    {tetel.kep ? (
                                        <img src={tetel.kep} alt={tetel.nev} loading="lazy" />
                                    ) : (
                                        <span aria-hidden="true">{tetel.nev.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="kosar-adatok">
                                    {tetel.kategoria && (
                                        <span className="kosar-kategoria">{tetel.kategoria}</span>
                                    )}
                                    <h2>{tetel.nev}</h2>
                                    <p>{forint(tetel.ar)} / db</p>
                                </div>
                                <MennyisegValaszto tetel={tetel} beallit={mennyisegBeallit} />
                                <strong className="kosar-reszosszeg">
                                    {forint(Math.round(tetel.ar * tetel.mennyiseg * 100) / 100)}
                                </strong>
                                <button
                                    type="button"
                                    className="kosar-torles"
                                    aria-label={`${tetel.nev} törlése a kosárból`}
                                    onClick={() => tetelTorlese(tetel)}
                                >
                                    <Ikon>
                                        <path d="M3 6h18" />
                                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                        <path d="M10 11v6" />
                                        <path d="M14 11v6" />
                                    </Ikon>
                                    Törlés
                                </button>
                            </li>
                        ))}
                    </ul>

                    <aside className="kosar-osszegzo" aria-label="Összegzés">
                        <h2>Összegzés</h2>
                        <dl>
                            <div>
                                <dt>Termékek</dt>
                                <dd>{osszesDarab} db</dd>
                            </div>
                            <div className="kosar-vegosszeg">
                                <dt>Végösszeg</dt>
                                <dd>{forint(vegosszeg)}</dd>
                            </div>
                        </dl>
                        <Link className="kosar-gomb-masodik" to="/termekek">
                            Vásárlás folytatása
                        </Link>
                        <button type="button" className="kosar-uritese" onClick={kosarUritese}>
                            Kosár ürítése
                        </button>
                    </aside>
                </div>
            )}
        </div>
    );
};

export default Kosar;
