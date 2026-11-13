import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiKeres, fajlLetoltes } from '../../utils/api';
import Uzenet from './Uzenet';

// Adatok letöltése és a fiók végleges törlése.
const FiokKezeles = () => {
    const { user, logout } = useAuth();
    const { siker } = useToast();
    const navigate = useNavigate();
    const [letoltes, setLetoltes] = useState(false);
    const [letoltesUzenet, setLetoltesUzenet] = useState(null);
    const [torlesNyitva, setTorlesNyitva] = useState(false);
    const [jelszo, setJelszo] = useState('');
    const [torlesUzenet, setTorlesUzenet] = useState(null);
    const [torles, setTorles] = useState(false);

    const admin = user.role === 'admin';

    const adatokLetoltese = async () => {
        setLetoltesUzenet(null);
        setLetoltes(true);
        try {
            await fajlLetoltes('/fiok/adatok', 'tuzep-adataim.json');
        } catch (error) {
            setLetoltesUzenet({ tipus: 'hiba', szoveg: error.message });
        } finally {
            setLetoltes(false);
        }
    };

    const fiokTorlese = async (event) => {
        event.preventDefault();
        setTorlesUzenet(null);
        setTorles(true);
        try {
            const valasz = await apiKeres('/fiok/torles', { method: 'POST', body: { jelszo } });
            siker(valasz.msg);
            navigate('/', { replace: true });
            logout();
        } catch (error) {
            setTorlesUzenet({ tipus: 'hiba', szoveg: error.message });
            setTorles(false);
        }
    };

    return (
        <>
            <section className="profil-panel profil-urlap">
                <div className="profil-panel-fej">
                    <h2>Adataim letöltése</h2>
                    <p>
                        Egy fájlban letöltheted a fiókod adatait, a mentett címeidet, a rendeléseidet
                        és az árajánlatkéréseidet (JSON formátumban).
                    </p>
                </div>
                <Uzenet uzenet={letoltesUzenet} />
                <div className="profil-gombok">
                    <button
                        type="button"
                        className="profil-gomb profil-gomb-masodlagos"
                        disabled={letoltes}
                        onClick={adatokLetoltese}
                    >
                        {letoltes ? 'Összeállítás…' : 'Adatok letöltése'}
                    </button>
                </div>
            </section>

            <section className="profil-panel profil-urlap profil-panel-veszely">
                <div className="profil-panel-fej">
                    <h2>Fiók törlése</h2>
                    <p>
                        A törlés végleges: megszűnik a fiókod, törlődnek a mentett címeid és az
                        árajánlatkéréseid. A korábbi rendeléseid adatait a számviteli szabályok
                        miatt a fiókodról leválasztva megőrizzük, de többé nem tudsz belépni és
                        követni őket. Részletek az <Link to="/aszf">ÁSZF-ben</Link>.
                    </p>
                </div>

                {admin ? (
                    <p className="profil-megjegyzes">Az admin fiók itt nem törölhető.</p>
                ) : !torlesNyitva ? (
                    <div className="profil-gombok">
                        <button
                            type="button"
                            className="profil-gomb profil-gomb-veszely"
                            onClick={() => setTorlesNyitva(true)}
                        >
                            Fiók törlése…
                        </button>
                    </div>
                ) : (
                    <form
                        className="profil-urlap"
                        onSubmit={fiokTorlese}
                    >
                        <label className="auth-mezo">
                            A törlés megerősítéséhez add meg a jelszavad
                            <input
                                type="password"
                                autoComplete="current-password"
                                value={jelszo}
                                onChange={(event) => setJelszo(event.target.value)}
                                autoFocus
                                required
                            />
                        </label>
                        <Uzenet uzenet={torlesUzenet} />
                        <div className="profil-gombok">
                            <button
                                type="submit"
                                className="profil-gomb profil-gomb-veszely profil-gomb-veszely-teli"
                                disabled={torles}
                            >
                                {torles ? 'Törlés…' : 'Végleg törlöm a fiókomat'}
                            </button>
                            <button
                                type="button"
                                className="profil-gomb profil-gomb-masodlagos"
                                disabled={torles}
                                onClick={() => {
                                    setTorlesNyitva(false);
                                    setJelszo('');
                                    setTorlesUzenet(null);
                                }}
                            >
                                Mégsem
                            </button>
                        </div>
                    </form>
                )}
            </section>
        </>
    );
};

export default FiokKezeles;
