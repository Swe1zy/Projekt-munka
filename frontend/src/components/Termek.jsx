import './Termek.css';

const Termek = ({ termek }) => {
    const kep = termek.kepek?.[0] ?? termek.kep;

    return (
        <div className="termek-kontener">
            <h2>{termek.nev}</h2>
            <div className="termek-belso-kontener">
                {kep && (
                    <div className="kep-kontener">
                        <img
                            src={kep}
                            alt={termek.nev}
                        />
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
