// A termék nem kötelező számmezői (szállítás, raklap, kalkulátor).
// Üres érték ('' vagy null) = a mező törlése, így ismét a kategória alapértéke érvényes.
const OPCIONALIS_SZAM_MEZOK = {
    suly: 'tömeg (kg/egység)',
    raklapon: 'raklap-kiszerelés',
    darabPerEgyseg: 'darab/egység',
};

export const opcionalisSzamMezok = (body = {}) => {
    const beallit = {};
    const torol = {};
    for (const [mezo, cimke] of Object.entries(OPCIONALIS_SZAM_MEZOK)) {
        if (!Object.hasOwn(body, mezo)) continue;
        const ertek = body[mezo];
        if (ertek === '' || ertek === null) {
            torol[mezo] = '';
            continue;
        }
        const szam = Number(ertek);
        if (!Number.isFinite(szam) || szam < 0 || szam > 1000000) {
            return { hiba: `A(z) ${cimke} nemnegatív szám legyen.` };
        }
        beallit[mezo] = szam;
    }
    return { beallit, torol };
};
