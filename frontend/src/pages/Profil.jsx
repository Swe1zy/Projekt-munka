import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import './Auth.css';
import './Profil.css';

const MIN_JELSZO_HOSSZ = 8;

const Profil = () => {
    const { user } = useAuth();
    const [jelszo, setJelszo] = useState('');
    const [ujJelszo, setUjJelszo] = useState('');
    const [ujJelszoMegerosites, setUjJelszoMegerosites] = useState('');
    const [hiba, setHiba] = useState('');
    const [siker, setSiker] = useState('');
    const [kuldes, setKuldes] = useState(false);

    if (!user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: '/profil' }}
            />
        );
    }

    const kezdobetu = (user.nev || user.email || '?')
        .trim()
        .charAt(0)
        .toUpperCase();

    const bekuld = async (event) => {
        event.preventDefault();
        setHiba('');
        setSiker('');

        if (ujJelszo !== ujJelszoMegerosites) {
            setHiba('A két új jelszó nem egyezik!');
            return;
        }

        setKuldes(true);

        try {
            const response = await fetch(`${API_URL}/auth/password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, jelszo, ujJelszo }),
            });

            const valasz = await response.json();

            if (response.ok) {
                setSiker(valasz.msg);
                setJelszo('');
                setUjJelszo('');
                setUjJelszoMegerosites('');
            } else setHiba(valasz.msg);
        } catch {
            setHiba('A szerver nem érhető el. Próbáld újra később!');
        } finally {
            setKuldes(false);
        }
    };

    return (
        <div className="auth-kontener">
            <div className="auth-kartya profil-kartya">
                <div className="profil-fej">
                    <span
                        className="profil-avatar"
                        aria-hidden="true"
                    >
                        {kezdobetu}
                    </span>
                    <div className="profil-adatok">
                        <h1>{user.nev}</h1>
                        <p>{user.email}</p>
                    </div>
                </div>

                <form
                    className="profil-urlap"
                    onSubmit={bekuld}
                >
                    <h2>Jelszó módosítása</h2>

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
                            onChange={(event) =>
                                setUjJelszoMegerosites(event.target.value)
                            }
                            required
                        />
                    </label>

                    {hiba && (
                        <p
                            className="auth-uzenet auth-hiba"
                            role="alert"
                        >
                            {hiba}
                        </p>
                    )}
                    {siker && (
                        <p
                            className="auth-uzenet auth-siker"
                            role="status"
                        >
                            {siker}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="auth-gomb"
                        disabled={kuldes}
                    >
                        {kuldes ? 'Mentés…' : 'Jelszó módosítása'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Profil;
