import { Link } from 'react-router-dom';
import AllapotJelveny from '../rendeles/AllapotJelveny';
import { rendelesLink } from '../../utils/adminLinkek';
import { forint, naptariNap, szam, tomeg } from '../../utils/dashboardFormazas';

// A lejárt napú (még nyitott) rendelések egy csoportba kerülnek, a többi naponként.
const csoportositas = (rendelesek, ma) => {
    const csoportok = [];
    for (const rendeles of rendelesek) {
        const kulcs = rendeles.nap < ma ? 'lejart' : rendeles.nap;
        let csoport = csoportok.find((elem) => elem.kulcs === kulcs);
        if (!csoport) {
            csoport = { kulcs, rendelesek: [] };
            csoportok.push(csoport);
        }
        csoport.rendelesek.push(rendeles);
    }
    return csoportok;
};

const csoportCim = (kulcs, { ma, holnap }) => {
    if (kulcs === 'lejart') return 'Lejárt nap, még nyitott';
    if (kulcs === ma) return `Ma · ${naptariNap(kulcs)}`;
    if (kulcs === holnap) return `Holnap · ${naptariNap(kulcs)}`;
    return naptariNap(kulcs);
};

const rakomany = (rendeles) => [
    rendeles.sulyKg ? tomeg(rendeles.sulyKg) : null,
    rendeles.raklapok ? `${szam(rendeles.raklapok)} raklap` : null,
    rendeles.jarmu,
    rendeles.darus ? 'darus' : null,
].filter(Boolean).join(' · ');

const KozelgoAtvetelek = ({ adat }) => {
    if (!adat.rendelesek.length) {
        return <p className="db-ures">A következő 7 napra nincs kiszállítás vagy átvétel.</p>;
    }

    const csoportok = csoportositas(adat.rendelesek, adat.ma);

    return (
        <div className="db-tablazat-gorgeto">
            <table className="db-tablazat db-kozelgo">
                <thead>
                    <tr>
                        <th scope="col">Átvétel</th>
                        <th scope="col">Vevő</th>
                        <th scope="col">Rakomány</th>
                        <th scope="col">Állapot</th>
                        <th scope="col" className="db-szam">Végösszeg</th>
                    </tr>
                </thead>
                {csoportok.map((csoport) => {
                    const kiszallitasok = csoport.rendelesek.filter((elem) => elem.atvetelModja === 'hazhozszallitas');
                    const osszTomeg = kiszallitasok.reduce((osszeg, elem) => osszeg + elem.sulyKg, 0);
                    return (
                        <tbody key={csoport.kulcs} className={csoport.kulcs === 'lejart' ? 'db-kozelgo--lejart' : undefined}>
                            <tr className="db-kozelgo-fej">
                                <th scope="rowgroup" colSpan={5}>
                                    <span>{csoportCim(csoport.kulcs, adat)}</span>
                                    <small>
                                        {szam(kiszallitasok.length)} kiszállítás
                                        {osszTomeg > 0 && ` (${tomeg(osszTomeg)})`}
                                        {' · '}{szam(csoport.rendelesek.length - kiszallitasok.length)} személyes átvétel
                                    </small>
                                </th>
                            </tr>
                            {csoport.rendelesek.map((rendeles) => (
                                <tr key={rendeles.id}>
                                    <td>
                                        <span className="db-cella-fo">{rendeles.atvetelCimke}</span>
                                        <span className="db-cella-mellek">
                                            {csoport.kulcs === 'lejart' ? naptariNap(rendeles.nap) : rendeles.idosavCimke ?? 'nyitvatartás alatt'}
                                        </span>
                                    </td>
                                    <td>
                                        <Link className="db-cella-fo db-link" to={rendelesLink(rendeles)}>{rendeles.nev}</Link>
                                        <span className="db-cella-mellek">
                                            #{rendeles.rovidAzonosito}{rendeles.telepules && ` · ${rendeles.telepules}`} · {szam(rendeles.tetelSzam)} tétel
                                        </span>
                                    </td>
                                    <td className="db-cella-mellek">{rakomany(rendeles) || '–'}</td>
                                    <td><AllapotJelveny allapot={rendeles.allapot} cimke={rendeles.allapotCimke} /></td>
                                    <td className="db-szam db-nowrap">
                                        <span className="db-cella-fo">{forint(rendeles.vegosszeg)}</span>
                                        <span className={`db-cella-mellek${rendeles.fizetve ? '' : ' db-figyelmeztetes-szoveg'}`}>
                                            {rendeles.fizetve ? 'fizetve' : 'nincs fizetve'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    );
                })}
            </table>
        </div>
    );
};

export default KozelgoAtvetelek;
