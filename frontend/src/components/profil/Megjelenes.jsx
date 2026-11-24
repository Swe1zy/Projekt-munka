import { NYELVEK, nyelvValtas, t, useNyelv } from '../../utils/nyelv';
import { PENZNEMEK, penznemValtas, useArfolyamAllapot } from '../../utils/penznem';
import { temaValtas, useTema } from '../../utils/tema';

const temaOpciok = () => [
    { kulcs: 'vilagos', cimke: t('Világos'), leiras: t('Világos háttér, sötét betűk.') },
    { kulcs: 'sotet', cimke: t('Sötét'), leiras: t('Sötét háttér, kíméli a szemet este.') },
    { kulcs: 'rendszer', cimke: t('Rendszer szerint'), leiras: t('Követi a készüléked beállítását.') },
];

const penznemNevek = () => ({
    HUF: t('Forint'),
    EUR: t('Euró'),
    USD: t('Amerikai dollár'),
    GBP: t('Angol font'),
    CHF: t('Svájci frank'),
});

// A téma, a nyelv és a pénznem azonnal érvényes, mentés gomb nélkül. Eszközönként tárolódnak.
const Megjelenes = () => {
    const tema = useTema();
    const nyelv = useNyelv();
    const { kod: penznem, arfolyamok } = useArfolyamAllapot();
    const nevek = penznemNevek();

    return (
        <div className="profil-panelek">
            <section className="profil-panel">
                <div className="profil-panel-fej">
                    <h2>{t('Megjelenés')}</h2>
                    <p>{t('Válaszd ki, milyen színekkel jelenjen meg az áruház. A beállítást ez a böngésző jegyzi meg.')}</p>
                </div>

                <fieldset className="tema-valaszto">
                    <legend className="tema-rejtett">{t('Téma')}</legend>
                    {temaOpciok().map((opcio) => (
                        <label
                            key={opcio.kulcs}
                            className="tema-opcio"
                        >
                            <input
                                type="radio"
                                name="tema"
                                value={opcio.kulcs}
                                checked={tema === opcio.kulcs}
                                onChange={() => temaValtas(opcio.kulcs)}
                            />
                            <span
                                className={`tema-minta tema-minta--${opcio.kulcs}`}
                                aria-hidden="true"
                            >
                                <span className="tema-minta-sav" />
                                <span className="tema-minta-kartya">
                                    <span />
                                    <span />
                                </span>
                            </span>
                            <span className="tema-opcio-szoveg">
                                <strong>{opcio.cimke}</strong>
                                <small>{opcio.leiras}</small>
                            </span>
                        </label>
                    ))}
                </fieldset>
            </section>

            <section className="profil-panel">
                <div className="profil-panel-fej">
                    <h2>{t('Nyelv')}</h2>
                    <p>{t('A felület nyelve. A termékek neve és leírása magyarul marad.')}</p>
                </div>

                <fieldset className="beallitas-valaszto">
                    <legend className="tema-rejtett">{t('Nyelv')}</legend>
                    {NYELVEK.map((opcio) => (
                        <label
                            key={opcio.kod}
                            className="beallitas-opcio"
                            lang={opcio.kod}
                        >
                            <input
                                type="radio"
                                name="nyelv"
                                value={opcio.kod}
                                checked={nyelv === opcio.kod}
                                onChange={() => nyelvValtas(opcio.kod)}
                            />
                            <strong>{opcio.cimke}</strong>
                        </label>
                    ))}
                </fieldset>
            </section>

            <section className="profil-panel">
                <div className="profil-panel-fej">
                    <h2>{t('Pénznem')}</h2>
                    <p>
                        {t('Az árak ebben a pénznemben jelennek meg, az aktuális árfolyamon átszámolva. A fizetés mindig forintban történik.')}
                        {arfolyamok.datum ? ` ${t('(EKB-árfolyam, {datum})', { datum: arfolyamok.datum })}` : ''}
                    </p>
                </div>

                <fieldset className="beallitas-valaszto">
                    <legend className="tema-rejtett">{t('Pénznem')}</legend>
                    {PENZNEMEK.map((opcio) => (
                        <label
                            key={opcio.kod}
                            className="beallitas-opcio"
                        >
                            <input
                                type="radio"
                                name="penznem"
                                value={opcio.kod}
                                checked={penznem === opcio.kod}
                                onChange={() => penznemValtas(opcio.kod)}
                            />
                            <strong>{nevek[opcio.kod]}</strong>
                            <small>{opcio.kod === opcio.jel ? opcio.kod : `${opcio.kod} · ${opcio.jel}`}</small>
                        </label>
                    ))}
                </fieldset>
            </section>
        </div>
    );
};

export default Megjelenes;
