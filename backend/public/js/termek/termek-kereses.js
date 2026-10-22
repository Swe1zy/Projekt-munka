const kereso = document.querySelector('#termek-kereses');
const termekKartya = [...document.querySelectorAll('.termek-container')];
const nincsTalalat = document.querySelector('#nincs-talalat');
const kategoriaSzurok = [...document.querySelectorAll('input[name="kategoria"]')];
const minAr = document.querySelector('#min-ar');
const maxAr = document.querySelector('#max-ar');
const szuroTorles = document.querySelector('#szuro-torles');

const normalizal = (szoveg) =>
    szoveg
        .toLocaleLowerCase('hu-HU')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

kereso?.addEventListener('input', () => {
    szurTermekeket();
});

const szurTermekeket = () => {
    const kifejezes = normalizal(kereso?.value.trim() || '');
    const kivalasztottKategoriak = kategoriaSzurok
        .filter((checkbox) => checkbox.checked)
        .map((checkbox) => checkbox.value);
    const minimum = minAr?.value === '' ? null : Number(minAr.value);
    const maximum = maxAr?.value === '' ? null : Number(maxAr.value);
    let lathatoTermekek = 0;

    for (const kartya of termekKartya) {
        const megfelelNevnek = normalizal(kartya.dataset.keresendo || '').includes(kifejezes);
        const megfelelKategoriának = kivalasztottKategoriak.length === 0 ||
            kivalasztottKategoriak.includes(kartya.dataset.kategoria);
        const ar = Number(kartya.dataset.ar);
        const megfelelArnak = (minimum === null || ar >= minimum) &&
            (maximum === null || ar <= maximum) &&
            !(minimum !== null && maximum !== null && minimum > maximum);
        const egyezes = megfelelNevnek && megfelelKategoriának && megfelelArnak;
        kartya.hidden = !egyezes;
        if (egyezes) lathatoTermekek += 1;
    }

    if (nincsTalalat) nincsTalalat.hidden = lathatoTermekek > 0;
};

[...kategoriaSzurok, minAr, maxAr].forEach((elem) => {
    elem?.addEventListener('input', szurTermekeket);
    elem?.addEventListener('change', szurTermekeket);
});

szuroTorles?.addEventListener('click', () => {
    kategoriaSzurok.forEach((checkbox) => { checkbox.checked = false; });
    if (minAr) minAr.value = '';
    if (maxAr) maxAr.value = '';
    szurTermekeket();
});

szurTermekeket();
