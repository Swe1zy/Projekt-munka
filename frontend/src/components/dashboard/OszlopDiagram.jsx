import { useEffect, useRef, useState } from 'react';
import {
    forint,
    idosorCimke,
    idosorHosszuCimke,
    szam,
    tengelyErtekek,
    tomorForint,
    tomorSzam,
} from '../../utils/dashboardFormazas';

const PLOT_MAGASSAG = 220;
const FELSO_HELY = 24;
const X_TENGELY_SAV = 30;
const BAL_HELY = 52;
const JOBB_HELY = 12;
const TELJES_MAGASSAG = FELSO_HELY + PLOT_MAGASSAG + X_TENGELY_SAV;
const LEPESEK = { ArrowRight: 1, ArrowLeft: -1 };

const useSzelesseg = (ref) => {
    const [szelesseg, setSzelesseg] = useState(0);

    useEffect(() => {
        const elem = ref.current;
        if (!elem) return undefined;
        const megfigyelo = new ResizeObserver(([bejegyzes]) => {
            setSzelesseg(Math.floor(bejegyzes.contentRect.width));
        });
        megfigyelo.observe(elem);
        return () => megfigyelo.disconnect();
    }, [ref]);

    return szelesseg;
};

// Oszlop 4 px-es lekerekített tetővel, az alapvonalon szögletes talppal.
const oszlopUt = (x, felso, szelesseg, magassag) => {
    const r = Math.min(4, szelesseg / 2, magassag);
    const also = felso + magassag;
    return `M${x},${also}V${felso + r}Q${x},${felso} ${x + r},${felso}H${x + szelesseg - r}Q${x + szelesseg},${felso} ${x + szelesseg},${felso + r}V${also}Z`;
};

