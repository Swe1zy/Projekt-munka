import { forint, szam } from '../../utils/dashboardFormazas';
import './Arazas.css';

/**
 * A végösszeg összetevői: termékek, céges kedvezmény, szállítás (zóna, jármű,
 * fordulók), darus pótdíj, raklap-betétdíj. A pénztár, a kosár és a rendelés
 * részletei is ezt használják.
 *  - szallitasHelyett: szöveg, ha a szállítás még nem számolható (pl. hiányzó cím)
 *  - vegosszegCimke: pl. „Fizetendő” vagy „Összesen (szállítás nélkül)”
 */
const OsszesitoSorok = ({ osszesites, atvetelModja, szallitasHelyett, vegosszegCimke = 'Végösszeg', visszajaroBetetdij = 0 }) => {
    if (!osszesites) return null;
    const szallitas = osszesites.szallitas;

    return (
        <dl className="arazas-sorok">
            <div>
                <dt>Termékek</dt>
                <dd>{forint(osszesites.termekOsszeg)}</dd>
            </div>
            {osszesites.kedvezmeny > 0 && (
                <div className="arazas-kedvezmeny">
                    <dt>Céges mennyiségi kedvezmény ({szam(osszesites.kedvezmenySzazalek)}%)</dt>
                    <dd>−{forint(osszesites.kedvezmeny)}</dd>
                </div>
            )}
            {atvetelModja === 'szemelyes_atvetel' ? (
                <div>
                    <dt>Személyes átvétel</dt>
                    <dd>0 Ft</dd>
                </div>
            ) : szallitas ? (
                <>
                    <div>
                        <dt>
                            Szállítás
                            <small>
                                {szallitas.zonaNev} · {szallitas.jarmu}
                                {szallitas.fuvarok > 1 ? `, ${szam(szallitas.fuvarok)} forduló` : ''} · {szam(osszesites.sulyKg)} kg
                            </small>
                        </dt>
                        <dd>{forint(szallitas.alapdij)}</dd>
                    </div>
                    {szallitas.darus && (
                        <div>
                            <dt>Darus lerakodás</dt>
                            <dd>{forint(szallitas.darusPotdij)}</dd>
                        </div>
                    )}
                </>
            ) : (
                <div>
                    <dt>Szállítás</dt>
                    <dd className="arazas-fuggo">{szallitasHelyett ?? 'a cím alapján'}</dd>
                </div>
            )}
            {osszesites.raklapBetetdij > 0 && (
                <div>
                    <dt>
                        Raklap-betétdíj ({szam(osszesites.raklapok)} raklap)
                        <small>A raklapok visszahozásakor visszajár.</small>
                    </dt>
                    <dd>{forint(osszesites.raklapBetetdij)}</dd>
                </div>
            )}
            <div className="arazas-vegosszeg">
                <dt>{vegosszegCimke}</dt>
                <dd>{forint(osszesites.vegosszeg)}</dd>
            </div>
            {visszajaroBetetdij > 0 && (
                <div className="arazas-visszajaro">
                    <dt>Visszajáró betétdíj</dt>
                    <dd>{forint(visszajaroBetetdij)}</dd>
                </div>
            )}
        </dl>
    );
};

export default OsszesitoSorok;
