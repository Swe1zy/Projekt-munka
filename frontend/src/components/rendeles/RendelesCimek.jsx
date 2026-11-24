import { napCimke } from '../../utils/beallitasok';
import { atvetelModCimke } from '../../utils/rendelesCimkek';
import './Rendeles.css';
import { t } from '../../utils/nyelv';

const RendelesCimek = ({ rendeles }) => {
    const szamlazas = rendeles.szamlazasiAdatok;
    const szallitas = rendeles.szallitasiAdatok;

    return (
        <>
            <address className="rendeles-cim">
                <h4>{t('Számlázás')}</h4>
                <strong>{szamlazas.nev}</strong>
                <span>{szamlazas.tipus === 'ceg' ? t('Cég · adószám: {adoszam}', { adoszam: szamlazas.adoszam }) : t('Magánszemély')}</span>
                <span>{szamlazas.iranyitoszam} {szamlazas.telepules}, {szamlazas.utca}</span>
                {rendeles.telefon && <span>{t('Tel.:')} <a href={`tel:${rendeles.telefon.replace(/[^\d+]/g, '')}`}>{rendeles.telefon}</a></span>}
                {szamlazas.megjegyzes && <span>{t('Megjegyzés:')} {szamlazas.megjegyzes}</span>}
            </address>
            <address className="rendeles-cim">
                <h4>{atvetelModCimke(rendeles.atvetelModja, rendeles.atvetelCimke)}</h4>
                {rendeles.atvetelNapja && (
                    <span className="rendeles-idopont">
                        {napCimke(rendeles.atvetelNapja)}{rendeles.idosavCimke ? `, ${rendeles.idosavCimke}` : ''}
                    </span>
                )}
                {szallitas ? (
                    <>
                        <strong>{szallitas.atvevoNev}</strong>
                        <span>{szallitas.iranyitoszam} {szallitas.telepules}, {szallitas.utca}</span>
                        {szallitas.megjegyzes && <span>{t('Futárnak:')} {szallitas.megjegyzes}</span>}
                        {szallitas.behajtas && <span>{t('Behajtás, lerakodás:')} {szallitas.behajtas}</span>}
                    </>
                ) : (
                    <span>{t('Átvétel a telephelyen')}</span>
                )}
            </address>
        </>
    );
};

export default RendelesCimek;
