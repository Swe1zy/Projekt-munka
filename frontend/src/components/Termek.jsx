import './Termek.css';

const Termek = ({ termek }) => {
    const kepek = Array.isArray(termek.kepek) && termek.kepek.length
        ? termek.kepek
        : [termek.kep, termek.kep1, termek.kep2, termek.kep3].filter(Boolean);

    return (
        <div className="termek-kontener">
            <h2>{termek.nev}</h2>
            {termek.kategoria && <p className="termek-kategoria">{termek.kategoria}</p>}
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
        </div>
    );
};

export default Termek;
