import { szazalek } from '../../utils/dashboardFormazas';

// Előző időszakhoz mért változás: irány nyíllal és előjellel, nem csak színnel.
const Valtozas = ({ ertek, osszevetes }) => {
    if (ertek === null || ertek === undefined) {
        return <span className="db-valtozas db-valtozas--semleges">Nincs előző adat az összevetéshez</span>;
    }

    const irany = ertek > 0 ? 'fel' : ertek < 0 ? 'le' : 'semleges';
    const jel = { fel: '▲', le: '▼', semleges: '■' }[irany];
    const elojel = ertek > 0 ? '+' : ertek < 0 ? '−' : '';

    return (
        <span className={`db-valtozas db-valtozas--${irany}`}>
            <span aria-hidden="true">{jel}</span>
            <strong>{elojel}{szazalek(Math.abs(ertek))}</strong>
            <span className="db-valtozas-mihez">vs. {osszevetes}</span>
        </span>
    );
};

export default Valtozas;
