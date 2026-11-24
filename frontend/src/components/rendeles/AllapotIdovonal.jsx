import { teljesIdopont } from '../../utils/dashboardFormazas';
import { rendelesAllapotCimke } from '../../utils/rendelesCimkek';
import { AllapotIkon } from './AllapotJelveny';
import './Rendeles.css';
import { t } from '../../utils/nyelv';

const lepesCimkek = () => ({
    feldolgozasra_var: t('Beérkezett'),
    visszaigazolva: t('Visszaigazolva'),
    kiszallitas_alatt: t('Kiszállítás alatt'),
    teljesitve: t('Teljesítve'),
    lemondva: t('Lemondva'),
});

// A rendelés útja lépésenként: a megtett lépések dátummal, a hátralévők halványan.
// Lemondott rendelésnél a megtett lépések után a lemondás zárja a sort.
const AllapotIdovonal = ({ rendeles }) => {
    const tervezettLepesek = rendeles.atvetelModja === 'hazhozszallitas'
        ? ['feldolgozasra_var', 'visszaigazolva', 'kiszallitas_alatt', 'teljesitve']
        : ['feldolgozasra_var', 'visszaigazolva', 'teljesitve'];
    const tortenet = new Map(rendeles.allapotTortenet.map((bejegyzes) => [bejegyzes.allapot, bejegyzes]));

    const lepesek = rendeles.allapot === 'lemondva'
        ? [...tervezettLepesek.filter((lepes) => tortenet.has(lepes)), 'lemondva']
        : tervezettLepesek;
    const megjegyzesek = rendeles.allapotTortenet.filter((bejegyzes) => bejegyzes.megjegyzes);

    return (
        <div className="rendeles-idovonal">
            <ol style={{ '--lepesek': lepesek.length }}>
                {lepesek.map((lepes) => {
                    const bejegyzes = tortenet.get(lepes);
                    const aktualis = lepes === rendeles.allapot;
                    const allapot = bejegyzes ? (aktualis ? 'aktualis' : 'kesz') : 'hatravan';
                    return (
                        <li
                            key={lepes}
                            className={`rendeles-lepes rendeles-lepes--${allapot} rendeles-lepes--${lepes}`}
                            aria-current={aktualis ? 'step' : undefined}
                        >
                            <span className="rendeles-lepes-pont">
                                <AllapotIkon allapot={lepes} />
                            </span>
                            <span className="rendeles-lepes-nev">{lepesCimkek()[lepes]}</span>
                            <span className="rendeles-lepes-datum">
                                {bejegyzes ? teljesIdopont(bejegyzes.datum) : t('Még nem történt meg')}
                            </span>
                        </li>
                    );
                })}
            </ol>
            {megjegyzesek.length > 0 && (
                <ul className="rendeles-megjegyzesek">
                    {megjegyzesek.map((bejegyzes) => (
                        <li key={`${bejegyzes.allapot}-${bejegyzes.datum}`}>
                            <strong>{rendelesAllapotCimke(bejegyzes.allapot, bejegyzes.cimke)}</strong>
                            <span>{teljesIdopont(bejegyzes.datum)}</span>
                            <p>{bejegyzes.megjegyzes}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AllapotIdovonal;
