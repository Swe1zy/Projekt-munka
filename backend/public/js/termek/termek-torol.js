async function torol(id) {
    const response = await fetch(`/api/termekek/${id}`, { method: 'DELETE' });

    const valasz = await response.json();

    if (response.ok) {
        window.alert(valasz.msg);
        window.location.href = '/api/termekek';
    } else {
        window.alert(valasz.msg);
    }
}
