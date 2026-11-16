import { szam } from '../../utils/dashboardFormazas';

const NAPOK = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
const ORAK = Array.from({ length: 24 }, (_, ora) => ora);

// Hét × óra hőtérkép a rendelések számáról. A cellák színe egyetlen (zöld) skála
// erőssége; a pontos szám a cella feliratában (title) és képernyőolvasónak rejtett szövegben van.
const Hoterkep = ({ adat }) => {
    const { napok, max } = adat;
    if (!max) return <p className="db-ures">Ebben az időszakban nem érkezett rendelés.</p>;

    let csucs = { nap: 0, ora: 0, db: 0 };
    napok.forEach((sor, nap) => sor.forEach((db, ora) => {
        if (db > csucs.db) csucs = { nap, ora, db };
    }));
    const napOsszegek = napok.map((sor) => sor.reduce((osszeg, db) => osszeg + db, 0));
    const legjobbNap = napOsszegek.indexOf(Math.max(...napOsszegek));
    const oraOsszegek = ORAK.map((ora) => napok.reduce((osszeg, sor) => osszeg + sor[ora], 0));
    const osszes = napOsszegek.reduce((osszeg, db) => osszeg + db, 0);
    const delelott = oraOsszegek.slice(0, 12).reduce((osszeg, db) => osszeg + db, 0);

    return (
        <div className="db-hoterkep">
            <p className="db-hoterkep-osszegzes">
                Legtöbb rendelés: <strong>{NAPOK[csucs.nap].toLowerCase()} {csucs.ora}–{csucs.ora + 1} óra</strong> ({szam(csucs.db)} db).
                {' '}Legforgalmasabb nap: <strong>{NAPOK[legjobbNap].toLowerCase()}</strong> ({szam(napOsszegek[legjobbNap])} db).
                {' '}Délelőtt érkezett a rendelések {szam(Math.round((delelott / osszes) * 100))}%-a.
            </p>
            <div className="db-tablazat-gorgeto">
                <table className="db-hoterkep-tabla">
                    <caption className="db-rejtett">Rendelések száma a hét napjai és a nap órái szerint (magyar idő)</caption>
                    <thead>
                        <tr>
                            <td />
                            {ORAK.map((ora) => (
                                <th key={ora} scope="col">
                                    <span aria-hidden="true">{ora % 3 === 0 ? ora : ''}</span>
                                    <span className="db-rejtett">{ora} óra</span>
                                </th>
                            ))}
                            <th scope="col" className="db-hoterkep-ossz">Össz.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {napok.map((sor, nap) => (
                            <tr key={NAPOK[nap]}>
                                <th scope="row">
                                    <span aria-hidden="true">{NAPOK[nap].slice(0, 3)}</span>
                                    <span className="db-rejtett">{NAPOK[nap]}</span>
                                </th>
                                {sor.map((db, ora) => (
                                    <td
                                        key={ora}
                                        className={db ? 'db-hoterkep-cella' : 'db-hoterkep-cella db-hoterkep-cella--ures'}
                                        style={db ? { '--erosseg': db / max } : undefined}
                                        title={`${NAPOK[nap]} ${ora}:00–${ora + 1}:00 · ${szam(db)} rendelés`}
                                    >
                                        <span className="db-rejtett">{szam(db)}</span>
                                    </td>
                                ))}
                                <td className="db-hoterkep-ossz">{szam(napOsszegek[nap])}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="db-hoterkep-jelmagyarazat" aria-hidden="true">
                <span>Kevesebb</span>
                {[0.15, 0.4, 0.65, 1].map((erosseg) => (
                    <span key={erosseg} className="db-hoterkep-cella" style={{ '--erosseg': erosseg }} />
                ))}
                <span>Több (max. {szam(max)} / óra)</span>
            </div>
        </div>
    );
};

export default Hoterkep;
