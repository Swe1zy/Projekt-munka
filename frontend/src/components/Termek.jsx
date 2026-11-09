import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { forint, termekKepek } from '../utils/termek';
import './Termek.css';

const Termek = ({ termek }) => {
    const { tetelek, hozzaad } = useCart();
    const toast = useToast();
    const kepek = termekKepek(termek);
    const kosarban = tetelek.find((elem) => elem.id === termek._id)?.mennyiseg ?? 0;

    const kosarba = () => {
        hozzaad({ ...termek, kep: kepek[0] });
        toast.siker(`„${termek.nev}” a kosárba került.`);
    };

    return (
        <article className="termek-kontener">
            <header className="termek-kartya-fejlec">
                {termek.kategoria && <span className="termek-kategoria">{termek.kategoria}</span>}
                <h2>
                    {/* A link az egész kártyát lefedi, így bárhová kattintva megnyílik a termék. */}
                    <Link className="termek-megnyitas" to={`/termekek/${termek._id}`}>
                        {termek.nev}
                    </Link>
                </h2>
            </header>
            <div className="termek-belso-kontener">
                {kepek.length > 0 && (
                    <div className="kepek-kontener">
                        {kepek.map((kep, index) => (
                            <img
                                key={`${kep}-${index}`}
                                src={kep}
                                alt={`${termek.nev} – ${index + 1}. kép`}
                                loading="lazy"
                            />
                        ))}
                    </div>
                )}
                <div className="tartalom-kontener">
                    <h4>Ár:</h4>
                    <p>{forint(termek.ar)}</p>
                    <h4>Leírás:</h4>
                    <p>{termek.leiras}</p>
                </div>
            </div>
            <footer className="termek-kosar-lab">
                <button type="button" className="termek-kosarba-gomb" onClick={kosarba}>
                    Kosárba
                </button>
                {kosarban > 0 && (
                    <span className="termek-kosarban" aria-live="polite">
                        A kosárban: {kosarban} db
                    </span>
                )}
            </footer>
        </article>
    );
};

export default Termek;
