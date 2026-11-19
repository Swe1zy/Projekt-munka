import { temaValtas, useTema } from '../../utils/tema';

const OPCIOK = [
    { kulcs: 'vilagos', cimke: 'Világos', leiras: 'Világos háttér, sötét betűk.' },
    { kulcs: 'sotet', cimke: 'Sötét', leiras: 'Sötét háttér, kíméli a szemet este.' },
    { kulcs: 'rendszer', cimke: 'Rendszer szerint', leiras: 'Követi a készüléked beállítását.' },
];

// A téma azonnal érvényes, mentés gomb nélkül. Eszközönként tárolódik.
const Megjelenes = () => {
    const tema = useTema();

    return (
        <div className="profil-panelek">
            <section className="profil-panel">
                <div className="profil-panel-fej">
                    <h2>Megjelenés</h2>
                    <p>Válaszd ki, milyen színekkel jelenjen meg az áruház. A beállítást ez a böngésző jegyzi meg.</p>
                </div>

                <fieldset className="tema-valaszto">
                    <legend className="tema-rejtett">Téma</legend>
                    {OPCIOK.map((opcio) => (
                        <label
                            key={opcio.kulcs}
                            className="tema-opcio"
                        >
                            <input
                                type="radio"
                                name="tema"
                                value={opcio.kulcs}
                                checked={tema === opcio.kulcs}
                                onChange={() => temaValtas(opcio.kulcs)}
                            />
                            <span
                                className={`tema-minta tema-minta--${opcio.kulcs}`}
                                aria-hidden="true"
                            >
                                <span className="tema-minta-sav" />
                                <span className="tema-minta-kartya">
                                    <span />
                                    <span />
                                </span>
                            </span>
                            <span className="tema-opcio-szoveg">
                                <strong>{opcio.cimke}</strong>
                                <small>{opcio.leiras}</small>
                            </span>
                        </label>
                    ))}
                </fieldset>
            </section>
        </div>
    );
};

export default Megjelenes;
