// Ellenőrzi, hogy a forrásban lévő minden t('…') kulcsnak van-e fordítása az összes
// szótárban (src/forditas/*.js), és nincs-e a szótárakban már nem használt kulcs,
// vagy olyan fordítás, amelyből hiányzik egy {helyőrző}.
// Futtatás: npm run forditas-ellenorzes   (hibánál 1-es kóddal lép ki)
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const gyoker = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');
const NYELVEK = ['en', 'de', 'he'];

const fajlok = async (mappa) => {
    const elemek = await readdir(mappa, { withFileTypes: true });
    const lista = await Promise.all(elemek.map((elem) => {
        const teljes = path.join(mappa, elem.name);
        if (elem.isDirectory()) return elem.name === 'forditas' ? [] : fajlok(teljes);
        return /\.(jsx?|mjs)$/.test(elem.name) ? [teljes] : [];
    }));
    return lista.flat();
};

// t('…') hívások első (szöveg) argumentuma; a \' escape-et is kezeli.
const KULCS_MINTA = /\bt\(\s*'((?:[^'\\]|\\.)*)'/g;
const kulcsok = new Map();
for (const fajl of await fajlok(gyoker)) {
    const szoveg = await readFile(fajl, 'utf8');
    for (const talalat of szoveg.matchAll(KULCS_MINTA)) {
        const kulcs = talalat[1].replace(/\\(.)/g, '$1');
        if (!kulcsok.has(kulcs)) kulcsok.set(kulcs, path.relative(gyoker, fajl));
    }
}

const helyorzok = (szoveg) => [...szoveg.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

let hibak = 0;
for (const nyelv of NYELVEK) {
    const { default: szotar } = await import(pathToFileURL(path.join(gyoker, 'forditas', `${nyelv}.js`)).href);
    const hianyzo = [...kulcsok.keys()].filter((kulcs) => !(kulcs in szotar));
    const felesleges = Object.keys(szotar).filter((kulcs) => !kulcsok.has(kulcs));
    const rosszHelyorzo = Object.entries(szotar).filter(([kulcs, ertek]) => kulcsok.has(kulcs) && helyorzok(kulcs) !== helyorzok(ertek));

    for (const kulcs of hianyzo) console.log(`[${nyelv}] hiányzó fordítás: ${JSON.stringify(kulcs)}  (${kulcsok.get(kulcs)})`);
    for (const kulcs of felesleges) console.log(`[${nyelv}] nem használt kulcs: ${JSON.stringify(kulcs)}`);
    for (const [kulcs] of rosszHelyorzo) console.log(`[${nyelv}] eltérő helyőrzők: ${JSON.stringify(kulcs)}`);
    hibak += hianyzo.length + felesleges.length + rosszHelyorzo.length;
}

console.log(`${kulcsok.size} kulcs, ${NYELVEK.length} nyelv: ${hibak ? `${hibak} hiba` : 'minden rendben'}.`);
process.exitCode = hibak ? 1 : 0;
