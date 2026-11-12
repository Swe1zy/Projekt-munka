import { forint, szam } from '../../utils/dashboardFormazas';
import './Rendeles.css';

const TetelLista = ({ tetelek, vegosszeg, osszegCimke = 'Végösszeg' }) => (
    <div className="rendeles-tetelek">
        <table>
            <thead>
                <tr>
                    <th scope="col">Termék</th>
                    <th scope="col" className="rendeles-szam">Mennyiség</th>
                    <th scope="col" className="rendeles-szam">Egységár</th>
                    <th scope="col" className="rendeles-szam">Összeg</th>
                </tr>
            </thead>
            <tbody>
                {tetelek.map((tetel) => (
                    <tr key={tetel.termekId}>
                        <td>{tetel.nev}</td>
                        <td className="rendeles-szam">{szam(tetel.mennyiseg)} {tetel.egyseg}</td>
                        <td className="rendeles-szam">{forint(tetel.egysegar)}</td>
                        <td className="rendeles-szam">{forint(tetel.osszeg)}</td>
                    </tr>
                ))}
            </tbody>
            <tfoot>
                <tr>
                    <th scope="row" colSpan={3}>{osszegCimke}</th>
                    <td className="rendeles-szam">{forint(vegosszeg)}</td>
                </tr>
            </tfoot>
        </table>
    </div>
);

export default TetelLista;
