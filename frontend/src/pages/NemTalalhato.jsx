import { Link } from 'react-router-dom';
import './FizetesEredmeny.css';
import { t } from '../utils/nyelv';

// Ismeretlen útvonal (pl. elírt vagy elavult link).
const NemTalalhato = () => (
    <main className="fizetes-eredmeny-oldal">
        <section className="fizetes-eredmeny-kartya">
            <span className="fizetes-eredmeny-ikon hiba" aria-hidden="true">?</span>
            <span className="fizetes-eredmeny-felirat">404</span>
            <h1>{t('Az oldal nem található')}</h1>
            <p>{t('A keresett oldal nem létezik, vagy időközben megszűnt.')}</p>
            <Link className="fizetes-eredmeny-gomb" to="/termekek">{t('Tovább a termékekhez')}</Link>
        </section>
    </main>
);

export default NemTalalhato;
