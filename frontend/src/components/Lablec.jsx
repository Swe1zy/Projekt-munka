import { Link } from 'react-router-dom';
import './Lablec.css';
import { t } from '../utils/nyelv';

const Lablec = () => {
    return (
        <footer className="lablec">
            <p>© {new Date().getFullYear()} Tüzép</p>
            <nav
                className="lablec-linkek"
                aria-label={t('Jogi információk')}
            >
                <Link to="/aszf">{t('Általános Szerződési Feltételek')}</Link>
                <Link to="/sutik">{t('Sütitájékoztató')}</Link>
            </nav>
        </footer>
    );
};

export default Lablec;
