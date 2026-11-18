import { useState } from 'react';
import { apiKeres } from '../../utils/api';
import { datum } from '../../utils/dashboardFormazas';
import Uzenet from './Uzenet';

// E-mail-értesítések: a rendelés állapotváltozásai és az akciós hírlevél.
const ErtesitesiBeallitasok = ({ beallitasok, frissult }) => {
    const [allapotValtozas, setAllapotValtozas] = useState(beallitasok.allapotValtozas);
    const [hirlevel, setHirlevel] = useState(beallitasok.hirlevel);
    const [uzenet, setUzenet] = useState(null);
    const [kuldes, setKuldes] = useState(false);

    const bekuld = async (event) => {
        event.preventDefault();
        setUzenet(null);
        setKuldes(true);
        try {
            const valasz = await apiKeres('/fiok/beallitasok', {
                method: 'PUT',
                body: { ertesitesek: { allapotValtozas, hirlevel } },
            });
            frissult(valasz);
            setUzenet({ tipus: 'siker', szoveg: valasz.msg });
        } catch (error) {
            setUzenet({ tipus: 'hiba', szoveg: error.message });
        } finally {
            setKuldes(false);
        }
    };

    return (
        <form
            className="profil-panel profil-urlap"
            onSubmit={bekuld}
        >
            <div className="profil-panel-fej">
                <h2>E-mail-értesítések</h2>
                <p>A rendelés visszaigazolását és a díjbekérőt mindig elküldjük, a többit itt választhatod ki.</p>
            </div>

            <label className="auth-jelolo">
                <input
                    type="checkbox"
                    checked={allapotValtozas}
                    onChange={(event) => setAllapotValtozas(event.target.checked)}
                />
                <span>
                    <strong>Rendelésem állapota</strong>
                    <br />
                    Szólj, amikor a rendelésemet visszaigazolják, útnak indul, teljesül vagy lemondják.
                </span>
            </label>

            <label className="auth-jelolo">
                <input
                    type="checkbox"
                    checked={hirlevel}
                    onChange={(event) => setHirlevel(event.target.checked)}
                />
                <span>
                    <strong>Akciós hírlevél</strong>
                    <br />
                    Hozzájárulok, hogy a Tüzép az e-mail-címemre akciós ajánlatokat és szezonális
                    tájékoztatót küldjön. A hozzájárulást itt bármikor visszavonhatom.
                    {beallitasok.hirlevel && beallitasok.hirlevelIdopont && (
                        <small className="profil-megjegyzes"> Feliratkozva: {datum(beallitasok.hirlevelIdopont)}.</small>
                    )}
                </span>
            </label>

            <Uzenet uzenet={uzenet} />
            <div className="profil-gombok">
                <button
                    type="submit"
                    className="auth-gomb"
                    disabled={kuldes}
                >
                    {kuldes ? 'Mentés…' : 'Értesítések mentése'}
                </button>
            </div>
        </form>
    );
};

export default ErtesitesiBeallitasok;
