import { forint, szam } from '../../utils/dashboardFormazas';
import './Arazas.css';
import { t } from '../../utils/nyelv';

/**
 * A végösszeg összetevői: termékek, céges kedvezmény, szállítás (zóna, jármű,
 * fordulók), darus pótdíj, raklap-betétdíj. A pénztár, a kosár és a rendelés
 * részletei is ezt használják.
 *  - szallitasHelyett: szöveg, ha a szállítás még nem számolható (pl. hiányzó cím)
 *  - vegosszegCimke: pl. „Fizetendő” vagy „Összesen (szállítás nélkül)”
 */
const OsszesitoSorok = ({ osszesites, atvetelModja, szallitasHelyett, vegosszegCimke, visszajaroBetetdij = 0 }) => {
    if (!osszesites) return null;
    const vegosszegFelirat = vegosszegCimke ?? t('Végösszeg');
    const szallitas = osszesites.szallitas;

    return (
        <dl className="arazas-sorok">
            <div>
                <dt>{t('Termékek')}</dt>
                <dd>{forint(osszesites.termekOsszeg)}</dd>
            </div>
            {osszesites.kedvezmeny > 0 && (
                <div className="arazas-kedvezmeny">
                    <dt>{t('Céges mennyiségi kedvezmény ({szazalek}%)', { szazalek: szam(osszesites.kedvezmenySzazalek) })}</dt>
                    <dd>−{forint(osszesites.kedvezmeny)}</dd>
                </div>
            )}
            {atvetelModja === 'szemelyes_atvetel' ? (
                <div>
                    <dt>{t('Személyes átvétel')}</dt>
                    <dd>{forint(0)}</dd>
                </div>
            ) : szallitas ? (
                <>
                    <div>
                        <dt>
                            {t('Szállítás')}
                            <small>
                                {szallitas.zonaNev} · {szallitas.jarmu}
                                {szallitas.fuvarok > 1 ? `, ${t('{db} forduló', { db: szam(szallitas.fuvarok) })}` : ''} · {szam(osszesites.sulyKg)} kg
                            </small>
                        </dt>
                        <dd>{forint(szallitas.alapdij)}</dd>
                    </div>
                    {szallitas.darus && (
                        <div>
                            <dt>{t('Darus lerakodás')}</dt>
                            <dd>{forint(szallitas.darusPotdij)}</dd>
                        </div>
                    )}
                </>
            ) : (
                <div>
                    <dt>{t('Szállítás')}</dt>
                    <dd className="arazas-fuggo">{szallitasHelyett ?? t('a cím alapján')}</dd>
                </div>
            )}
            {osszesites.raklapBetetdij > 0 && (
                <div>
                    <dt>
                        {t('Raklap-betétdíj ({db} raklap)', { db: szam(osszesites.raklapok) })}
                        <small>{t('A raklapok visszahozásakor visszajár.')}</small>
                    </dt>
                    <dd>{forint(osszesites.raklapBetetdij)}</dd>
                </div>
            )}
            <div className="arazas-vegosszeg">
                <dt>{vegosszegFelirat}</dt>
                <dd>{forint(osszesites.vegosszeg)}</dd>
            </div>
            {visszajaroBetetdij > 0 && (
                <div className="arazas-visszajaro">
                    <dt>{t('Visszajáró betétdíj')}</dt>
                    <dd>{forint(visszajaroBetetdij)}</dd>
                </div>
            )}
        </dl>
    );
};

export default OsszesitoSorok;