const OszlopDiagram = ({ adatok, bontas, tablazat }) => {
    const kontenerRef = useRef(null);
    const szelesseg = useSzelesseg(kontenerRef);
    const [aktiv, setAktiv] = useState(null);

    const darab = adatok.length;
    const maxErtek = adatok.reduce((max, sor) => Math.max(max, sor.bevetel), 0);
    const osszeg = adatok.reduce((sum, sor) => sum + sor.bevetel, 0);
    const ures = maxErtek === 0;
    const tengely = tengelyErtekek(maxErtek);
    const felsoErtek = tengely.at(-1);
    const plotSzelesseg = Math.max(0, szelesseg - BAL_HELY - JOBB_HELY);
    const sav = darab ? plotSzelesseg / darab : 0;
    const oszlopSzelesseg = Math.max(1, Math.min(24, sav * 0.7, sav - 2));
    const alapvonal = FELSO_HELY + PLOT_MAGASSAG;
    const y = (ertek) => alapvonal - (ertek / felsoErtek) * PLOT_MAGASSAG;
    const savKozep = (index) => BAL_HELY + sav * (index + 0.5);
    const cimkeLepes = Math.max(1, Math.ceil((bontas === 'honap' ? 40 : 58) / (sav || 1)));
    const maxIndex = ures ? -1 : adatok.findLastIndex((sor) => sor.bevetel === maxErtek);
    const aktivSor = aktiv !== null ? adatok[aktiv] : null;
    const egyseg = bontas === 'honap' ? 'hónap' : 'nap';

    const mutatoMozgas = (event) => {
        if (!sav) return;
        const x = event.clientX - event.currentTarget.getBoundingClientRect().left - BAL_HELY;
        setAktiv(Math.min(darab - 1, Math.max(0, Math.floor(x / sav))));
    };

    const billentyu = (event) => {
        if (!darab) return;
        if (Object.hasOwn(LEPESEK, event.key)) {
            event.preventDefault();
            setAktiv((elozo) => (elozo === null
                ? darab - 1
                : Math.min(darab - 1, Math.max(0, elozo + LEPESEK[event.key]))));
        } else if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            setAktiv(event.key === 'Home' ? 0 : darab - 1);
        } else if (event.key === 'Escape') {
            setAktiv(null);
        }
    };

    const tooltipBalra = aktiv !== null && savKozep(aktiv) > szelesseg / 2;

    return (
        <div className="db-oszlopdiagram" ref={kontenerRef}>
            {tablazat ? (
                <div className="db-tablazat-gorgeto db-tablazat-gorgeto--magas">
                    <table className="db-tablazat">
                        <thead>
                            <tr>
                                <th scope="col">{bontas === 'honap' ? 'Hónap' : 'Nap'}</th>
                                <th scope="col" className="db-szam">Bevétel</th>
                                <th scope="col" className="db-szam">Rendelések</th>
                            </tr>
                        </thead>
                        <tbody>
                            {adatok.map((sor) => (
                                <tr key={sor.kulcs}>
                                    <td>{idosorHosszuCimke(sor.kulcs, bontas)}</td>
                                    <td className="db-szam">{forint(sor.bevetel)}</td>
                                    <td className="db-szam">{szam(sor.rendelesek)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th scope="row">Összesen</th>
                                <td className="db-szam">{forint(osszeg)}</td>
                                <td className="db-szam">{szam(adatok.reduce((sum, sor) => sum + sor.rendelesek, 0))}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            ) : (
                <div
                    className="db-oszlopdiagram-vaszon"
                    tabIndex={ures ? -1 : 0}
                    aria-label={`Bevétel ${egyseg}i bontásban. A nyilakkal lépkedhetsz az oszlopok között.`}
                    onKeyDown={billentyu}
                    onBlur={() => setAktiv(null)}
                >
                    {szelesseg > 0 && (
                        <svg
                            width={szelesseg}
                            height={TELJES_MAGASSAG}
                            role="img"
                            aria-label={ures
                                ? 'Ebben az időszakban nem érkezett rendelés.'
                                : `Összesen ${forint(osszeg)} bevétel ${darab} ${egyseg} alatt; a legtöbb ${forint(maxErtek)} (${idosorHosszuCimke(adatok[maxIndex].kulcs, bontas)}).`}
                            onPointerMove={ures ? undefined : mutatoMozgas}
                            onPointerLeave={() => setAktiv(null)}
                        >
                            {!ures && tengely.map((ertek) => (
                                <g key={ertek}>
                                    <line
                                        className={ertek === 0 ? 'db-tengely-alap' : 'db-racsvonal'}
                                        x1={BAL_HELY}
                                        x2={szelesseg - JOBB_HELY}
                                        y1={y(ertek) + 0.5}
                                        y2={y(ertek) + 0.5}
                                    />
                                    <text className="db-tengely-cimke" x={BAL_HELY - 10} y={y(ertek)} textAnchor="end" dominantBaseline="middle">
                                        {tomorSzam(ertek)}
                                    </text>
                                </g>
                            ))}
                            {ures && (
                                <>
                                    <line className="db-tengely-alap" x1={BAL_HELY} x2={szelesseg - JOBB_HELY} y1={alapvonal + 0.5} y2={alapvonal + 0.5} />
                                    <text className="db-ures-szoveg" x={BAL_HELY + plotSzelesseg / 2} y={FELSO_HELY + PLOT_MAGASSAG / 2} textAnchor="middle">
                                        Ebben az időszakban nem érkezett rendelés.
                                    </text>
                                </>
                            )}

                            {aktiv !== null && (
                                <rect className="db-aktiv-sav" x={BAL_HELY + sav * aktiv} y={FELSO_HELY} width={sav} height={PLOT_MAGASSAG} />
                            )}

                            {adatok.map((sor, index) => {
                                if (sor.bevetel <= 0) return null;
                                const magassag = Math.max(2, alapvonal - y(sor.bevetel));
                                return (
                                    <path
                                        key={sor.kulcs}
                                        className={`db-oszlop${index === aktiv ? ' db-oszlop--aktiv' : ''}`}
                                        d={oszlopUt(savKozep(index) - oszlopSzelesseg / 2, alapvonal - magassag, oszlopSzelesseg, magassag)}
                                    />
                                );
                            })}

                            {maxIndex >= 0 && (
                                <text className="db-csucs-cimke" x={savKozep(maxIndex)} y={y(maxErtek) - 8} textAnchor="middle">
                                    {tomorForint(maxErtek)}
                                </text>
                            )}

                            {adatok.map((sor, index) => ((darab - 1 - index) % cimkeLepes === 0 ? (
                                <text key={sor.kulcs} className="db-tengely-cimke" x={savKozep(index)} y={alapvonal + 19} textAnchor="middle">
                                    {idosorCimke(sor.kulcs, bontas)}
                                </text>
                            ) : null))}
                        </svg>
                    )}

                    {aktivSor && (
                        <div
                            className={`db-tooltip${tooltipBalra ? ' db-tooltip--balra' : ''}`}
                            style={{ left: savKozep(aktiv) + (tooltipBalra ? -14 : 14), top: FELSO_HELY }}
                            role="status"
                        >
                            <span className="db-tooltip-cim">{idosorHosszuCimke(aktivSor.kulcs, bontas)}</span>
                            <strong>{forint(aktivSor.bevetel)}</strong>
                            <span>{szam(aktivSor.rendelesek)} rendelés</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default OszlopDiagram;
