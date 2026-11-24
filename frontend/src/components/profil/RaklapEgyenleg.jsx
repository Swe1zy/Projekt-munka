import { forint, szam } from '../../utils/dashboardFormazas';
import { t } from '../../utils/nyelv';

// A vevőnél lévő raklapok és a rájuk visszajáró betétdíj összesítése.
const RaklapEgyenleg = ({ egyenleg }) => {
    if (!egyenleg || egyenleg.kintLevoRaklapok + egyenleg.visszahozottRaklapok === 0) return null;

    return (
        <section
            className="raklap-egyenleg"
            aria-labelledby="raklap-egyenleg-cim"
        >
            <div className="raklap-egyenleg-fej">
                <h3 id="raklap-egyenleg-cim">{t('Raklap-betétdíj egyenleg')}</h3>
                <p>
                    {egyenleg.kintLevoRaklapok > 0
                        ? t('A sérülésmentes raklapokat a telephelyen visszavesszük, és a betétdíjat visszaadjuk.')
                        : t('Minden raklapot visszahoztál, nincs nálad betétdíjas raklap.')}
                </p>
            </div>
            <dl className="raklap-egyenleg-szamok">
                <div>
                    <dt>{t('Nálad lévő raklap')}</dt>
                    <dd>{szam(egyenleg.kintLevoRaklapok)} {t('db')}</dd>
                </div>
                <div className="raklap-egyenleg-kiemelt">
                    <dt>{t('Visszahozáskor visszajár')}</dt>
                    <dd>{forint(egyenleg.visszakaphatoBetetdij)}</dd>
                </div>
                <div>
                    <dt>{t('Eddig visszahozott')}</dt>
                    <dd>
                        {szam(egyenleg.visszahozottRaklapok)} {t('db')}
                        {egyenleg.visszakapottBetetdij > 0 && <small> · {forint(egyenleg.visszakapottBetetdij)}</small>}
                    </dd>
                </div>
            </dl>
        </section>
    );
};

export default RaklapEgyenleg;
