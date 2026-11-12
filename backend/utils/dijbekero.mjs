import { createRequire } from 'node:module';
import PDFDocument from 'pdfkit';
import { DIJBEKERO, ELADO, KISZALLITAS } from '../config/uzlet.mjs';
import { ATVETELI_MODOK } from '../models/Rendeles.mjs';
import { rovidAzonosito } from './rendelesFormazas.mjs';

// A PDF beépített betűtípusai nem ismerik az ő/ű betűt, ezért ékezetes TTF-et ágyazunk be.
const require = createRequire(import.meta.url);
const BETU = require.resolve('dejavu-fonts-ttf/ttf/DejaVuSans.ttf');
const BETU_FELKOVER = require.resolve('dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf');

const SZIN = { tinta: '#17352b', szoveg: '#3b4a43', halvany: '#6b7a72', vonal: '#dfe5dc', hatter: '#f3f6f0', piros: '#b42318' };
const MARGO = 50;
const SZELES = 595.28 - 2 * MARGO;
const LAP_ALJA = 841.89 - MARGO - 30;
const NAP_MS = 24 * 60 * 60 * 1000;

// A nem törő szóközöket egyszerű nem törő szóközre cseréljük, ez minden betűtípusban megvan.
const egysegesSzokoz = (szoveg) => szoveg.replace(/[  ]/g, ' ');
const forintFormazo = new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 });
const szamFormazo = new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 2 });
const datumFormazo = new Intl.DateTimeFormat('hu-HU', { timeZone: 'Europe/Budapest', year: 'numeric', month: 'long', day: 'numeric' });
const forint = (ertek) => egysegesSzokoz(forintFormazo.format(ertek || 0));
const szam = (ertek) => egysegesSzokoz(szamFormazo.format(ertek || 0));
const datum = (ertek) => datumFormazo.format(new Date(ertek));
const napKulcsDatum = (kulcs) => {
    const [ev, honap, nap] = kulcs.split('-').map(Number);
    return datum(Date.UTC(ev, honap - 1, nap, 12));
};

export const dijbekeroFajlnev = (rendeles) => `dijbekero-${rovidAzonosito(rendeles._id)}.pdf`;

