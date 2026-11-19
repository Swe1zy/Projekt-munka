/**
 * Sötét téma generálása a meglévő CSS-ből.
 *
 * Végigmegy az src/ összes .css fájlján, és minden szabályból kigyűjti a
 * színekkel kapcsolatos deklarációkat (szín, háttér, keret, árnyék, színváltozók).
 * Ezekből `:root[data-tema='sotet']` előtagú másolatot készít, a színeket
 * átszámolva: a világos hátterek sötétek lesznek, a sötét szövegek világosak,
 * a középtónusú márkaszínek (terrakotta, zöld gombok) maradnak.
 *
 * Az előtag miatt minden sötét szabály erősebb az eredetinél, ezért a
 * szabályok egymáshoz viszonyított sorrendje (alap → hover → aktív) is
 * ugyanaz marad, mint világos módban. Emiatt a változatlan színeket is
 * kiírjuk – különben egy előtagos alapszabály felülírná az eredeti hovert.
 *
 * Egy szabály elé írt „sotet-tema: valtozatlan” CSS-komment a szabály színeit
 * érintetlenül hagyja (pl. a téma-választó előnézeti mintái).
 *
 * Futtatás: npm run sotet-tema (a dev és a build előtt magától lefut).
 * A kimenetet (src/Sotet.generalt.css) ne szerkeszd kézzel – a kézi
 * finomhangolás helye az src/Sotet.css.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';

const GYOKER = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(GYOKER, 'src');
const KIMENET = join(SRC, 'Sotet.generalt.css');
const ELOTAG = ":root[data-tema='sotet']";

// Saját magát és a kézi fájlt nem dolgozza fel.
const KIHAGYOTT = new Set(['Sotet.generalt.css', 'Sotet.css']);

// Ezek eleve sötétek / szándékosan ugyanúgy néznek ki mindkét módban: színeik
// változatlanul, de előtaggal kerülnek ki, hogy a sorrendjük megmaradjon.
const VALTOZATLAN = new Set(['components/Nav.css', 'Uveg.css']);

/* ---------- Színek: beolvasás, OKLab, kiírás ---------- */

const NEVESITETT = {
    white: [255, 255, 255, 1],
    black: [0, 0, 0, 1],
};

const SZIN_MINTA = /#[0-9a-fA-F]{3,8}\b|rgba?\([^()]*\)|\b(?:white|black)\b/g;

const szinBeolvasas = (szoveg) => {
    const kis = szoveg.toLowerCase();
    if (NEVESITETT[kis]) return [...NEVESITETT[kis]];

    if (kis.startsWith('#')) {
        let hex = kis.slice(1);
        if (hex.length === 3 || hex.length === 4) hex = [...hex].map((c) => c + c).join('');
        if (hex.length !== 6 && hex.length !== 8) return null;
        const szamok = hex.match(/../g).map((par) => parseInt(par, 16));
        return [szamok[0], szamok[1], szamok[2], hex.length === 8 ? szamok[3] / 255 : 1];
    }

    const belso = kis.match(/^rgba?\((.*)\)$/)?.[1];
    if (!belso || /calc|var\(/.test(belso)) return null;
    const [rgbResz, alfaResz] = belso.includes('/') ? belso.split('/') : [belso, null];
    const reszek = rgbResz.split(/[\s,]+/).filter(Boolean);
    const alfaSzoveg = alfaResz?.trim() ?? reszek[3];
    if (reszek.length < 3) return null;
    const ertek = (r) => (r.endsWith('%') ? (parseFloat(r) / 100) * 255 : parseFloat(r));
    const alfa = alfaSzoveg === undefined
        ? 1
        : alfaSzoveg.endsWith('%') ? parseFloat(alfaSzoveg) / 100 : parseFloat(alfaSzoveg);
    const szin = [ertek(reszek[0]), ertek(reszek[1]), ertek(reszek[2]), alfa];
    return szin.some(Number.isNaN) ? null : szin;
};

const linearis = (c) => {
    const x = c / 255;
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
};
const gamma = (x) => {
    const c = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, c)) * 255);
};

const oklabba = ([r8, g8, b8]) => {
    const [r, g, b] = [linearis(r8), linearis(g8), linearis(b8)];
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [
        0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    ];
};

