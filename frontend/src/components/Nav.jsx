import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
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
    rendelesek: (
        <>
            <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
            <path d="m3 8 9 5 9-5" />
            <path d="M12 13v8" />
        </>
    ),
    kosar: (
        <>
            <circle
                cx="9"
                cy="21"
                r="1"
            />
            <circle
                cx="20"
                cy="21"
                r="1"
            />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
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
    const { tetelek } = useCart();
    const kosarTetelSzam = tetelek.length;
    const { pathname } = useLocation();
    const [nyitva, setNyitva] = useState(false);
    const [mobilNyitva, setMobilNyitva] = useState(false);
    const [elozoUtvonal, setElozoUtvonal] = useState(pathname);
    const fiokRef = useRef(null);
    const gombRef = useRef(null);

    // Oldalváltáskor (pl. böngésző vissza gombja) a menük becsukódnak.
    if (elozoUtvonal !== pathname) {
        setElozoUtvonal(pathname);
        setNyitva(false);
        setMobilNyitva(false);
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

    useEffect(() => {
        if (!mobilNyitva) return;

        const billentyu = (event) => {
            if (event.key === 'Escape') setMobilNyitva(false);
        };

        document.addEventListener('keydown', billentyu);
        return () => document.removeEventListener('keydown', billentyu);
    }, [mobilNyitva]);

    const kezdobetu = (user?.nev || user?.email || '?')
        .trim()
        .charAt(0)
        .toUpperCase();

    // Bejelentkezett felhasználónál a fiók jobbra kerül, vendégnél a bal oldalra,
    // mert jobbra a regisztráció és a bejelentkezés gomb kerül.
    const fiokElem = (
        <div
            className="nav-fiok"
            ref={fiokRef}
        >
            <button
                data-teszt-profil="profil"
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
                            <NavLink
                                to="/profil#rendeleseim"
                                className="nav-fiok-elem"
                                end
                            >
                                <Ikon nev="rendelesek" />
                                Rendeléseim
                            </NavLink>
                            <hr className="nav-fiok-elv" />
                            <NavLink
                                data-teszt-kijelentkezes="kijelentkezes"
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
                                data-teszt-belepes="bejelentkezes"
                                to="/login"
                                className="nav-fiok-elem"
                            >
                                <Ikon nev="belepes" />
                                Bejelentkezés
                            </NavLink>
                            <NavLink
                                data-teszt-reg="regisztracio"
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
    );

    return (
        <nav
            className={`nav-kontener${user ? '' : ' nav-kontener--vendeg'}`}
            aria-label="Főmenü"
        >
            {!user && <div className="nav-bal">{fiokElem}</div>}

            <div className="nav-linkek">
                <NavLink
                    to="/"
                    end
                >
                    Főoldal
                </NavLink>
                <NavLink to="/termekek">Termékek</NavLink>
                <NavLink to="/kalkulator">Kalkulátor</NavLink>
                {/* A rendelések, árajánlatok és a termékkezelés a dashboardról érhető el,
                    ezért az admin aloldalakon is a Dashboard menüpont marad kiemelve. */}
                {user?.role === 'admin' && (
                    <NavLink
                        to="/admin/dashboard"
                        className={({ isActive }) => (isActive || pathname.startsWith('/admin/') ? 'nav-link--aktiv' : undefined)}
                    >
                        Dashboard
                    </NavLink>
                )}
            </div>

            <div
                className="nav-mobil-menu"
                id="nav-mobil-menu"
                hidden={!mobilNyitva}
            >
                <NavLink to="/" end onClick={() => setMobilNyitva(false)}>Főoldal</NavLink>
                <NavLink to="/termekek" onClick={() => setMobilNyitva(false)}>Termékek</NavLink>
                <NavLink to="/kalkulator" onClick={() => setMobilNyitva(false)}>Kalkulátor</NavLink>
                {user?.role === 'admin' && (
                    <NavLink to="/admin/dashboard" onClick={() => setMobilNyitva(false)}>Dashboard</NavLink>
                )}
            </div>

            <div className="nav-jobb">
                {/* A kosár gomb csak bejelentkezett felhasználónak látszik */}
                {user && (
                    <NavLink
                        to="/kosar"
                        className="nav-kosar-gomb"
                        aria-label={
                            kosarTetelSzam > 0 ? `Kosár, ${kosarTetelSzam} féle termék` : 'Kosár'
                        }
                    >
                        <Ikon nev="kosar" />
                        {kosarTetelSzam > 0 && (
                            <span
                                className="nav-kosar-darab"
                                aria-hidden="true"
                            >
                                {kosarTetelSzam > 99 ? '99+' : kosarTetelSzam}
                            </span>
                        )}
                    </NavLink>
                )}

                {!user && (
                    <>
                        <NavLink
                            data-teszt-noprofilreg="regisztracio"
                            to="/register"
                            className="nav-auth-gomb nav-auth-gomb--kiemelt"
                            aria-label="Regisztráció"
                        >
                            <Ikon nev="regisztracio" />
                            <span className="nav-auth-szoveg">Regisztráció</span>
                        </NavLink>
                        <NavLink
                            data-teszt-noprofilbelepes="bejelentkezes"
                            to="/login"
                            className="nav-auth-gomb"
                            aria-label="Bejelentkezés"
                        >
                            <Ikon nev="belepes" />
                            <span className="nav-auth-szoveg">Bejelentkezés</span>
                        </NavLink>
                    </>
                )}

                {user && fiokElem}

                <button
                    type="button"
                    className="nav-mobil-gomb"
                    aria-label={mobilNyitva ? 'Menü bezárása' : 'Menü megnyitása'}
                    aria-expanded={mobilNyitva}
                    aria-controls="nav-mobil-menu"
                    onClick={() => setMobilNyitva((elozo) => !elozo)}
                >
                    <span aria-hidden="true">{mobilNyitva ? '×' : '☰'}</span>
                </button>
            </div>
        </nav>
    );
};

export default Nav;
