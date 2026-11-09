const feltoltBtn = document.querySelector('#feltolt');
const kepekInputok = document.querySelector('#kepek-inputok');

document.querySelector('#kep-hozzaad').addEventListener('click', () => {
    const mezo = document.createElement('div');
    mezo.className = 'kep-mezo';
    mezo.innerHTML = '<input type="url" class="kep-input" placeholder="Kép URL-je" /><button type="button" class="kep-eltavolit" aria-label="Képmező eltávolítása">Eltávolít</button>';
    kepekInputok.append(mezo);
});

kepekInputok.addEventListener('click', (event) => {
    if (event.target.matches('.kep-eltavolit')) event.target.closest('.kep-mezo').remove();
});

feltoltBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    const nev = document.querySelector('#nev').value;
    const kategoria = document.querySelector('#kategoria').value;
    const leiras = document.querySelector('#leiras').value;
    const ar = Number(document.querySelector('#ar').value);
    const egyseg = document.querySelector('#egyseg').value;
    const keszletMezo = document.querySelector('#keszlet').value;
    const keszlet = Number(keszletMezo);
    const kepek = [...kepekInputok.querySelectorAll('.kep-input')]
        .map((input) => input.value.trim())
        .filter(Boolean);

    if (!nev.trim() || !kategoria || !leiras.trim() || !Number.isFinite(ar) || ar < 0 || !['m³', 'm²'].includes(egyseg) || keszletMezo === '' || !Number.isFinite(keszlet) || keszlet < 0 || kepek.length === 0) {
        window.alert('Add meg a termék adatait, válassz m³ vagy m² mértékegységet, add meg a készletet és legalább egy kép URL-jét.');
        return;
    }

    feltoltBtn.disabled = true;
    feltoltBtn.textContent = 'Feltöltés folyamatban…';
    try {
        const response = await fetch('/api/new-termek', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nev, kategoria, leiras, kepek, ar, egyseg, keszlet }),
        });

        const valasz = await response.json();
        if (!response.ok) throw new Error(valasz.msg || 'A feltöltés nem sikerült.');

        window.alert(valasz.msg);
        window.location.href = '/api/termekek';
    } catch (error) {
        window.alert(error.message || 'Nem sikerült kapcsolódni a szerverhez.');
        feltoltBtn.disabled = false;
        feltoltBtn.textContent = 'Feltölt';
    }
});