const rgbbe = ([L, a, b]) => {
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return [
        gamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
        gamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
        gamma(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    ];
};

const szinKiiras = ([r, g, b, alfa]) => {
    if (alfa >= 1) return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
    return `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)} / ${+alfa.toFixed(3)})`;
};

// Új világosság és telítettség-szorzó, a többi (árnyalat, átlátszóság) marad.
const atvilagosit = (szin, ujL, telitettseg) => {
    const [, a, b] = oklabba(szin);
    return [...rgbbe([ujL, a * telitettseg, b * telitettseg]), szin[3]];
};

/* ---------- Leképezések szerepkör szerint ---------- */

const LEKEPEZESEK = {
    // Hátterek: a világos felületek sötétek lesznek. A tiszta fehér (kártyák)
    // kicsit világosabb a lapnál, hogy a kártya sötétben is kiemelkedjen.
    hatter: (szin) => {
        const [L] = oklabba(szin);
        if (L >= 0.99) return atvilagosit(szin, 0.265, 0.6);
        if (L > 0.72) return atvilagosit(szin, 0.205 + (1 - L) * 0.5, 0.6);
        return szin;
    },
    keret: (szin) => {
        const [L] = oklabba(szin);
        if (L > 0.72) return atvilagosit(szin, 0.36 + (1 - L) * 0.35, 0.6);
        return szin;
    },
    // Szöveg: a sötét és középsötét szöveg világos lesz, a világos marad.
    // A szürkés (kis telítettségű) tinták semlegesek lesznek, különben a sötét
    // palakék címsorokból lila-kékes, a zöldesekből mentazöld szöveg lenne.
    szoveg: (szin) => {
        const [L, a, b] = oklabba(szin);
        if (L >= 0.62) return szin;
        const telitett = Math.hypot(a, b) >= 0.06;
        return atvilagosit(szin, 0.95 - L * 0.45, telitett ? 0.9 : 0.3);
    },
    // Árnyékok: a sötét árnyék kicsit erősebb, a fehér fényél halványabb.
    arnyek: (szin) => {
        const [L] = oklabba(szin);
        if (L < 0.5) return [szin[0], szin[1], szin[2], Math.min(szin[3] * 1.8, 0.6)];
        if (L > 0.8) return [szin[0], szin[1], szin[2], szin[3] * 0.2];
        return szin;
    },
    // Ismeretlen szerep (pl. SVG fill): csak a szélsőségeket fordítja.
    auto: (szin) => {
        const [L] = oklabba(szin);
        if (L > 0.85) return LEKEPEZESEK.hatter(szin);
        if (L < 0.45) return LEKEPEZESEK.szoveg(szin);
        return szin;
    },
    valtozatlan: (szin) => szin,
};

const tulajdonsagSzerep = (prop) => {
    if (prop.startsWith('--')) {
        const nev = prop.toLowerCase();
        if (/shadow|arnyek/.test(nev)) return 'arnyek';
        if (/border|line|grid|axis|keret|vonal/.test(nev)) return 'keret';
        if (/surface|bg|wash|soft|paper|sand|hatter|felulet/.test(nev)) return 'hatter';
        if (/ink|text|muted|szoveg|accent-dark|ikon/.test(nev)) return 'szoveg';
        return 'auto';
    }
    if (/^(color|caret-color|-webkit-text-fill-color|text-decoration-color|column-rule-color)$/.test(prop)) return 'szoveg';
    if (/^background(-color|-image)?$/.test(prop)) return 'hatter';
    if (/^(border|outline)(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-color)?$/.test(prop)) return 'keret';
    if (/^(box-shadow|text-shadow)$/.test(prop)) return 'arnyek';
    if (/^(fill|stroke|stop-color|accent-color)$/.test(prop)) return 'auto';
    return null;
};

const ertekAtalakitas = (ertek, szerep) => ertek.replace(SZIN_MINTA, (talalat) => {
    const szin = szinBeolvasas(talalat);
    return szin ? szinKiiras(LEKEPEZESEK[szerep](szin)) : talalat;
});

/* ---------- CSS bejárása ---------- */

const elotagolas = (szelektor) => {
    const s = szelektor.trim();
    if (/^(:root|html)\b/.test(s)) return s.replace(/^(:root|html)/, ELOTAG);
    return `${ELOTAG} ${s}`;
};

// Márkaszínű (pl. narancs gomb) háttér sötét módban is ugyanaz marad, ezért a
// rajta lévő szöveg színe sem változhat – különben a sötét felirat világos lenne
// a világos narancson. Igaz, ha a szabály háttere tömör középtónus, vagy egy
// akcentus-/márkaszín-változó.
const MARKA_VALTOZO = /^var\(--[a-z0-9-]*(accent|orange|green|series|danger|critical)(-hover)?\)$/;
const markaszinuHatter = (szabaly) => {
    let marad = false;
    szabaly.each((gyerek) => {
        if (gyerek.type !== 'decl' || !/^background(-color)?$/.test(gyerek.prop)) return;
        const ertek = gyerek.value.trim();
        if (MARKA_VALTOZO.test(ertek) && !/soft|wash/.test(ertek)) {
            marad = true;
            return;
        }
        const szinek = (ertek.match(SZIN_MINTA) ?? []).map(szinBeolvasas).filter(Boolean);
        marad = szinek.length > 0 && szinek.every((szin) => {
            const [L] = oklabba(szin);
            return szin[3] >= 0.9 && L >= 0.45 && L <= 0.72;
        });
    });
    return marad;
};

// Új AST-t épít: csak a színes deklarációk és az őket tartalmazó szabályok /
// @media blokkok maradnak. A legfelső szintű szabályok kapják az előtagot,
// a beágyazottak (CSS nesting) a szülőjük alatt maradnak.
const feldolgoz = (csomopont, valtozatlan, legfelso) => {
    if (csomopont.type === 'decl') {
        const szerep = tulajdonsagSzerep(csomopont.prop);
        if (!szerep) return null;
        if (csomopont.prop.startsWith('--') && !SZIN_MINTA.test(csomopont.value)) {
            SZIN_MINTA.lastIndex = 0;
            return null;
        }
        SZIN_MINTA.lastIndex = 0;
        return csomopont.clone({
            value: ertekAtalakitas(csomopont.value, valtozatlan ? 'valtozatlan' : szerep),
            raws: { before: '\n    ', between: ': ' },
        });
    }

    if (csomopont.type === 'rule') {
        const uj = postcss.rule({
            raws: { between: ' ', after: '\n' },
            selector: (legfelso ? csomopont.selectors.map(elotagolas) : csomopont.selectors).join(',\n'),
        });
        // A „sotet-tema: valtozatlan” CSS-komment utáni szabály színei nem változnak.
        const elozo = csomopont.prev();
        const jelolt = elozo?.type === 'comment' && elozo.text.trim() === 'sotet-tema: valtozatlan';
        const szovegMarad = markaszinuHatter(csomopont);
        csomopont.each((gyerek) => {
            const marad = valtozatlan || jelolt || (szovegMarad && gyerek.type === 'decl' && tulajdonsagSzerep(gyerek.prop) === 'szoveg');
            const atalakitott = feldolgoz(gyerek, marad, false);
            if (atalakitott) uj.append(atalakitott);
        });
        return uj.nodes.length ? uj : null;
    }

    if (csomopont.type === 'atrule') {
        if (!['media', 'supports', 'container', 'layer'].includes(csomopont.name) || !csomopont.nodes) return null;
        const uj = postcss.atRule({ name: csomopont.name, params: csomopont.params, nodes: [] });
        csomopont.each((gyerek) => {
            const atalakitott = feldolgoz(gyerek, valtozatlan, legfelso);
            if (atalakitott) uj.append(atalakitott);
        });
        return uj.nodes.length ? uj : null;
    }

    return null;
};

const cssFajlok = readdirSync(SRC, { recursive: true })
    .filter((fajl) => fajl.endsWith('.css') && !KIHAGYOTT.has(fajl))
    .map((fajl) => fajl.split('\\').join('/'))
    // Az alapstílus elöl, a többi ábécérendben – így a sorrend mindig ugyanaz.
    .sort((a, b) => (a === 'index.css' ? -1 : b === 'index.css' ? 1 : a.localeCompare(b)));

const kimenet = postcss.root();
let szabalyok = 0;

for (const fajl of cssFajlok) {
    const forras = postcss.parse(readFileSync(join(SRC, fajl), 'utf8'), { from: fajl });
    const valtozatlan = VALTOZATLAN.has(fajl);
    const blokk = [];
    forras.each((csomopont) => {
        const atalakitott = feldolgoz(csomopont, valtozatlan, true);
        if (atalakitott) blokk.push(atalakitott);
    });
    if (!blokk.length) continue;
    kimenet.append(postcss.comment({ text: ` ${fajl} `, raws: { before: '\n\n' } }));
    blokk.forEach((csomopont) => kimenet.append(csomopont));
    szabalyok += blokk.length;
}

const fejlec = `/* GENERÁLT FÁJL – ne szerkeszd kézzel!
   Forrás: scripts/sotet-tema.mjs (npm run sotet-tema), a dev és a build előtt magától frissül.
   Kézi finomhangolás: src/Sotet.css */`;

writeFileSync(KIMENET, `${fejlec}\n${kimenet.toString()}\n`);
console.log(`Sötét téma: ${szabalyok} szabály, ${cssFajlok.length} fájlból → ${relative(GYOKER, KIMENET)}`);
