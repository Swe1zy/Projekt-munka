import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiKeres } from '../../utils/api';
import Uzenet from './Uzenet';

const MIN_JELSZO_HOSSZ = 8;

const JelszoModositas = () => {
    const { user } = useAuth();
    const [jelszo, setJelszo] = useState('');
    const [ujJelszo, setUjJelszo] = useState('');
    const [ujJelszoMegerosites, setUjJelszoMegerosites] = useState('');
    const [uzenet, setUzenet] = useState(null);
    const [kuldes, setKuldes] = useState(false);

    const bekuld = async (event) => {
        event.preventDefault();
        setUzenet(null);

        if (ujJelszo !== ujJelszoMegerosites) {
            setUzenet({ tipus: 'hiba', szoveg: 'A két új jelszó nem egyezik!' });
            return;
        }

        setKuldes(true);

        try {
            const valasz = await apiKeres('/auth/password', {
                method: 'POST',
                body: { email: user.email, jelszo, ujJelszo },
            });
            setJelszo('');
            setUjJelszo('');
            setUjJelszoMegerosites('');
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
                <h2>Jelszó módosítása</h2>
            </div>

            <label className="auth-mezo">
                Jelenlegi jelszó
                <input
                    type="password"
                    autoComplete="current-password"
                    value={jelszo}
                    onChange={(event) => setJelszo(event.target.value)}
                    required
                />
            </label>
            <div className="profil-mezo-par">
                <label className="auth-mezo">
                    Új jelszó
                    <input
                        type="password"
                        autoComplete="new-password"
                        minLength={MIN_JELSZO_HOSSZ}
                        value={ujJelszo}
                        onChange={(event) => setUjJelszo(event.target.value)}
                        required
                    />
                    <small>Legalább {MIN_JELSZO_HOSSZ} karakter.</small>
                </label>
                <label className="auth-mezo">
                    Új jelszó megerősítése
                    <input
                        type="password"
                        autoComplete="new-password"
                        value={ujJelszoMegerosites}
                        onChange={(event) => setUjJelszoMegerosites(event.target.value)}
                        required
                    />
                </label>
            </div>

            <Uzenet uzenet={uzenet} />

            <div className="profil-gombok">
                <button
                    type="submit"
                    className="auth-gomb"
                    disabled={kuldes}
                >
                    {kuldes ? 'Mentés…' : 'Jelszó módosítása'}
                </button>
            </div>
        </form>
    );
};

export default JelszoModositas;
