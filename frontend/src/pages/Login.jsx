import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
    const { user, login } = useAuth();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [jelszo, setJelszo] = useState('');
    const [hiba, setHiba] = useState('');
    const [kuldes, setKuldes] = useState(false);

    if (user) {
        return (
            <Navigate
                to={location.state?.from ?? '/'}
                replace
            />
        );
    }

    const bekuld = async (event) => {
        event.preventDefault();
        setHiba('');
        setKuldes(true);

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, jelszo }),
            });

            const valasz = await response.json();

            if (response.ok) login(valasz.user);
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
                <h1>Bejelentkezés</h1>
                <p className="auth-leiras">
                    Add meg az adataidat a belépéshez.
                </p>

                {location.state?.uzenet && (
                    <p
                        className="auth-uzenet auth-siker"
                        role="status"
                    >
                        {location.state.uzenet}
                    </p>
                )}

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
                        autoComplete="current-password"
                        value={jelszo}
                        onChange={(event) => setJelszo(event.target.value)}
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
                    {kuldes ? 'Belépés…' : 'Belépés'}
                </button>

                <p className="auth-lablec">
                    Még nincs fiókod? <Link to="/register">Regisztráció</Link>
                </p>
            </form>
        </div>
    );
};

export default Login;
