const kepekInputok = document.querySelector('#kepek-inputok');

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
    const leiras = document.querySelector('#leiras').value;
    const ar = parseFloat(document.querySelector('#ar').value);
    const kepek = [...document.querySelectorAll('.kep-input')]
        .map((input) => input.value.trim())
        .filter(Boolean);

    const response = await fetch(`/api/termekek/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nev, leiras, ar, kepek }),
    });

    const valasz = await response.json();

    if (response.ok) {
        window.alert(valasz.msg);
        window.location.href = '/api/termekek';
    } else {
        window.alert(valasz.msg);
    }
};
