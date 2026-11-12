import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_URL } from '../config';
import { MAX_MENNYISEG, useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { forint, szam } from '../utils/dashboardFormazas';
import {
    TERMEK_SZEREPEK,
    alapTermek,
    betonSzamitas,
    falSzamitas,
    falvastagsagNevbol,
    szigetelesSzamitas,
    tetoSzamitas,
    vekonyagyazatu,
} from '../utils/kalkulator';
import { termekKepek } from '../utils/termek';
import './Kalkulator.css';

const FULEK = [
    { kulcs: 'fal', cim: 'Fal', alcim: 'Falazóelem, habarcs' },
    { kulcs: 'beton', cim: 'Beton', alcim: 'Kész beton vagy sóder + cement' },
    { kulcs: 'teto', cim: 'Tető', alcim: 'Cserép, alátétfólia' },
    { kulcs: 'szigeteles', cim: 'Szigetelés', alcim: 'Hőszigetelő táblák' },
];

const SzamMezo = ({ cimke, ertek, beallit, egyseg, placeholder, segitseg }) => (
    <label className="kalk-mezo">
        <span>{cimke}</span>
        <span className="kalk-mezo-bevitel">
            <input
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={ertek}
                placeholder={placeholder}
                onChange={(event) => beallit(event.target.value)}
            />
            {egyseg && <span className="kalk-mezo-egyseg">{egyseg}</span>}
        </span>
        {segitseg && <small>{segitseg}</small>}
    </label>
);

const TermekValaszto = ({ cimke, lista, termek, beallit }) => (
    <label className="kalk-mezo kalk-mezo--szeles">
        <span>{cimke}</span>
        {lista.length ? (
            <select value={termek?._id ?? ''} onChange={(event) => beallit(event.target.value)}>
                {lista.map((elem) => (
                    <option key={elem._id} value={elem._id}>
                        {elem.nev} — {forint(elem.ar)}/{elem.egyseg}
                    </option>
                ))}
            </select>
        ) : (
            <small>Jelenleg nincs ilyen termék a kínálatban.</small>
        )}
    </label>
);

const Valto = ({ cimke, opciok, ertek, beallit }) => (
    <fieldset className="kalk-valto">
        <legend>{cimke}</legend>
        {opciok.map((opcio) => (
            <label key={opcio.ertek} className={ertek === opcio.ertek ? 'aktiv' : ''}>
                <input type="radio" checked={ertek === opcio.ertek} onChange={() => beallit(opcio.ertek)} />
                {opcio.cimke}
            </label>
        ))}
    </fieldset>
);

const Jelolo = ({ cimke, ertek, beallit, segitseg }) => (
    <label className="kalk-jelolo">
        <input type="checkbox" checked={ertek} onChange={(event) => beallit(event.target.checked)} />
        <span>
            {cimke}
            {segitseg && <small>{segitseg}</small>}
        </span>
    </label>
);

const Kalkulator = () => {
    const { hozzaad } = useCart();
    const toast = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const ful = FULEK.some((elem) => elem.kulcs === searchParams.get('tipus')) ? searchParams.get('tipus') : 'fal';

    const [termekAllapot, setTermekAllapot] = useState({ betoltve: false, termekek: [], hiba: '' });
    const [valasztas, setValasztas] = useState({});
    const [kihagyott, setKihagyott] = useState({});
    const [kosarba, setKosarba] = useState(false);

    const [fal, setFal] = useState({ hossz: '10', magassag: '2.75', nyilaszarok: '4', raHagyas: '5', vastagsag: '', vekony: null });
    const [beton, setBeton] = useState({ hossz: '6', szelesseg: '4', vastagsag: '12', raHagyas: '5', mod: 'kesz' });
    const [teto, setTeto] = useState({ mod: 'alapterulet', felulet: '', alapterulet: '100', hajlasszog: '35', raHagyas: '10', folia: true });
    const [szig, setSzig] = useState({ felulet: '120', nyilaszarok: '18', raHagyas: '5', homlokzat: true });

    useEffect(() => {
        const vezerlo = new AbortController();
        fetch(`${API_URL}/frontend-termekek`, { signal: vezerlo.signal })
            .then(async (response) => {
                const adat = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(adat.msg || 'A termékeket nem sikerült betölteni.');
                setTermekAllapot({ betoltve: true, termekek: adat.termekek, hiba: '' });
            })
            .catch((error) => {
                if (error.name !== 'AbortError') setTermekAllapot({ betoltve: true, termekek: [], hiba: error.message });
            });
        return () => vezerlo.abort();
    }, []);

    // Szerepenként a választható termékek (pl. falazóelem, homok, sóder), név szerint rendezve.
    const jeloltek = useMemo(() => Object.fromEntries(
        Object.entries(TERMEK_SZEREPEK).map(([szerep, feltetel]) => [
            szerep,
            termekAllapot.termekek.filter(feltetel).sort((a, b) => a.nev.localeCompare(b.nev, 'hu')),
        ]),
    ), [termekAllapot.termekek]);

    const valasztott = (szerep, preferalt) =>
        jeloltek[szerep].find((termek) => termek._id === valasztas[szerep]) ?? alapTermek(jeloltek[szerep], preferalt);
    const termekBeallit = (szerep) => (id) => setValasztas((elozo) => ({ ...elozo, [szerep]: id }));
    const mezo = (beallito, kulcs) => (ertek) => beallito((elozo) => ({ ...elozo, [kulcs]: ertek }));

    const falazoelem = valasztott('falazoelem', /Porotherm 30 N\+F/);
    const homok = valasztott('homok', /falazóhomok/i);
    const kesz = valasztott('kesz', /C16\/20/);
    const soder = valasztott('soder', /sóder 0-24/i);
    const fedes = valasztott('fedes', /Bramac Római/);
    const alatetFolia = valasztott('alatetFolia', /páraáteresztő/i);
    const szigetelo = valasztott('szigetelo', /homlokzati EPS 10 cm/);

    // A falvastagság és a falazás módja a választott termékből adódik, amíg a vásárló felül nem írja.
    const nevbolVastagsag = falvastagsagNevbol(falazoelem?.nev);
    const falVastagsag = fal.vastagsag !== '' ? fal.vastagsag : nevbolVastagsag ?? 30;
    const falVekony = fal.vekony ?? vekonyagyazatu(falazoelem?.nev);

    const eredmeny = {
        fal: () => falSzamitas({ ...fal, vastagsag: falVastagsag, vekony: falVekony }, { falazoelem, homok }),
        beton: () => betonSzamitas(beton, { kesz, soder }),
        teto: () => tetoSzamitas(teto, { fedes, alatetFolia }),
        szigeteles: () => szigetelesSzamitas(szig, { szigetelo }),
    }[ful]();

    const sorKulcs = (sor) => `${ful}:${sor.kulcs}`;
    const kosarSorok = eredmeny.sorok.filter((sor) => sor.termek && !kihagyott[sorKulcs(sor)]);
    const osszesen = kosarSorok.reduce((osszeg, sor) => osszeg + sor.termek.ar * sor.mennyiseg, 0);

    const fulValtas = (kulcs) => {
        setSearchParams({ tipus: kulcs }, { replace: true });
        setKosarba(false);
    };

    const kosarbaTesz = () => {
        const korlatozott = [];
        for (const sor of kosarSorok) {
            const elerheto = Math.min(sor.termek.keszlet, MAX_MENNYISEG);
            if (sor.mennyiseg > elerheto) korlatozott.push(`${sor.termek.nev}: csak ${szam(elerheto)} ${sor.termek.egyseg}`);
            hozzaad({ ...sor.termek, kep: termekKepek(sor.termek)[0] }, sor.mennyiseg);
        }
        toast.siker(`${kosarSorok.length} tétel a kosárba került.`);
        if (korlatozott.length) toast.hiba(`Készlet miatt kevesebb került a kosárba – ${korlatozott.join('; ')}.`);
        setKosarba(true);
    };

    return (
        <main className="kalkulator">
            <header className="kalk-fejlec">
                <span>ANYAGSZÜKSÉGLET-KALKULÁTOR</span>
                <h1>Mennyi anyag kell?</h1>
                <p>Add meg a méreteket, válassz terméket, és egy kattintással kosárba teheted a szükséges mennyiséget.</p>
            </header>

            <div className="kalk-fulek" role="tablist" aria-label="Kalkulátor típusa">
                {FULEK.map((elem) => (
                    <button
                        key={elem.kulcs}
                        type="button"
                        role="tab"
                        aria-selected={elem.kulcs === ful}
                        onClick={() => fulValtas(elem.kulcs)}
                    >
                        <strong>{elem.cim}</strong>
                        <small>{elem.alcim}</small>
                    </button>
                ))}
            </div>

            {termekAllapot.hiba && <p className="kalk-hiba" role="alert">{termekAllapot.hiba}</p>}

            <div className="kalk-racs" role="tabpanel">
                <section className="kalk-kartya" aria-label="Méretek és termékek">
                    {ful === 'fal' && (
                        <>
                            <h2>Fal méretei</h2>
                            <div className="kalk-mezok">
                                <SzamMezo cimke="Fal hossza" egyseg="m" ertek={fal.hossz} beallit={mezo(setFal, 'hossz')} segitseg="Több falnál a hosszak összege." />
                                <SzamMezo cimke="Fal magassága" egyseg="m" ertek={fal.magassag} beallit={mezo(setFal, 'magassag')} />
                                <SzamMezo cimke="Nyílászárók" egyseg="m²" ertek={fal.nyilaszarok} beallit={mezo(setFal, 'nyilaszarok')} segitseg="Ajtók, ablakok összes felülete." />
                                <SzamMezo cimke="Ráhagyás" egyseg="%" ertek={fal.raHagyas} beallit={mezo(setFal, 'raHagyas')} segitseg="Törés, vágás." />
                            </div>
                            <h2>Anyagok</h2>
                            <div className="kalk-mezok">
                                <TermekValaszto cimke="Falazóelem" lista={jeloltek.falazoelem} termek={falazoelem} beallit={termekBeallit('falazoelem')} />
                                <SzamMezo
                                    cimke="Falvastagság"
                                    egyseg="cm"
                                    ertek={fal.vastagsag}
                                    placeholder={String(nevbolVastagsag ?? 30)}
                                    beallit={mezo(setFal, 'vastagsag')}
                                    segitseg={nevbolVastagsag ? 'A termék nevéből; felülírható.' : 'A habarcsigényhez.'}
                                />
                                <Valto
                                    cimke="Falazás módja"
                                    ertek={falVekony ? 'vekony' : 'hagyomanyos'}
                                    beallit={(ertek) => setFal((elozo) => ({ ...elozo, vekony: ertek === 'vekony' }))}
                                    opciok={[
                                        { ertek: 'hagyomanyos', cimke: 'Habarccsal' },
                                        { ertek: 'vekony', cimke: 'Vékonyágyazatú ragasztóval' },
                                    ]}
                                />
                                {!falVekony && (
                                    <TermekValaszto cimke="Homok a habarcshoz" lista={jeloltek.homok} termek={homok} beallit={termekBeallit('homok')} />
                                )}
                            </div>
                        </>
                    )}

                    {ful === 'beton' && (
                        <>
                            <h2>Betonozandó rész</h2>
                            <div className="kalk-mezok">
                                <SzamMezo cimke="Hossz" egyseg="m" ertek={beton.hossz} beallit={mezo(setBeton, 'hossz')} />
                                <SzamMezo cimke="Szélesség" egyseg="m" ertek={beton.szelesseg} beallit={mezo(setBeton, 'szelesseg')} />
                                <SzamMezo cimke="Vastagság" egyseg="cm" ertek={beton.vastagsag} beallit={mezo(setBeton, 'vastagsag')} segitseg="Aljzat 10–15 cm, sávalap mélysége pl. 80 cm." />
                                <SzamMezo cimke="Ráhagyás" egyseg="%" ertek={beton.raHagyas} beallit={mezo(setBeton, 'raHagyas')} />
                            </div>
                            <h2>Anyagok</h2>
                            <div className="kalk-mezok">
                                <Valto
                                    cimke="Beton"
                                    ertek={beton.mod}
                                    beallit={mezo(setBeton, 'mod')}
                                    opciok={[
                                        { ertek: 'kesz', cimke: 'Kész beton (mixer)' },
                                        { ertek: 'sajat', cimke: 'Saját keverés' },
                                    ]}
                                />
                                {beton.mod === 'kesz' ? (
                                    <TermekValaszto cimke="Betontípus" lista={jeloltek.kesz} termek={kesz} beallit={termekBeallit('kesz')} />
                                ) : (
                                    <TermekValaszto cimke="Sóder" lista={jeloltek.soder} termek={soder} beallit={termekBeallit('soder')} />
                                )}
                            </div>
                        </>
                    )}

                    {ful === 'teto' && (
                        <>
                            <h2>Tető</h2>
                            <div className="kalk-mezok">
                                <Valto
                                    cimke="Mit ismersz?"
                                    ertek={teto.mod}
                                    beallit={mezo(setTeto, 'mod')}
                                    opciok={[
                                        { ertek: 'alapterulet', cimke: 'Alapterület + hajlásszög' },
                                        { ertek: 'felulet', cimke: 'Tetőfelület' },
                                    ]}
                                />
                                {teto.mod === 'alapterulet' ? (
                                    <>
                                        <SzamMezo cimke="Tető alapterülete" egyseg="m²" ertek={teto.alapterulet} beallit={mezo(setTeto, 'alapterulet')} segitseg="Felülnézetben, ereszekkel együtt." />
                                        <SzamMezo cimke="Hajlásszög" egyseg="°" ertek={teto.hajlasszog} beallit={mezo(setTeto, 'hajlasszog')} />
                                    </>
                                ) : (
                                    <SzamMezo cimke="Tetőfelület" egyseg="m²" ertek={teto.felulet} beallit={mezo(setTeto, 'felulet')} />
                                )}
                                <SzamMezo cimke="Ráhagyás" egyseg="%" ertek={teto.raHagyas} beallit={mezo(setTeto, 'raHagyas')} segitseg="Vágás, élek, gerinc." />
                            </div>
                            <h2>Anyagok</h2>
                            <div className="kalk-mezok">
                                <TermekValaszto cimke="Tetőfedés" lista={jeloltek.fedes} termek={fedes} beallit={termekBeallit('fedes')} />
                                <Jelolo cimke="Alátétfólia is kell" ertek={teto.folia} beallit={mezo(setTeto, 'folia')} />
                                {teto.folia && (
                                    <TermekValaszto cimke="Alátétfólia" lista={jeloltek.alatetFolia} termek={alatetFolia} beallit={termekBeallit('alatetFolia')} />
                                )}
                            </div>
                        </>
                    )}

                    {ful === 'szigeteles' && (
                        <>
                            <h2>Szigetelendő felület</h2>
                            <div className="kalk-mezok">
                                <SzamMezo cimke="Felület" egyseg="m²" ertek={szig.felulet} beallit={mezo(setSzig, 'felulet')} segitseg="Homlokzatnál: kerület × magasság." />
                                <SzamMezo cimke="Nyílászárók" egyseg="m²" ertek={szig.nyilaszarok} beallit={mezo(setSzig, 'nyilaszarok')} />
                                <SzamMezo cimke="Ráhagyás" egyseg="%" ertek={szig.raHagyas} beallit={mezo(setSzig, 'raHagyas')} />
                            </div>
                            <h2>Anyagok</h2>
                            <div className="kalk-mezok">
                                <TermekValaszto cimke="Hőszigetelés" lista={jeloltek.szigetelo} termek={szigetelo} beallit={termekBeallit('szigetelo')} />
                                <Jelolo cimke="Homlokzati (ragasztott) szigetelés" ertek={szig.homlokzat} beallit={mezo(setSzig, 'homlokzat')} segitseg="Ragasztóigény becslése." />
                            </div>
                        </>
                    )}
                </section>

                <section className="kalk-kartya kalk-eredmeny" aria-label="Eredmény" aria-live="polite">
                    <h2>Eredmény</h2>
                    {!termekAllapot.betoltve ? (
                        <p className="kalk-ures">Termékek betöltése…</p>
                    ) : eredmeny.sorok.length === 0 ? (
                        <p className="kalk-ures">Add meg a méreteket a számításhoz.</p>
                    ) : (
                        <>
                            {eredmeny.osszegzes && <p className="kalk-osszegzes">{eredmeny.osszegzes}</p>}
                            <ul className="kalk-sorok">
                                {eredmeny.sorok.map((sor) => (
                                    <li key={sor.kulcs} className={sor.termek ? 'kalk-sor' : 'kalk-sor kalk-sor--info'}>
                                        {sor.termek ? (
                                            <>
                                                <input
                                                    type="checkbox"
                                                    aria-label={`${sor.szerep} kosárba tétele`}
                                                    checked={!kihagyott[sorKulcs(sor)]}
                                                    onChange={(event) => setKihagyott((elozo) => ({ ...elozo, [sorKulcs(sor)]: !event.target.checked }))}
                                                />
                                                <div className="kalk-sor-adat">
                                                    <span className="kalk-sor-szerep">{sor.szerep}</span>
                                                    <strong>{sor.termek.nev}</strong>
                                                    <small>{sor.leiras}</small>
                                                    {sor.mennyiseg > sor.termek.keszlet && (
                                                        <small className="kalk-keszlet">Készleten csak {szam(sor.termek.keszlet)} {sor.termek.egyseg} van.</small>
                                                    )}
                                                </div>
                                                <div className="kalk-sor-mennyiseg">
                                                    <strong>{szam(sor.mennyiseg)} {sor.termek.egyseg}</strong>
                                                    {sor.darab && <small>{sor.darab.becsult ? 'kb. ' : '≈ '}{szam(sor.darab.ertek)} {sor.darab.nev}</small>}
                                                    <small>{forint(sor.termek.ar * sor.mennyiseg)}</small>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <span className="kalk-info-ikon" aria-hidden="true">i</span>
                                                <div className="kalk-sor-adat">
                                                    <span className="kalk-sor-szerep">{sor.szerep}</span>
                                                    <small>{sor.leiras}</small>
                                                </div>
                                                <div className="kalk-sor-mennyiseg">
                                                    <strong>{sor.info}</strong>
                                                    <small>tájékoztató</small>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            <div className="kalk-osszesen">
                                <span>Kiválasztott termékek</span>
                                <strong>{forint(osszesen)}</strong>
                            </div>
                            <button type="button" className="kalk-gomb" disabled={!kosarSorok.length} onClick={kosarbaTesz}>
                                Kosárba teszem ({kosarSorok.length} tétel)
                            </button>
                            {kosarba && <Link className="kalk-kosar-link" to="/kosar">Tovább a kosárhoz →</Link>}
                            <p className="kalk-megjegyzes">
                                Az eredmény tájékoztató becslés; a pontos mennyiség a gyártói adatoktól és a kivitelezéstől függ.
                                A raklapok betétdíját és a szállítást a kosár és a pénztár számolja.
                            </p>
                        </>
                    )}
                </section>
            </div>
        </main>
    );
};

export default Kalkulator;
