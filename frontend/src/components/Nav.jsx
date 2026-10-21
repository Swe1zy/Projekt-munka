import { Link } from 'react-router-dom';
import './Nav.css';

const Nav = () => {
    return (
        <div className="nav-kontener">
            <Link
                to="/"
                className="item1"
            >
                Főoldal
            </Link>
            <Link
                to="/termekek"
                className="item2"
            >
                Teremékek
            </Link>
            <Link
                to="/register"
                className="item3"
            >
                Regisztráció
            </Link>
            <Link
                to="/login"
                className="item4"
            >
                Bejelentkezés
            </Link>
            <Link
                to="/logout"
                className="item5"
            >
                Kilépés
            </Link>
        </div>
    );
};

export default Nav;