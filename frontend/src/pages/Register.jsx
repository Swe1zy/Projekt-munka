import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const MIN_JELSZO_HOSSZ = 8;

const Register = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [nev, setNev] = useState('');
    const [email, setEmail] = useState('');
    const [jelszo, setJelszo] = useState('');
    const [jelszoMegerosites, setJelszoMegerosites] = useState('');
    const [hiba, setHiba] = useState('');
    const [kuldes, setKuldes] = useState(false);

    if (user) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    const bekuld = async (event) => {
        event.preventDefault();
        setHiba('');

        if (jelszo !== jelszoMegerosites) {
            setHiba('A két jelszó nem egyezik!');
            return;
        }

        setKuldes(true);

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nev, email, jelszo }),
            });

            const valasz = await response.json();

            if (response.ok)
                navigate('/login', { state: { uzenet: valasz.msg } });
            else setHiba(valasz.msg);
        } catch {
            setHiba('A szerver nem érhető el. Próbáld újra később!');
        } finally {
            setKuldes(false);
        }
    };

    return (
        <div className="auth-kontener">
            <form
                className="auth-kartya"
                onSubmit={bekuld}
            >
                <h1>Regisztráció</h1>
                <p className="auth-leiras">
                    Hozd létre a fiókodat pár lépésben.
                </p>

                <label className="auth-mezo">
                    Név
                    <input
                        type="text"
                        autoComplete="name"
                        value={nev}
                        onChange={(event) => setNev(event.target.value)}
                        required
                    />
                </label>
                <label className="auth-mezo">
                    E-mail cím
                    <input
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </label>
                <label className="auth-mezo">
                    Jelszó
                    <input
                        type="password"
                        autoComplete="new-password"
                        minLength={MIN_JELSZO_HOSSZ}
                        value={jelszo}
                        onChange={(event) => setJelszo(event.target.value)}
                        required
                    />
                    <small>Legalább {MIN_JELSZO_HOSSZ} karakter.</small>
                </label>
                <label className="auth-mezo">
                    Jelszó megerősítése
                    <input
                        type="password"
                        autoComplete="new-password"
                        value={jelszoMegerosites}
                        onChange={(event) =>
                            setJelszoMegerosites(event.target.value)
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

                <button
                    type="submit"
                    className="auth-gomb"
                    disabled={kuldes}
                >
                    {kuldes ? 'Regisztráció…' : 'Regisztráció'}
                </button>

                <p className="auth-lablec">
                    Már van fiókod? <Link to="/login">Bejelentkezés</Link>
                </p>
            </form>
        </div>
    );
};

export default Register;
