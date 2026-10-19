let alertMessage = 'Hány képpel dolgozzak?';

if (alertMessage) {
    let szam = window.prompt(alertMessage);
    let tablazat = '<table>';
    for (let i = 0; i < Number(szam); i++) {
        tablazat += '<tr>';
        tablazat += `<td><label for='kep${i + 1}'>Kép ${i + 1}: </td>`;
        tablazat += `<td><input type='text' id='kep${i + 1}' /></td>`;
        tablazat += '</tr>';
    }
    tablazat += '<tr>';
    tablazat += `<td><button id="feltolt">Feltölt</button></td>`;
    tablazat += `<td></td>`;
    tablazat += '</tr>';
    tablazat += '</table>';
    ide.innerHTML = tablazat;

    const feltoltBtn = document.querySelector('#feltolt');

    feltoltBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        const id = document.querySelector('#termek-id').value;
        let kepek = document.querySelector('#termek-kepek').value.split(',');

        for (let i = 0; i < szam; i++) {
            const kep = document.querySelector(`#kep${i + 1}`).value;
            kepek.push(kep);
        }

        const response = await fetch(`/api/termek-pictures/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ kepek }),
        });

        const valasz = await response.json();

        if (response.ok) {
            window.alert(valasz.msg);
            window.location.href = '/api/termekek';
        } else {
            window.alert(valasz.msg);
        }
    });
}
