// Anyagszükséglet-kalkulátor: a számítás alapjai egy helyen. Ezek tájékoztató,
// gyakorlati értékek – a pontos mennyiség a gyártói adatoktól és a kivitelezéstől függ.
export const EGYUTTHATOK = {
    // Falazás: habarcs liter / m² fal / cm falvastagság (pl. 30 cm-es falnál ≈ 30 l/m²)
    habarcsLiterPerCm: 1.0,
    // Vékonyágyazatú (csiszolt tégla, pórusbeton) ragasztó: kg / m² / cm
    ragasztoKgPerCm: 0.25,
    // 1 m³ habarcshoz: homok (m³) és cement (kg)
    habarcsHomokM3: 1.1,
    habarcsCementKg: 250,
    // 1 m³ betonhoz: sóder (m³), cement (kg), víz (liter) – kb. C16/20 minőség
    betonSoderM3: 1.2,
    betonCementKg: 300,
    betonVizLiter: 160,
    cementZsakKg: 25,
    // Tető: alátétfólia átfedéssel
    foliaAtfedes: 0.1,
    // Homlokzati hőszigetelés: ragasztó kg / m²
    szigetelesRagasztoKg: 5,
    // Cserép darab / m², ha a terméknél nincs megadva
    cserepDbPerM2: 10,
    hodfarkuDbPerM2: 36,
};

const kerekitFelfele = (ertek, tizedes) => {
    const szorzo = 10 ** tizedes;
    // A lebegőpontos hibát (pl. 52,50000001) előbb levágjuk, csak utána kerekítünk felfelé.
    return Math.ceil(Math.round(ertek * szorzo * 1000) / 1000) / szorzo;
};

// A kosárba tehető mennyiség: darabos egységnél egész, egyébként 2 tizedesre felfelé.
export const kosarMennyiseg = (mennyiseg, egyseg) =>
    (egyseg === 'db' ? kerekitFelfele(mennyiseg, 0) : kerekitFelfele(mennyiseg, 2));

export const zsak = (kg) => kerekitFelfele(kg / EGYUTTHATOK.cementZsakKg, 0);

// Magyar számformátum a leírásokhoz (22,5 m²).
const hu = (ertek) => ertek.toLocaleString('hu-HU', { maximumFractionDigits: 2 });

const szam = (ertek) => {
    const n = Number(String(ertek).replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : 0;
};
export const szamErtek = szam;

// Hány darab (tégla, cserép, tábla) van egy egységben (pl. 1 m²-ben).
export const darabPerEgyseg = (termek, tipus) => {
    if (typeof termek?.darabPerEgyseg === 'number' && termek.darabPerEgyseg > 0) {
        return { ertek: termek.darabPerEgyseg, becsult: false };
    }
    // Táblás anyagnál a névben szereplő méretből: „(1000x500 mm)” → 2 tábla/m²
    const meret = termek?.nev?.match(/\((\d{3,4})\s*x\s*(\d{3,4})\s*mm\)/i);
    if (meret && termek.egyseg === 'm²') {
        return { ertek: 1e6 / (Number(meret[1]) * Number(meret[2])), becsult: false };
    }
    if (tipus === 'cserep' && /cserép/i.test(termek?.nev ?? '')) {
        return {
            ertek: /hódfark/i.test(termek.nev) ? EGYUTTHATOK.hodfarkuDbPerM2 : EGYUTTHATOK.cserepDbPerM2,
            becsult: true,
        };
    }
    return null;
};

// Falvastagság (cm) a terméknévből, ha kiolvasható: „Ytong … 30 cm”, „Porotherm 38”, „Silka HM 200”.
export const falvastagsagNevbol = (nev = '') => {
    const zarojelNelkul = nev.replace(/\([^)]*\)/g, '');
    const cm = zarojelNelkul.match(/\b(\d{1,2}(?:[.,]\d)?)\s*cm\b/i);
    if (cm) return Number(cm[1].replace(',', '.'));
    const tipus = zarojelNelkul.match(/(?:Porotherm|Leiertherm|Zsalukő|HM)\s+(\d{2,3})\b/i);
    if (tipus) {
        const ertek = Number(tipus[1]);
        return ertek > 60 ? ertek / 10 : ertek;
    }
    return null;
};

export const vekonyagyazatu = (nev = '') => /csiszolt|profi|ytong|silka|x-therm/i.test(nev);

// --- A négy kalkulátor ---------------------------------------------------------------
// Mindegyik { sorok, osszegzes } eredményt ad. Egy sor:
//   { kulcs, szerep, leiras, termek?, mennyiseg?, darab?, info? }
// A termékes sorok kosárba tehetők, az „info” sorok csak tájékoztatnak.

