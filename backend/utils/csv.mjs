// CSV a magyar Excelhez: pontosvessző az elválasztó, tizedesvessző, UTF-8 BOM
// (enélkül az Excel rosszul jeleníti meg az ékezeteket).
const mezo = (ertek) => {
    if (ertek === null || ertek === undefined) return '';
    if (typeof ertek === 'number') return Number.isFinite(ertek) ? String(ertek).replace('.', ',') : '';
    let szoveg = String(ertek);
    // CSV-injekció ellen: az =, +, -, @ kezdetű szöveget az Excel képletként futtatná.
    if (/^[=+\-@\t\r]/.test(szoveg)) szoveg = `'${szoveg}`;
    return /[";\r\n]/.test(szoveg) ? `"${szoveg.replace(/"/g, '""')}"` : szoveg;
};

export const csvKeszites = (fejlec, sorok) =>
    `﻿${[fejlec, ...sorok].map((sor) => sor.map(mezo).join(';')).join('\r\n')}\r\n`;
