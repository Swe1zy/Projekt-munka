export const forint = (osszeg) => `${osszeg.toLocaleString('hu-HU')} Ft`;

// Az új termékek a `kepek` tömböt használják, a régi rekordoknál külön mezőkben vannak a képek.
export const termekKepek = (termek) =>
    Array.isArray(termek.kepek) && termek.kepek.length
        ? termek.kepek
        : [termek.kep, termek.kep1, termek.kep2, termek.kep3].filter(Boolean);