export const falSzamitas = ({ hossz, magassag, nyilaszarok, raHagyas, vastagsag, vekony }, { falazoelem, homok }) => {
    const brutto = szam(hossz) * szam(magassag);
    const netto = Math.max(0, brutto - szam(nyilaszarok));
    const vastag = szam(vastagsag) || 30;
    const sorok = [];

    if (netto > 0 && falazoelem) {
        const mennyiseg = kosarMennyiseg(netto * (1 + szam(raHagyas) / 100), falazoelem.egyseg);
        const db = darabPerEgyseg(falazoelem);
        sorok.push({
            kulcs: 'falazoelem',
            szerep: 'Falazóelem',
            leiras: `${hu(netto)} m² fal + ${szam(raHagyas)}% ráhagyás`,
            termek: falazoelem,
            mennyiseg,
            darab: db ? { ertek: Math.ceil(mennyiseg * db.ertek), becsult: db.becsult, nev: 'db' } : null,
        });
    }

    if (netto > 0 && vekony) {
        const kg = netto * vastag * EGYUTTHATOK.ragasztoKgPerCm;
        sorok.push({
            kulcs: 'ragaszto',
            szerep: 'Falazóragasztó',
            leiras: `vékonyágyazatú falazás, ${vastag} cm-es fal`,
            info: `≈ ${Math.ceil(kg)} kg, azaz ${zsak(kg)} zsák (25 kg)`,
        });
    } else if (netto > 0) {
        const habarcsM3 = (netto * vastag * EGYUTTHATOK.habarcsLiterPerCm) / 1000;
        if (homok) {
            sorok.push({
                kulcs: 'homok',
                szerep: 'Falazóhomok a habarcshoz',
                leiras: `≈ ${hu(habarcsM3)} m³ habarcs (${hu(vastag)} cm-es fal)`,
                termek: homok,
                mennyiseg: kosarMennyiseg(habarcsM3 * EGYUTTHATOK.habarcsHomokM3, homok.egyseg),
            });
        }
        sorok.push({
            kulcs: 'habarcs-cement',
            szerep: 'Cement a habarcshoz',
            leiras: `${EGYUTTHATOK.habarcsCementKg} kg / m³ habarcs`,
            info: `≈ ${zsak(habarcsM3 * EGYUTTHATOK.habarcsCementKg)} zsák (25 kg)`,
        });
    }

    return { sorok, osszegzes: netto > 0 ? `${hu(netto)} m² nettó falfelület` : null };
};

export const betonSzamitas = ({ hossz, szelesseg, vastagsag, raHagyas, mod }, { kesz, soder }) => {
    const terfogat = szam(hossz) * szam(szelesseg) * (szam(vastagsag) / 100) * (1 + szam(raHagyas) / 100);
    const sorok = [];
    if (terfogat <= 0) return { sorok, osszegzes: null };

    if (mod === 'kesz') {
        if (kesz) {
            sorok.push({
                kulcs: 'beton',
                szerep: 'Kész beton',
                leiras: `${hu(terfogat)} m³ ráhagyással`,
                termek: kesz,
                // Mixerbetont tizedköbméterre kerekítve rendelünk.
                mennyiseg: Math.max(kerekitFelfele(terfogat, 1), 0.1),
            });
        }
    } else {
        if (soder) {
            sorok.push({
                kulcs: 'soder',
                szerep: 'Sóder',
                leiras: `${hu(EGYUTTHATOK.betonSoderM3)} m³ / m³ beton`,
                termek: soder,
                mennyiseg: kosarMennyiseg(terfogat * EGYUTTHATOK.betonSoderM3, soder.egyseg),
            });
        }
        sorok.push({
            kulcs: 'cement',
            szerep: 'Cement',
            leiras: `${EGYUTTHATOK.betonCementKg} kg / m³ beton`,
            info: `${zsak(terfogat * EGYUTTHATOK.betonCementKg)} zsák (25 kg)`,
        });
        sorok.push({
            kulcs: 'viz',
            szerep: 'Víz',
            leiras: `${EGYUTTHATOK.betonVizLiter} liter / m³ beton`,
            info: `≈ ${Math.ceil(terfogat * EGYUTTHATOK.betonVizLiter)} liter`,
        });
    }

    return { sorok, osszegzes: `${hu(terfogat)} m³ beton (${szam(raHagyas)}% ráhagyással)` };
};

