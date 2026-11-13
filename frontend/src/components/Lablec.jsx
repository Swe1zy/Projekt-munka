import { Link } from 'react-router-dom';
import './Lablec.css';

const Lablec = () => {
    return (
        <footer className="lablec">
            <p>© {new Date().getFullYear()} Tüzép</p>
            <nav
                className="lablec-linkek"
                aria-label="Jogi információk"
            >
                <Link to="/aszf">Általános Szerződési Feltételek</Link>
                <Link to="/sutik">Sütitájékoztató</Link>
            </nav>
        </footer>
    );
};

export default Lablec;
