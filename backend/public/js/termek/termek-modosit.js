const kepekInputok = document.querySelector('#kepek-inputok');
const egysegMezo = document.querySelector('#egyseg');
const keszletInput = document.querySelector('#keszlet');

const keszletLepesFrissitese = () => {
    keszletInput.step = egysegMezo.value === 'db' ? '1' : '0.01';
};

egysegMezo.addEventListener('change', keszletLepesFrissitese);
keszletLepesFrissitese();

document.querySelector('#kep-hozzaad').addEventListener('click', () => {
    const mezo = document.createElement('div');
    mezo.className = 'kep-mezo';
    mezo.innerHTML = '<input type="text" class="kep-input" placeholder="Kép URL-je vagy fájlneve" /><button type="button" class="kep-eltavolit" aria-label="Képmező eltávolítása">Eltávolít</button>';
    kepekInputok.append(mezo);
});

kepekInputok.addEventListener('click', (event) => {
    if (event.target.matches('.kep-eltavolit')) event.target.closest('.kep-mezo').remove();
});

const modosit = async (event) => {
    event.preventDefault();
    const id = document.querySelector('#id-value').value;
    const nev = document.querySelector('#nev').value;
    const kategoria = document.querySelector('#kategoria').value;
    const leiras = document.querySelector('#leiras').value;
    const ar = parseFloat(document.querySelector('#ar').value);
    const egyseg = egysegMezo.value;
    const keszletMezo = keszletInput.value;
    const keszlet = Number(keszletMezo);
    const kepek = [...document.querySelectorAll('.kep-input')]
        .map((input) => input.value.trim())
        .filter(Boolean);

    if (!nev.trim() || !kategoria || !leiras.trim() || !Number.isFinite(ar) || ar < 0 || !['m³', 'm²', 'db'].includes(egyseg) || keszletMezo === '' || !Number.isFinite(keszlet) || keszlet < 0 || (egyseg === 'db' && !Number.isInteger(keszlet)) || kepek.length === 0) {
        window.alert('Add meg a termék adatait, válassz m³, m² vagy db mértékegységet, db esetén egész készletet adj meg, és tölts fel legalább egy képet.');
        return;
    }

    const response = await fetch(`/api/termekek/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nev, kategoria, leiras, ar, egyseg, keszlet, kepek }),
    });

    const valasz = await response.json();

    if (response.ok) {
        window.alert(valasz.msg);
        window.location.href = '/api/termekek';
    } else {
        window.alert(valasz.msg);
    }
};
