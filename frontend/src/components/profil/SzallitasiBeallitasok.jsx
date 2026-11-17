import { useState } from 'react';
import { apiKeres } from '../../utils/api';
import { useBeallitasok } from '../../utils/beallitasok';
import { forint } from '../../utils/termek';
import Uzenet from './Uzenet';

// A pénztár alapértékei házhozszállításnál: darus lerakodás és a kedvelt idősáv.
const SzallitasiBeallitasok = ({ beallitasok, frissult }) => {
    const { adat: uzlet } = useBeallitasok();
    const [darus, setDarus] = useState(beallitasok.darus);
    const [idosav, setIdosav] = useState(beallitasok.idosav);
    const [uzenet, setUzenet] = useState(null);
    const [kuldes, setKuldes] = useState(false);
    const idosavok = uzlet?.kiszallitas?.idosavok ?? [];

    const bekuld = async (event) => {
        event.preventDefault();
        setUzenet(null);
        setKuldes(true);
        try {
            const valasz = await apiKeres('/fiok/beallitasok', { method: 'PUT', body: { szallitas: { darus, idosav } } });
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
                <h2>Kiszállítási beállítások</h2>
                <p>Házhozszállításnál a pénztár ezekkel az értékekkel indul, rendeléskor módosíthatod őket.</p>
            </div>

            <label className="auth-jelolo">
                <input
                    type="checkbox"
                    checked={darus}
                    onChange={(event) => setDarus(event.target.checked)}
                />
                <span>
                    Darus lerakodást kérek alapértelmezésként
                    {uzlet?.szallitas?.darusPotdij ? ` (+${forint(uzlet.szallitas.darusPotdij)} fordulónként)` : ''}
                </span>
            </label>

            <fieldset className="profil-csoport">
                <legend>Kedvelt idősáv</legend>
                <div
                    className="profil-valaszto"
                    role="radiogroup"
                    aria-label="Kedvelt idősáv"
                >
                    {[{ kulcs: '', cimke: 'Mindegy' }, ...idosavok].map((sav) => (
                        <label key={sav.kulcs || 'mindegy'} className={idosav === sav.kulcs ? 'aktiv' : undefined}>
                            <input
                                type="radio"
                                name="kedvelt-idosav"
                                value={sav.kulcs}
                                checked={idosav === sav.kulcs}
                                onChange={(event) => setIdosav(event.target.value)}
                            />
                            {sav.cimke}
                        </label>
                    ))}
                </div>
            </fieldset>

            <Uzenet uzenet={uzenet} />
            <div className="profil-gombok">
                <button
                    type="submit"
                    className="auth-gomb"
                    disabled={kuldes}
                >
                    {kuldes ? 'Mentés…' : 'Beállítások mentése'}
                </button>
            </div>
        </form>
    );
};

export default SzallitasiBeallitasok;
