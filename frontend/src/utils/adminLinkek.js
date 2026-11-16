// Hivatkozások a dashboardról a részletes admin oldalakra.
const lekerdezes = (parameterek) => new URLSearchParams(
    Object.entries(parameterek).filter(([, ertek]) => ertek !== undefined && ertek !== null && ertek !== ''),
).toString();

// A rendeléskezelő a rövid azonosítóra szűr, és lenyitja a rendelést.
export const rendelesLink = (rendeles) =>
    `/admin/rendelesek?${lekerdezes({ kereses: rendeles.rovidAzonosito, rendeles: String(rendeles.id) })}`;

export const rendelesKeresesLink = (kereses, extra = {}) => `/admin/rendelesek?${lekerdezes({ ...extra, kereses })}`;

export const rendelesSzuroLink = (szurok) => `/admin/rendelesek?${lekerdezes(szurok)}`;

export const termekLink = (id) => `/admin/termekek?${lekerdezes({ szerkeszt: String(id) })}`;