export const dijbekeroPdf = (rendeles) => new Promise((resolve, reject) => {
    const azonosito = rovidAzonosito(rendeles._id);
    const doc = new PDFDocument({
        size: 'A4',
        margin: MARGO,
        bufferPages: true,
        info: { Title: `Díjbekérő #${azonosito}`, Author: ELADO.nev, Subject: 'Díjbekérő' },
    });
    const darabok = [];
    doc.on('data', (darab) => darabok.push(darab));
    doc.on('end', () => resolve(Buffer.concat(darabok)));
    doc.on('error', reject);

    doc.registerFont('Normal', BETU);
    doc.registerFont('Felkover', BETU_FELKOVER);

    // ---------- Fejléc ----------
    doc.font('Felkover').fontSize(22).fillColor(SZIN.tinta).text('DÍJBEKÉRŐ', MARGO, MARGO);
    doc.font('Normal').fontSize(9).fillColor(SZIN.halvany)
        .text('Nem számla – a számlát a teljesítéskor állítjuk ki.', MARGO, MARGO + 30);

    const hatarido = new Date(new Date(rendeles.createdAt).getTime() + DIJBEKERO.fizetesiHataridoNap * NAP_MS);
    const fejAdatok = [
        ['Azonosító', `#${azonosito}`],
        ['Kelt', datum(rendeles.createdAt)],
        ['Fizetési határidő', datum(hatarido)],
        ['Fizetési mód', 'Banki átutalás'],
        ['Közlemény', azonosito],
    ];
    let y = MARGO;
    for (const [cimke, ertek] of fejAdatok) {
        doc.font('Normal').fontSize(9).fillColor(SZIN.halvany).text(cimke, 340, y, { width: 90 });
        doc.font('Felkover').fillColor(SZIN.tinta).text(ertek, 430, y, { width: SZELES + MARGO - 430, align: 'right' });
        y += 15;
    }

    y = Math.max(y, MARGO + 50) + 12;
    if (rendeles.allapot === 'lemondva') {
        doc.roundedRect(MARGO, y, SZELES, 26, 4).fill('#fdecec');
        doc.font('Felkover').fontSize(10).fillColor(SZIN.piros)
            .text('LEMONDOTT RENDELÉS – ezt a díjbekérőt nem kell kifizetni.', MARGO + 12, y + 8);
        y += 38;
    }

    // ---------- Eladó és vevő ----------
    const szamlazas = rendeles.szamlazasiAdatok;
    const felek = [
        ['Eladó', [
            [ELADO.nev, true],
            [ELADO.cim],
            [`Adószám: ${ELADO.adoszam}`],
            [`${ELADO.bank}`],
            [`Számlaszám: ${ELADO.bankszamla}`],
            [`${ELADO.email} · ${ELADO.telefon}`],
        ]],
        ['Vevő', [
            [szamlazas.nev, true],
            [szamlazas.tipus === 'ceg' ? `Adószám: ${szamlazas.adoszam}` : 'Magánszemély'],
            [`${szamlazas.iranyitoszam} ${szamlazas.telepules}, ${szamlazas.utca}`],
            [rendeles.email],
        ]],
    ];
    const dobozSzeles = (SZELES - 16) / 2;
    // A magasabb doboz sorszámához igazítunk (fejléc + kiemelt név + további sorok).
    const dobozMagas = 26 + 15 + (Math.max(...felek.map(([, sorok]) => sorok.length)) - 1) * 13 + 10;
    felek.forEach(([cim, sorok], index) => {
        const x = MARGO + index * (dobozSzeles + 16);
        doc.roundedRect(x, y, dobozSzeles, dobozMagas, 5).fillAndStroke(SZIN.hatter, SZIN.vonal);
        doc.font('Felkover').fontSize(8).fillColor(SZIN.halvany).text(cim.toUpperCase(), x + 12, y + 10, { characterSpacing: 0.8 });
        let sorY = y + 26;
        for (const [szoveg, kiemelt] of sorok) {
            doc.font(kiemelt ? 'Felkover' : 'Normal').fontSize(kiemelt ? 10 : 9).fillColor(kiemelt ? SZIN.tinta : SZIN.szoveg)
                .text(szoveg, x + 12, sorY, { width: dobozSzeles - 24, lineBreak: false, ellipsis: true });
            sorY += kiemelt ? 15 : 13;
        }
    });
    y += dobozMagas + 16;

    // ---------- Átvétel ----------
    const idosav = KISZALLITAS.idosavok.find((sav) => sav.kulcs === rendeles.idosav)?.cimke;
    const atvetelReszek = [
        ATVETELI_MODOK[rendeles.atvetelModja] ?? rendeles.atvetelModja,
        rendeles.szallitasiAdatok
            ? `${rendeles.szallitasiAdatok.iranyitoszam} ${rendeles.szallitasiAdatok.telepules}, ${rendeles.szallitasiAdatok.utca}`
            : 'a telephelyen',
        rendeles.atvetelNapja ? `${napKulcsDatum(rendeles.atvetelNapja)}${idosav ? `, ${idosav}` : ''}` : null,
    ].filter(Boolean);
    doc.font('Felkover').fontSize(9).fillColor(SZIN.tinta).text('Átvétel: ', MARGO, y, { continued: true });
    doc.font('Normal').fillColor(SZIN.szoveg).text(atvetelReszek.join(' · '), { width: SZELES });
    y = doc.y + 14;

    // ---------- Tételek ----------
    const oszlopok = [
        { cimke: 'Megnevezés', x: MARGO + 8, szeles: 245, igazitas: 'left' },
        { cimke: 'Mennyiség', x: MARGO + 258, szeles: 75, igazitas: 'right' },
        { cimke: 'Egységár', x: MARGO + 338, szeles: 75, igazitas: 'right' },
        { cimke: 'Összeg', x: MARGO + 418, szeles: SZELES - 426, igazitas: 'right' },
    ];
    const fejlecSor = () => {
        doc.rect(MARGO, y, SZELES, 22).fill(SZIN.tinta);
        for (const oszlop of oszlopok) {
            doc.font('Felkover').fontSize(8.5).fillColor('#ffffff')
                .text(oszlop.cimke, oszlop.x, y + 7, { width: oszlop.szeles, align: oszlop.igazitas });
        }
        y += 22;
    };
    fejlecSor();

    for (const tetel of rendeles.tetelek) {
        doc.font('Normal').fontSize(9);
        const sorMagas = Math.max(doc.heightOfString(tetel.nev, { width: oszlopok[0].szeles }), 11) + 12;
        if (y + sorMagas > LAP_ALJA) {
            doc.addPage();
            y = MARGO;
            fejlecSor();
        }
        const ertekek = [
            tetel.nev,
            `${szam(tetel.mennyiseg)} ${tetel.egyseg}`,
            forint(tetel.egysegar),
            forint(Math.round(tetel.mennyiseg * tetel.egysegar)),
        ];
        oszlopok.forEach((oszlop, index) => {
            doc.font(index === 3 ? 'Felkover' : 'Normal').fontSize(9).fillColor(SZIN.szoveg)
                .text(ertekek[index], oszlop.x, y + 6, { width: oszlop.szeles, align: oszlop.igazitas });
        });
        y += sorMagas;
        doc.moveTo(MARGO, y).lineTo(MARGO + SZELES, y).lineWidth(0.6).strokeColor(SZIN.vonal).stroke();
    }

    // ---------- Összesítés ----------
    const o = rendeles.osszesites;
    const osszegSorok = o
        ? [
            ['Termékek', forint(o.termekOsszeg)],
            o.kedvezmeny > 0 ? [`Céges mennyiségi kedvezmény (${szam(o.kedvezmenySzazalek)}%)`, `−${forint(o.kedvezmeny)}`] : null,
            rendeles.atvetelModja === 'hazhozszallitas'
                ? [`Szállítás${o.szallitas ? ` (${o.szallitas.zonaNev}, ${o.szallitas.fuvarok} forduló)` : ''}`, forint(o.szallitas?.alapdij ?? o.szallitasiDij)]
                : null,
            o.szallitas?.darus ? ['Darus lerakodás', forint(o.szallitas.darusPotdij)] : null,
            o.raklapBetetdij > 0 ? [`Raklap-betétdíj (${szam(o.raklapok)} raklap)`, forint(o.raklapBetetdij)] : null,
        ].filter(Boolean)
        : [];
    const blokkMagas = osszegSorok.length * 16 + 40;
    if (y + blokkMagas + 70 > LAP_ALJA) {
        doc.addPage();
        y = MARGO;
    }
    y += 12;
    const osszegX = MARGO + SZELES - 270;
    for (const [cimke, ertek] of osszegSorok) {
        doc.font('Normal').fontSize(9).fillColor(SZIN.szoveg).text(cimke, osszegX, y, { width: 180 });
        doc.font('Normal').text(ertek, osszegX + 180, y, { width: 90, align: 'right' });
        y += 16;
    }
    doc.moveTo(osszegX, y + 2).lineTo(MARGO + SZELES, y + 2).lineWidth(1).strokeColor(SZIN.tinta).stroke();
    y += 10;
    doc.font('Felkover').fontSize(12).fillColor(SZIN.tinta).text('Fizetendő', osszegX, y, { width: 140 });
    doc.text(forint(rendeles.vegosszeg), osszegX + 120, y, { width: 150, align: 'right' });
    y += 34;

    // ---------- Fizetési tudnivalók ----------
    const megjegyzesek = [
        `Kérjük, az összeget ${datum(hatarido).replace(/\.$/, '')}-ig utald át a(z) ${ELADO.bankszamla} számlaszámra, közleményként a(z) ${azonosito} azonosítót megadva.`,
        'Az árak forintban értendők, és tartalmazzák az általános forgalmi adót.',
        o?.raklapBetetdij > 0 ? 'A raklap-betétdíj a raklapok visszahozásakor visszajár.' : null,
    ].filter(Boolean);
    doc.font('Normal').fontSize(8.5).fillColor(SZIN.halvany).text(megjegyzesek.join('\n'), MARGO, y, { width: SZELES, lineGap: 2 });

    // ---------- Lábléc minden oldalon ----------
    const lapok = doc.bufferedPageRange();
    for (let index = 0; index < lapok.count; index += 1) {
        doc.switchToPage(lapok.start + index);
        // A margón kívülre írás új oldalt nyitna, ezért a lábléchez ideiglenesen kikapcsoljuk.
        doc.page.margins.bottom = 0;
        doc.font('Normal').fontSize(7.5).fillColor(SZIN.halvany).text(
            `${ELADO.nev} · Díjbekérő #${azonosito} · ${index + 1}/${lapok.count}. oldal`,
            MARGO,
            841.89 - MARGO + 10,
            { width: SZELES, align: 'center', lineBreak: false },
        );
    }

    doc.end();
});
