const feltoltBtn = document.querySelector('#feltolt');
const kepekInputok = document.querySelector('#kepek-inputok');

document.querySelector('#kep-hozzaad').addEventListener('click', () => {
    const mezo = document.createElement('div');
    mezo.className = 'kep-mezo';
    mezo.innerHTML = '<input type="text" class="kep-input" placeholder="Kép URL-je (vagy válassz fájlt)" /><input type="file" class="kep-fajl" accept="image/*" aria-label="Kép kiválasztása" /><button type="button" class="kep-eltavolit" aria-label="Képmező eltávolítása">Eltávolít</button>';
    kepekInputok.append(mezo);
});

kepekInputok.addEventListener('click', (event) => {
    if (event.target.matches('.kep-eltavolit')) event.target.closest('.kep-mezo').remove();
});

feltoltBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    const nev = document.querySelector('#nev').value;
    const leiras = document.querySelector('#leiras').value;
    const ar = Number(document.querySelector('#ar').value);
    const kepek = [];
    let totalFileSize = 0;
    try {
        for (const mezo of kepekInputok.querySelectorAll('.kep-mezo')) {
            const file = mezo.querySelector('.kep-fajl')?.files?.[0];
            const url = mezo.querySelector('.kep-input')?.value.trim();
            if (file) {
                if (!file.type.startsWith('image/')) {
                    window.alert('Csak képfájl tölthető fel.');
                    return;
                }
                totalFileSize += file.size;
                if (file.size > 8 * 1024 * 1024) {
                    window.alert('Egy kép legfeljebb 8 MB lehet.');
                    return;
                }
                if (totalFileSize > 22 * 1024 * 1024) {
                    window.alert('A képek együttes mérete legfeljebb 22 MB lehet egy feltöltésnél.');
                    return;
                }
                kepek.push(await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => reject(new Error('A kiválasztott kép beolvasása nem sikerült.'));
                    reader.readAsDataURL(file);
                }));
            } else if (url) {
                kepek.push(url);
            }
        }
    } catch (error) {
        window.alert(error.message);
        return;
    }

    if (!nev.trim() || !leiras.trim() || !Number.isFinite(ar) || ar < 0 || kepek.length === 0) {
        window.alert('Add meg a termék nevét, leírását, érvényes árát és legalább egy kép URL-jét vagy fájlnevét.');
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
            body: JSON.stringify({ nev, leiras, kepek, ar }),
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
