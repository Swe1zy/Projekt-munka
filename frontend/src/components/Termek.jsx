import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import './Termek.css';

const Termek = ({ termek }) => {
    const { tetelek, hozzaad } = useCart();
    const toast = useToast();
    const kepek = Array.isArray(termek.kepek) && termek.kepek.length
        ? termek.kepek
        : [termek.kep, termek.kep1, termek.kep2, termek.kep3].filter(Boolean);
    const kosarban = tetelek.find((elem) => elem.id === termek._id)?.mennyiseg ?? 0;

    const kosarba = () => {
        hozzaad({ ...termek, kep: kepek[0] });
        toast.siker(`„${termek.nev}” a kosárba került.`);
    };

    return (
        <article className="termek-kontener">
            <header className="termek-kartya-fejlec">
                {termek.kategoria && <span className="termek-kategoria">{termek.kategoria}</span>}
                <h2>{termek.nev}</h2>
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
                    <p>{termek.ar.toLocaleString('hu-HU')} Ft</p>
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
