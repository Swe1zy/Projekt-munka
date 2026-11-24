import { t } from './nyelv';

// A backend a rendelés állapotait, átvételi módját és fizetési állapotát magyar
// felirattal is küldi (backend/models/Rendeles.mjs). A felületen a kulcs alapján,
// a választott nyelven jelenítjük meg őket; ismeretlen kulcsnál a backend felirata marad.

const RENDELES_ALLAPOTOK = () => ({
    feldolgozasra_var: t('Feldolgozásra vár'),
    visszaigazolva: t('Visszaigazolva'),
    kiszallitas_alatt: t('Kiszállítás alatt'),
    teljesitve: t('Teljesítve'),
    lemondva: t('Lemondva'),
});

const ATVETELI_MODOK = () => ({
    hazhozszallitas: t('Házhozszállítás'),
    szemelyes_atvetel: t('Személyes átvétel'),
});

const FIZETESI_ALLAPOTOK = () => ({
    atutalasra_var: t('Átutalásra vár'),
    fizetesre_var: t('Bankkártyás fizetésre vár'),
    fizetve: t('Fizetve'),
    fizetes_lejart: t('A fizetés lejárt'),
});

export const rendelesAllapotCimke = (allapot, tartalek = allapot) => RENDELES_ALLAPOTOK()[allapot] ?? tartalek;
export const atvetelModCimke = (mod, tartalek = mod) => ATVETELI_MODOK()[mod] ?? tartalek;
export const fizetesiAllapotCimke = (allapot, tartalek = allapot) => FIZETESI_ALLAPOTOK()[allapot] ?? tartalek;