export const tetoSzamitas = ({ felulet, alapterulet, hajlasszog, mod, raHagyas, folia }, { fedes, alatetFolia }) => {
    const tetoFelulet = mod === 'alapterulet'
        ? szam(alapterulet) / Math.cos((Math.min(szam(hajlasszog), 75) * Math.PI) / 180)
        : szam(felulet);
    const sorok = [];
    if (tetoFelulet <= 0) return { sorok, osszegzes: null };

    if (fedes) {
        const mennyiseg = kosarMennyiseg(tetoFelulet * (1 + szam(raHagyas) / 100), fedes.egyseg);
        const db = darabPerEgyseg(fedes, 'cserep');
        sorok.push({
            kulcs: 'fedes',
            szerep: 'Tetőfedő anyag',
            leiras: `${hu(tetoFelulet)} m² tető + ${szam(raHagyas)}% vágási ráhagyás`,
            termek: fedes,
            mennyiseg,
            darab: db ? { ertek: Math.ceil(mennyiseg * db.ertek), becsult: db.becsult, nev: 'db cserép' } : null,
        });
    }
    if (folia && alatetFolia) {
        sorok.push({
            kulcs: 'folia',
            szerep: 'Alátétfólia',
            leiras: `${Math.round(EGYUTTHATOK.foliaAtfedes * 100)}% átfedéssel`,
            termek: alatetFolia,
            mennyiseg: kosarMennyiseg(tetoFelulet * (1 + EGYUTTHATOK.foliaAtfedes), alatetFolia.egyseg),
        });
    }

    return { sorok, osszegzes: `${hu(tetoFelulet)} m² tetőfelület` };
};

export const szigetelesSzamitas = ({ felulet, nyilaszarok, raHagyas, homlokzat }, { szigetelo }) => {
    const netto = Math.max(0, szam(felulet) - szam(nyilaszarok));
    const sorok = [];
    if (netto <= 0) return { sorok, osszegzes: null };

    if (szigetelo) {
        const mennyiseg = kosarMennyiseg(netto * (1 + szam(raHagyas) / 100), szigetelo.egyseg);
        const db = darabPerEgyseg(szigetelo);
        sorok.push({
            kulcs: 'szigetelo',
            szerep: 'Hőszigetelő anyag',
            leiras: `${hu(netto)} m² + ${szam(raHagyas)}% ráhagyás`,
            termek: szigetelo,
            mennyiseg,
            darab: db ? { ertek: Math.ceil(mennyiseg * db.ertek - 1e-9), becsult: db.becsult, nev: 'tábla' } : null,
        });
    }
    if (homlokzat) {
        const kg = netto * EGYUTTHATOK.szigetelesRagasztoKg;
        sorok.push({
            kulcs: 'ragaszto',
            szerep: 'Ragasztó- és ágyazóhabarcs',
            leiras: `${EGYUTTHATOK.szigetelesRagasztoKg} kg / m²`,
            info: `≈ ${zsak(kg)} zsák (25 kg)`,
        });
    }

    return { sorok, osszegzes: `${hu(netto)} m² szigetelendő felület` };
};

// --- Melyik termék melyik szerepre választható --------------------------------------
const nevben = (minta) => (termek) => minta.test(termek.nev);
const kategoriaban = (...kategoriak) => (termek) => kategoriak.includes(termek.kategoria);
const egysegben = (egyseg) => (termek) => termek.egyseg === egyseg;
const mind = (...feltetelek) => (termek) => feltetelek.every((feltetel) => feltetel(termek));
const nem = (feltetel) => (termek) => !feltetel(termek);

export const TERMEK_SZEREPEK = {
    falazoelem: mind(kategoriaban('Falazóanyagok'), egysegben('m²'), nem(nevben(/térkő|béléstest|hőszigetelő lap|üvegtégla/i))),
    homok: mind(egysegben('m³'), nevben(/homok/i), nem(nevben(/finom/i))),
    kesz: mind(egysegben('m³'), nevben(/beton/i), nem(nevben(/darált/i))),
    soder: mind(egysegben('m³'), nevben(/sóder|kavics/i)),
    fedes: mind(kategoriaban('Tetőfedés'), egysegben('m²'), nem(nevben(/fólia|lemez \d|polikarbonát|zárólemez|nehézlemez/i))),
    alatetFolia: mind(kategoriaban('Tetőfedés'), egysegben('m²'), nevben(/tetőfólia|alátétfólia/i)),
    szigetelo: mind(kategoriaban('Hőszigetelés'), egysegben('m²')),
};

// Alapértelmezett választás: a névben az előnyben részesített minta, különben az első.
export const alapTermek = (lista, preferalt) => lista.find((termek) => preferalt?.test(termek.nev)) ?? lista[0] ?? null;
