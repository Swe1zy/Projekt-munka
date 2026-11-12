import { forint, szam, szazalek } from '../../utils/dashboardFormazas';

// Vékony szegmentált sáv (egy egész részei) + soronként a pontos számok.
// A színt mindig a mellette álló név és szám egészíti ki.
const MegoszlasSav = ({ cim, reszek }) => {
    const osszes = reszek.reduce((sum, resz) => sum + resz.rendelesek, 0);
    const leiras = reszek
        .map((resz) => `${resz.cimke}: ${szam(resz.rendelesek)} rendelés (${szazalek(resz.arany)})`)
        .join(', ');

    return (
        <div className="db-megoszlas">
            <h3>{cim}</h3>
            <div className="db-megoszlas-sav" role="img" aria-label={osszes ? `${cim} – ${leiras}` : `${cim} – nincs adat`}>
                {osszes === 0 ? (
                    <span className="db-megoszlas-ures" />
                ) : (
                    reszek.map((resz, index) => (resz.rendelesek > 0 ? (
                        <span
                            key={resz.kulcs}
                            className={`db-megoszlas-resz db-sorozat-${index + 1}`}
                            style={{ flexGrow: resz.rendelesek }}
                            title={`${resz.cimke}: ${szam(resz.rendelesek)} rendelés (${szazalek(resz.arany)})`}
                        />
                    ) : null))
                )}
            </div>
            <ul className="db-megoszlas-lista">
                {reszek.map((resz, index) => (
                    <li key={resz.kulcs}>
                        <span className={`db-jelmagyarazat db-sorozat-${index + 1}`} aria-hidden="true" />
                        <span className="db-megoszlas-nev">{resz.cimke}</span>
                        <span className="db-megoszlas-szam">
                            <strong>{szam(resz.rendelesek)}</strong> rendelés · {szazalek(resz.arany)}
                        </span>
                        <span className="db-megoszlas-bevetel">{forint(resz.bevetel)}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default MegoszlasSav;
