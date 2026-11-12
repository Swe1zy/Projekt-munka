import TermekModel from '../models/Termek.mjs';

// A készlet m²/m³ esetén tört szám is lehet, ezért minden módosítás után két
// tizedesre kerekítünk, különben a lebegőpontos hibák összeadódnának
// (pl. 10 - 0.1 - 0.2 = 9.700000000000001).
const kerekitettKeszlet = (muvelet, mennyiseg) => [
    { $set: { keszlet: { $round: [{ [muvelet]: ['$keszlet', mennyiseg] }, 2] } } },
];

/**
 * Atomi, feltételes készletlevonás. Egy termékből csak akkor von le, ha a
 * művelet pillanatában még van elég – így két egyszerre érkező rendelés sem
 * viheti mínuszba a készletet. Ha bármelyik tétel nem vonható le, a már
 * levont tételeket visszaírja, és megadja, melyik tétel nem volt elérhető.
 */
export const keszletLevonas = async (tetelek) => {
    const levont = [];
    const valtozasok = [];

    for (const tetel of tetelek) {
        // A frissített dokumentumból tudjuk, mennyi maradt – ebből jön a készletriasztás.
        const frissitett = await TermekModel.findOneAndUpdate(
            { _id: tetel.termekId, keszlet: { $gte: tetel.mennyiseg } },
            kerekitettKeszlet('$subtract', tetel.mennyiseg),
            { updatePipeline: true, returnDocument: 'after', projection: { nev: 1, egyseg: 1, keszlet: 1 }, lean: true },
        );

        if (!frissitett) {
            await keszletVisszaadas(levont);
            return { siker: false, hianyzoTetel: tetel };
        }
        levont.push(tetel);
        valtozasok.push({
            termekId: frissitett._id,
            nev: frissitett.nev,
            egyseg: frissitett.egyseg,
            elozo: Math.round((frissitett.keszlet + tetel.mennyiseg) * 100) / 100,
            uj: frissitett.keszlet,
        });
    }

    return { siker: true, valtozasok };
};

// Lemondáskor vagy sikertelen rendelésmentéskor visszaírja a tételek mennyiségét.
// A közben törölt termékeket egyszerűen kihagyja.
export const keszletVisszaadas = async (tetelek) => {
    const eredmenyek = await Promise.allSettled(
        tetelek.map((tetel) => TermekModel.updateOne(
            { _id: tetel.termekId },
            kerekitettKeszlet('$add', tetel.mennyiseg),
            { updatePipeline: true },
        )),
    );

    const hibak = eredmenyek.filter((eredmeny) => eredmeny.status === 'rejected');
    if (hibak.length) {
        console.error('Készlet-visszaírási hiba:', hibak.map((hiba) => hiba.reason));
    }
};
