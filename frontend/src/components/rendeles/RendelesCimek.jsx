import { napCimke } from '../../utils/beallitasok';
import './Rendeles.css';

const RendelesCimek = ({ rendeles }) => {
    const szamlazas = rendeles.szamlazasiAdatok;
    const szallitas = rendeles.szallitasiAdatok;

    return (
        <>
            <address className="rendeles-cim">
                <h4>Számlázás</h4>
                <strong>{szamlazas.nev}</strong>
                <span>{szamlazas.tipus === 'ceg' ? `Cég · adószám: ${szamlazas.adoszam}` : 'Magánszemély'}</span>
                <span>{szamlazas.iranyitoszam} {szamlazas.telepules}, {szamlazas.utca}</span>
                {szamlazas.megjegyzes && <span>Megjegyzés: {szamlazas.megjegyzes}</span>}
            </address>
            <address className="rendeles-cim">
                <h4>{rendeles.atvetelCimke}</h4>
                {rendeles.atvetelNapja && (
                    <span className="rendeles-idopont">
                        {napCimke(rendeles.atvetelNapja)}{rendeles.idosavCimke ? `, ${rendeles.idosavCimke}` : ''}
                    </span>
                )}
                {szallitas ? (
                    <>
                        <strong>{szallitas.atvevoNev}</strong>
                        <span>{szallitas.iranyitoszam} {szallitas.telepules}, {szallitas.utca}</span>
                        {szallitas.megjegyzes && <span>Futárnak: {szallitas.megjegyzes}</span>}
                    </>
                ) : (
                    <span>Átvétel a telephelyen</span>
                )}
            </address>
        </>
    );
};

export default RendelesCimek;
