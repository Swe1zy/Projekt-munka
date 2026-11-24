import { forint, szam } from '../../utils/dashboardFormazas';
import { egysegNev } from '../../utils/termek';
import './Rendeles.css';
import { t } from '../../utils/nyelv';

const TetelLista = ({ tetelek, vegosszeg, osszegCimke }) => (
    <div className="rendeles-tetelek">
        <table>
            <thead>
                <tr>
                    <th scope="col">{t('Termék')}</th>
                    <th scope="col" className="rendeles-szam">{t('Mennyiség')}</th>
                    <th scope="col" className="rendeles-szam">{t('Egységár')}</th>
                    <th scope="col" className="rendeles-szam">{t('Összeg')}</th>
                </tr>
            </thead>
            <tbody>
                {tetelek.map((tetel) => (
                    <tr key={tetel.termekId}>
                        <td>{tetel.nev}</td>
                        <td className="rendeles-szam">{szam(tetel.mennyiseg)} {egysegNev(tetel.egyseg)}</td>
                        <td className="rendeles-szam">{forint(tetel.egysegar)}</td>
                        <td className="rendeles-szam">{forint(tetel.osszeg)}</td>
                    </tr>
                ))}
            </tbody>
            <tfoot>
                <tr>
                    <th scope="row" colSpan={3}>{osszegCimke ?? t('Végösszeg')}</th>
                    <td className="rendeles-szam">{forint(vegosszeg)}</td>
                </tr>
            </tfoot>
        </table>
    </div>
);

export default TetelLista;
