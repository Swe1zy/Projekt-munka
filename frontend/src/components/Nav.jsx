import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Nav.css';

const Nav = () => {
    const { user } = useAuth();

    return (
        <nav
            className="nav-kontener"
            aria-label="Főmenü"
        >
            <NavLink
                to="/"
                end
                className="item1"
            >
                Főoldal
            </NavLink>
            <NavLink
                to="/termekek"
                className="item2"
            >
                Termékek
            </NavLink>
            {user ? (
                <NavLink
                    to="/logout"
                    className="item5"
                >
                    Kilépés
                </NavLink>
            ) : (
                <>
                    <NavLink
                        to="/register"
                        className="item3"
                    >
                        Regisztráció
                    </NavLink>
                    <NavLink
                        to="/login"
                        className="item4"
                    >
                        Bejelentkezés
                    </NavLink>
                </>
            )}
        </nav>
    );
};

export default Nav;
