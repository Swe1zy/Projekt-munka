import { forint, szam } from '../../utils/dashboardFormazas';

// A vevőnél lévő raklapok és a rájuk visszajáró betétdíj összesítése.
const RaklapEgyenleg = ({ egyenleg }) => {
    if (!egyenleg || egyenleg.kintLevoRaklapok + egyenleg.visszahozottRaklapok === 0) return null;

    return (
        <section
            className="raklap-egyenleg"
            aria-labelledby="raklap-egyenleg-cim"
        >
            <div className="raklap-egyenleg-fej">
                <h3 id="raklap-egyenleg-cim">Raklap-betétdíj egyenleg</h3>
                <p>
                    {egyenleg.kintLevoRaklapok > 0
                        ? 'A sérülésmentes raklapokat a telephelyen visszavesszük, és a betétdíjat visszaadjuk.'
                        : 'Minden raklapot visszahoztál, nincs nálad betétdíjas raklap.'}
                </p>
            </div>
            <dl className="raklap-egyenleg-szamok">
                <div>
                    <dt>Nálad lévő raklap</dt>
                    <dd>{szam(egyenleg.kintLevoRaklapok)} db</dd>
                </div>
                <div className="raklap-egyenleg-kiemelt">
                    <dt>Visszahozáskor visszajár</dt>
                    <dd>{forint(egyenleg.visszakaphatoBetetdij)}</dd>
                </div>
                <div>
                    <dt>Eddig visszahozott</dt>
                    <dd>
                        {szam(egyenleg.visszahozottRaklapok)} db
                        {egyenleg.visszakapottBetetdij > 0 && <small> · {forint(egyenleg.visszakapottBetetdij)}</small>}
                    </dd>
                </div>
            </dl>
        </section>
    );
};

export default RaklapEgyenleg;
