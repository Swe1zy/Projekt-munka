// Az oldal kizárólag a működéshez elengedhetetlen sütiket használ, ezért nincs
// hozzájárulás-kezelés: csak azt jegyezzük meg, hogy a látogató látta a tájékoztatást.
export const TAJEKOZTATAS_SUTI = 'suti_tajekoztatas';
export const TAJEKOZTATAS_SUTI_NAPOK = 365;

export const sutiOlvas = (nev) => {
    const talalat = document.cookie
        .split('; ')
        .find((sor) => sor.startsWith(`${nev}=`));
    if (!talalat) return null;

    try {
        return decodeURIComponent(talalat.slice(nev.length + 1));
    } catch {
        return null;
    }
};

export const sutiBeallit = (nev, ertek, napok) => {
    const reszek = [
        `${nev}=${encodeURIComponent(ertek)}`,
        'Path=/',
        `Max-Age=${napok * 24 * 60 * 60}`,
        'SameSite=Lax',
    ];
    if (window.location.protocol === 'https:') reszek.push('Secure');
    document.cookie = reszek.join('; ');
};
