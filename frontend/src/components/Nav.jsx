import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Nav.css';

const ikonUtak = {
    felhasznalo: (
        <>
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle
                cx="12"
                cy="7"
                r="4"
            />
        </>
    ),
    profil: (
        <>
            <circle
                cx="12"
                cy="12"
                r="10"
            />
            <circle
                cx="12"
                cy="10"
                r="3"
            />
            <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
        </>
    ),
    belepes: (
        <>
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <path d="m10 17 5-5-5-5" />
            <path d="M15 12H3" />
        </>
    ),
    regisztracio: (
        <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle
                cx="9"
                cy="7"
                r="4"
            />
            <path d="M19 8v6" />
            <path d="M22 11h-6" />
        </>
    ),
    kilepes: (
        <>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
        </>
    ),
};

const Ikon = ({ nev }) => {
    return (
        <svg
            className="nav-ikon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {ikonUtak[nev]}
        </svg>
    );
};

const Nav = () => {
    const { user } = useAuth();
    const { pathname } = useLocation();
    const [nyitva, setNyitva] = useState(false);
    const [elozoUtvonal, setElozoUtvonal] = useState(pathname);
    const fiokRef = useRef(null);
    const gombRef = useRef(null);

    // Oldalváltáskor (pl. böngésző vissza gombja) a menü becsukódik.
    if (elozoUtvonal !== pathname) {
        setElozoUtvonal(pathname);
        setNyitva(false);
    }

    useEffect(() => {
        if (!nyitva) return;

        const kivulKattintas = (event) => {
            if (!fiokRef.current?.contains(event.target)) setNyitva(false);
        };
        const billentyu = (event) => {
            if (event.key === 'Escape') {
                setNyitva(false);
                gombRef.current?.focus();
            }
        };

        document.addEventListener('pointerdown', kivulKattintas);
        document.addEventListener('focusin', kivulKattintas);
        document.addEventListener('keydown', billentyu);

        return () => {
            document.removeEventListener('pointerdown', kivulKattintas);
            document.removeEventListener('focusin', kivulKattintas);
            document.removeEventListener('keydown', billentyu);
        };
    }, [nyitva]);

    const kezdobetu = (user?.nev || user?.email || '?')
        .trim()
        .charAt(0)
        .toUpperCase();

    return (
        <nav
            className="nav-kontener"
            aria-label="Főmenü"
        >
            <div className="nav-linkek">
                <NavLink
                    to="/"
                    end
                >
                    Főoldal
                </NavLink>
                <NavLink to="/termekek">Termékek</NavLink>
                {user?.role === 'admin' && <NavLink to="/admin/termekek">Termékkezelés</NavLink>}
            </div>

            <div
                className="nav-fiok"
                ref={fiokRef}
            >
                <button
                    type="button"
                    className="nav-fiok-gomb"
                    ref={gombRef}
                    aria-label={user ? `Fiók: ${user.nev}` : 'Fiók'}
                    aria-expanded={nyitva}
                    aria-controls="nav-fiok-menu"
                    onClick={() => setNyitva((elozo) => !elozo)}
                >
                    {user ? (
                        <span className="nav-avatar">{kezdobetu}</span>
                    ) : (
                        <Ikon nev="felhasznalo" />
                    )}
                </button>

                {nyitva && (
                    <div
                        id="nav-fiok-menu"
                        className="nav-fiok-menu"
                        onClick={() => setNyitva(false)}
                    >
                        {user ? (
                            <>
                                <div className="nav-fiok-fej">
                                    <span className="nav-avatar">
                                        {kezdobetu}
                                    </span>
                                    <div className="nav-fiok-adatok">
                                        <strong>{user.nev}</strong>
                                        <small>{user.email}</small>
                                    </div>
                                </div>
                                <NavLink
                                    to="/profil"
                                    className="nav-fiok-elem"
                                >
                                    <Ikon nev="profil" />
                                    Profilom
                                </NavLink>
                                <hr className="nav-fiok-elv" />
                                <NavLink
                                    to="/logout"
                                    className="nav-fiok-elem nav-fiok-kilep"
                                >
                                    <Ikon nev="kilepes" />
                                    Kilépés
                                </NavLink>
                            </>
                        ) : (
                            <>
                                <NavLink
                                    to="/login"
                                    className="nav-fiok-elem"
                                >
                                    <Ikon nev="belepes" />
                                    Bejelentkezés
                                </NavLink>
                                <NavLink
                                    to="/register"
                                    className="nav-fiok-elem"
                                >
                                    <Ikon nev="regisztracio" />
                                    Regisztráció
                                </NavLink>
                            </>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Nav;
