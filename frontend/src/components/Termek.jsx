import './Termek.css';

const Termek = ({ termek }) => {
    return (
        <div className="termek-kontener">
            <h2>{termek.nev}</h2>
            <div className="termek-belso-kontener">
                <div className="kep-kontener">
                    <img
                        src={`epulet_kepek/${termek.kep}`}
                        alt={termek.nev}
                    />
                </div>
                <div className="tartalom-kontener">
                    <h4>Város:</h4>
                    <p>{termek.varos}</p>
                    <h4>Ország:</h4>
                    <p>{termek.orszag}</p>
                    <h4>Kontinens:</h4>
                    <p>{termek.kontinens}</p>
                    <h4>Leírás:</h4>
                    <p>{termek.leiras}</p>
                </div>
            </div>
        </div>
    );
};

export default Termek;