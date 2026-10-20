import { Link } from 'react-router-dom';
import './Nav.css';

const Nav = () => {
    return (
        <div className="nav-kontener">
            <Link to="/">Főoldal</Link>
        </div>
    );
};

export default Nav;