import { teljesIdopont } from '../../utils/dashboardFormazas';
import { AllapotIkon } from './AllapotJelveny';
import './Rendeles.css';

const LEPES_CIMKEK = {
    feldolgozasra_var: 'Beérkezett',
    visszaigazolva: 'Visszaigazolva',
    kiszallitas_alatt: 'Kiszállítás alatt',
    teljesitve: 'Teljesítve',
    lemondva: 'Lemondva',
};

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
                            <span className="rendeles-lepes-nev">{LEPES_CIMKEK[lepes]}</span>
                            <span className="rendeles-lepes-datum">
                                {bejegyzes ? teljesIdopont(bejegyzes.datum) : 'Még nem történt meg'}
                            </span>
                        </li>
                    );
                })}
            </ol>
            {megjegyzesek.length > 0 && (
                <ul className="rendeles-megjegyzesek">
                    {megjegyzesek.map((bejegyzes) => (
                        <li key={`${bejegyzes.allapot}-${bejegyzes.datum}`}>
                            <strong>{bejegyzes.cimke}</strong>
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
