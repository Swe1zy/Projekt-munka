const kereso = document.querySelector('#termek-kereses');
const termekKartya = [...document.querySelectorAll('.termek-container')];
const nincsTalalat = document.querySelector('#nincs-talalat');

const normalizal = (szoveg) =>
    szoveg
        .toLocaleLowerCase('hu-HU')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

kereso?.addEventListener('input', () => {
    const kifejezes = normalizal(kereso.value.trim());
    let lathatoTermekek = 0;

    for (const kartya of termekKartya) {
        const egyezes = normalizal(kartya.dataset.keresendo || '').includes(kifejezes);
        kartya.hidden = !egyezes;
        if (egyezes) lathatoTermekek += 1;
    }

    if (nincsTalalat) nincsTalalat.hidden = lathatoTermekek > 0;
});
