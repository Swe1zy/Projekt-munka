// Az áruház üzleti beállításai egy helyen. Itt kell átírni a díjakat, zónákat,
// nyitvatartást és a telephely adatait. A frontend ezeket a GET /api/beallitasok
// végponton kapja meg, a rendelés végösszegét viszont mindig a backend számolja.

// FIGYELEM: a telephely adatai MINTA értékek – cseréld a valódiakra!
export const TELEPHELY = {
    nev: 'Tüzép telephely',
    cim: '1234 Mintaváros, Telephely utca 1.',
    telefon: '+36 30 000 0000',
    email: 'info@tuzep.example',
    // A térkép jelölője (szélesség, hosszúság).
    koordinata: { lat: 47.4979, lng: 19.0402 },
};

// A hét napjai: 0 = vasárnap, 1 = hétfő … 6 = szombat.
export const NYITVATARTAS = [
    { nap: 1, nyit: '07:00', zar: '17:00' },
    { nap: 2, nyit: '07:00', zar: '17:00' },
    { nap: 3, nyit: '07:00', zar: '17:00' },
    { nap: 4, nyit: '07:00', zar: '17:00' },
    { nap: 5, nyit: '07:00', zar: '17:00' },
    { nap: 6, nyit: '07:00', zar: '12:00' },
    { nap: 0, zarva: true },
];

export const KISZALLITAS = {
    // Ezeken a napokon szállítunk ki.
    napok: [1, 2, 3, 4, 5],
    idosavok: [
        { kulcs: 'delelott', cimke: '8:00–12:00' },
        { kulcs: 'delutan', cimke: '12:00–17:00' },
    ],
    // Az ennyi óráig leadott rendelés már a következő szállítási/nyitvatartási napra kérhető,
    // a később leadott csak az azt követőre.
    rendelesiHataridoOra: 12,
    // Ennyi napra előre lehet kiszállítási vagy átvételi napot választani.
    elorefoglalhatoNapok: 21,
};

// Szállítási zónák irányítószám-előtag szerint (a leghosszabb egyező előtag nyer).
// A minta egy budapesti telephelyet feltételez.
//  - kisaru: kisteherautós díj, ha a rendelés legfeljebb SZALLITAS.kisaruMaxKg tömegű
//  - teherauto: teherautós díj fordulónként (egy forduló legfeljebb SZALLITAS.teherautoMaxKg)
export const SZALLITASI_ZONAK = [
    { kulcs: 'budapest', nev: 'Budapest', elotagok: ['1'], kisaru: 4990, teherauto: 14990 },
    { kulcs: 'agglomeracio', nev: 'Budapest környéke', elotagok: ['20', '21', '22', '23', '24', '26'], kisaru: 6990, teherauto: 19990 },
    { kulcs: 'regio', nev: 'Közép-Magyarország', elotagok: ['2', '30', '31', '50', '51', '60', '80', '81'], kisaru: 9990, teherauto: 34990 },
    { kulcs: 'orszagos', nev: 'Országos', elotagok: [''], kisaru: 14990, teherauto: 54990 },
];

export const SZALLITAS = {
    kisaruMaxKg: 500,
    teherautoMaxKg: 8000,
    // Darus lerakodás pótdíja fordulónként.
    darusPotdij: 15000,
    // Házhozszállítás csak ekkora termékérték felett (a céges kedvezmény után).
    minimumRendelesiErtek: 20000,
};

// Raklapos áruknál raklaponként felszámolt, visszahozáskor visszajáró betétdíj.
export const RAKLAP_BETETDIJ = 5000;

// Ha egy terméknél nincs megadva tömeg vagy raklap-kiszerelés, ezek az alapértékek
// érvényesek kategória és mértékegység szerint (egységenként: kg, illetve egység/raklap).
export const KATEGORIA_ALAPERTEKEK = {
    'Falazóanyagok': { 'm²': { suly: 200, raklapon: 5 } },
    'Térkövek és burkolatok': { 'm²': { suly: 130, raklapon: 10 } },
    'Tetőfedés': { 'm²': { suly: 45 } },
    'Hőszigetelés': { 'm²': { suly: 3 } },
    'Ömlesztett anyagok és betonok': { 'm³': { suly: 1700 } },
    'Cement és kötőanyagok': { 'm³': { suly: 1600 }, db: { suly: 25, raklapon: 40 } },
    'Faanyagok': { 'm³': { suly: 550 }, 'm²': { suly: 12 } },
};
export const ALAP_SULY_KG = 5;

// Céges vevők (érvényes adószámmal) mennyiségi kedvezménye a termékérték alapján.
export const CEGES_KEDVEZMENY_SAVOK = [
    { minimum: 3000000, szazalek: 7 },
    { minimum: 1000000, szazalek: 5 },
    { minimum: 300000, szazalek: 3 },
];

// Ekkora termékérték felett felajánljuk az egyedi árajánlatkérést.
export const ARAJANLAT_KUSZOB = 1000000;

// A díjbekérőn szereplő eladó. FIGYELEM: MINTA értékek – cseréld a valódiakra!
export const ELADO = {
    nev: 'Tüzép Kft.',
    cim: TELEPHELY.cim,
    adoszam: '00000000-0-00',
    bank: 'Minta Bank Zrt.',
    bankszamla: '00000000-00000000-00000000',
    email: TELEPHELY.email,
    telefon: TELEPHELY.telefon,
};

export const DIJBEKERO = {
    // A díjbekérő kiállításától számított fizetési határidő (nap).
    fizetesiHataridoNap: 8,
};

// Ennyi egység alatt „fogyóban” a termék: a dashboard ezt mutatja, és ha egy rendelés
// után a készlet e küszöb alá (vagy nullára) esik, a bolt e-mailt kap.
export const KESZLET_RIASZTASI_KUSZOB = 10;

// A bolt értesítési címe (új rendelés, készletriasztás). Az .env BOLT_ERTESITESI_EMAIL felülírja.
export const boltErtesitesiEmail = () => process.env.BOLT_ERTESITESI_EMAIL || TELEPHELY.email;
