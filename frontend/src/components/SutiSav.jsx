import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    TAJEKOZTATAS_SUTI,
    TAJEKOZTATAS_SUTI_NAPOK,
    sutiBeallit,
    sutiOlvas,
} from '../utils/sutik';
import './SutiSav.css';
import { t } from '../utils/nyelv';

// Tájékoztató sáv: az oldal csak elengedhetetlen sütiket használ, ezekhez nem kell
// hozzájárulás, a látogatót viszont tájékoztatni kell róluk.
const SutiSav = () => {
    const [lathato, setLathato] = useState(
        () => sutiOlvas(TAJEKOZTATAS_SUTI) === null,
    );

    if (!lathato) return null;

    const tudomasulVesz = () => {
        sutiBeallit(TAJEKOZTATAS_SUTI, '1', TAJEKOZTATAS_SUTI_NAPOK);
        // Ha a böngésző tiltja a sütiket, a sáv ettől még eltűnik erre a látogatásra.
        setLathato(false);
    };

    return (
        <section
            className="suti-sav"
            aria-label={t('Tájékoztatás a sütikről')}
        >
            <p>
                {t('Az oldal csak a működéséhez {kiemelt} használ (bejelentkezés, kosár, fizetés). Statisztikai vagy hirdetési sütiket nem alkalmazunk.', {
                    kiemelt: <strong>{t('elengedhetetlen sütiket')}</strong>,
                })}{' '}
                <Link to="/sutik">{t('Részletek a sütitájékoztatóban')}</Link>
            </p>
            <button
                data-teszt-sutifogadas="rendben"
                type="button"
                className="suti-sav-gomb"
                onClick={tudomasulVesz}
            >
                {t('Rendben')}
            </button>
        </section>
    );
};

export default SutiSav;
