import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBeallitasok } from '../utils/beallitasok';
import { forint } from '../utils/termek';
import './Jogi.css';

const datumFormazo = new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
});

// „ÉÉÉÉ-HH-NN” → „2026. november 13.”
const hatalyDatum = (verzio) => {
    const [ev, honap, nap] = verzio.split('-').map(Number);
    return datumFormazo.format(new Date(ev, honap - 1, nap));
};

// Az ÁSZF szövege. Ha érdemben módosul, a backend ASZF_VERZIO értékét
// (backend/config/uzlet.mjs) is át kell írni az új hatálybalépés napjára.
const Aszf = () => {
    const { adat, hiba } = useBeallitasok();
    const aszf = adat?.aszf;
    const elado = aszf?.elado;

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, []);

    return (
        <main className="jogi-oldal">
            <article className="jogi-kartya">
                <span className="jogi-felirat">Jogi információk</span>
                <h1>Általános Szerződési Feltételek</h1>
                <p className="jogi-hataly">
                    {aszf
                        ? `Hatályos: ${hatalyDatum(aszf.verzio)} napjától`
                        : 'A webáruház használatának és a vásárlásnak a feltételei'}
                </p>

                <p>
                    Jelen Általános Szerződési Feltételek (a továbbiakban:
                    ÁSZF) a webáruház használatának, valamint a webáruházon
                    keresztül leadott megrendeléseknek a feltételeit
                    tartalmazzák. Kérjük, a regisztráció és a rendelés előtt
                    figyelmesen olvasd el.
                </p>

                <h2>1. A Szolgáltató adatai</h2>
                {elado ? (
                    <dl className="jogi-adatok">
                        <dt>Cégnév</dt>
                        <dd>{elado.nev}</dd>
                        <dt>Székhely</dt>
                        <dd>{elado.cim}</dd>
                        <dt>Adószám</dt>
                        <dd>{elado.adoszam}</dd>
                        <dt>Cégjegyzékszám</dt>
                        <dd>{elado.cegjegyzekszam}</dd>
                        <dt>Nyilvántartó bíróság</dt>
                        <dd>{elado.nyilvantarto}</dd>
                        <dt>E-mail</dt>
                        <dd>
                            <a href={`mailto:${elado.email}`}>{elado.email}</a>
                        </dd>
                        <dt>Telefon</dt>
                        <dd>
                            <a href={`tel:${elado.telefon.replace(/\s/g, '')}`}>
                                {elado.telefon}
                            </a>
                        </dd>
                        <dt>Tárhelyszolgáltató</dt>
                        <dd>
                            {aszf.tarhely.nev}, {aszf.tarhely.cim},{' '}
                            {aszf.tarhely.email}
                        </dd>
                    </dl>
                ) : (
                    <p
                        className={hiba ? 'jogi-uzenet' : undefined}
                        role={hiba ? 'alert' : undefined}
                    >
                        {hiba
                            ? 'A Szolgáltató adatait most nem sikerült betölteni. Kérjük, próbáld újra később!'
                            : 'A Szolgáltató adatainak betöltése…'}
                    </p>
                )}

                <h2>2. Az ÁSZF hatálya és elfogadása</h2>
                <p>
                    Az ÁSZF a Szolgáltató és a webáruházat használó, ott
                    regisztráló vagy megrendelést leadó személy (a
                    továbbiakban: Vásárló) közötti jogviszonyra vonatkozik. A
                    regisztráció feltétele, hogy a Vásárló a regisztrációs
                    űrlapon a jelölőnégyzet bejelölésével kifejezetten
                    elfogadja az ÁSZF-et; ennek hiányában a regisztráció nem
                    jön létre. A Szolgáltató rögzíti az elfogadás időpontját
                    és az elfogadott ÁSZF változatát.
                </p>
                <p>
                    A Szolgáltató az ÁSZF-et módosíthatja. A módosítás a
                    webáruházban való közzététellel lép hatályba, és a már
                    leadott megrendeléseket nem érinti: azokra a megrendelés
                    időpontjában hatályos ÁSZF irányadó.
                </p>

                <h2>3. Regisztráció és felhasználói fiók</h2>
                <ul>
                    <li>
                        A regisztráció ingyenes. A Vásárló a regisztrációkor
                        valós adatokat (név, e-mail cím) köteles megadni.
                    </li>
                    <li>
                        A Vásárló felel a jelszava titokban tartásáért és a
                        fiókjával végzett tevékenységekért. Ha illetéktelen
                        hozzáférést észlel, köteles haladéktalanul jelezni a
                        Szolgáltatónak.
                    </li>
                    <li>
                        A Vásárló a fiókja törlését bármikor kérheti a
                        Szolgáltató e-mail címén. A törlés a jogszabály alapján
                        megőrzendő adatokat (például a számviteli
                        bizonylatokat) nem érinti.
                    </li>
                    <li>
                        A Szolgáltató felfüggesztheti vagy törölheti azt a
                        fiókot, amelyet valótlan adatokkal hoztak létre, vagy
                        amellyel visszaélést követtek el.
                    </li>
                </ul>

                <h2>4. Termékek és árak</h2>
                <p>
                    A termékek lényeges tulajdonságait, mértékegységét és árát
                    a termékoldalak tartalmazzák. A képek illusztrációk, a
                    természetes anyagok (például faanyag, kő) színe és
                    mintázata a képen láthatótól eltérhet. Az árak magyar
                    forintban értendők; a fizetendő végösszeget – a szállítási
                    díjjal és az esetleges betétdíjjal együtt – a megrendelés
                    elküldése előtt az összesítő mutatja.
                </p>
                <p>
                    Érvényes adószámmal rendelkező céges vevőknek a
                    Szolgáltató a rendelés értékétől függő mennyiségi
                    kedvezményt ad
                    {adat
                        ? `, ${forint(adat.arajanlatKuszob)} termékérték felett pedig egyedi árajánlat is kérhető`
                        : ''}
                    . Ha a webáruházban hibás ár jelenik meg (különösen
                    nyilvánvalóan téves, például 0 Ft-os ár), a Szolgáltató nem
                    köteles a terméket a hibás áron értékesíteni: felajánlja a
                    helyes áron történő teljesítést, amelynek ismeretében a
                    Vásárló elállhat a vásárlástól.
                </p>

                <h2>5. A megrendelés menete és a szerződés létrejötte</h2>
                <ul>
                    <li>
                        A Vásárló a kiválasztott termékeket a kosárba helyezi,
                        majd a pénztárban megadja a számlázási és az átvételi
                        adatokat, kiválasztja az átvétel és a fizetés módját,
                        végül elküldi a megrendelést. Az adatbeviteli hibák a
                        megrendelés elküldéséig bármikor javíthatók.
                    </li>
                    <li>
                        A megrendelés elküldése fizetési kötelezettséggel jár.
                    </li>
                    <li>
                        A Szolgáltató a megrendelés beérkezését e-mailben
                        visszaigazolja. Ha a visszaigazolás 48 órán belül nem
                        érkezik meg, a Vásárló mentesül az ajánlati kötöttség
                        alól. A szerződés a visszaigazolással jön létre.
                    </li>
                    <li>
                        A szerződés nyelve magyar. Az elektronikus úton kötött
                        szerződés nem minősül írásba foglalt szerződésnek; a
                        megrendelés adatait a Szolgáltató rögzíti, azok a
                        Vásárló fiókjában utólag is megtekinthetők.
                    </li>
                    <li>
                        Ha a megrendelt termék nem áll rendelkezésre, a
                        Szolgáltató erről haladéktalanul tájékoztatja a
                        Vásárlót, és a már kifizetett összeget visszatéríti.
                    </li>
                </ul>

                <h2>6. Fizetési feltételek</h2>
                <ul>
                    <li>
                        <strong>Bankkártyás fizetés:</strong> a fizetés a
                        Stripe biztonságos fizetési oldalán történik. A
                        kártyaadatokat a Stripe kezeli, azok a Szolgáltatóhoz
                        nem jutnak el.
                    </li>
                    <li>
                        <strong>Banki átutalás:</strong> a Szolgáltató
                        díjbekérőt állít ki, amelynek összegét a Vásárló
                        {aszf
                            ? ` a kiállítástól számított ${aszf.fizetesiHataridoNap} napon belül`
                            : ' a díjbekérőn megjelölt határidőig'}{' '}
                        köteles átutalni. A határidő eredménytelen eltelte után
                        a Szolgáltató a megrendelést törölheti.
                    </li>
                </ul>
                <p>
                    A Szolgáltató a teljesítésről számlát állít ki a megadott
                    számlázási adatok alapján.
                </p>

                <h2>7. Szállítás és átvétel</h2>
                <ul>
                    <li>
                        <strong>Személyes átvétel:</strong> a megrendelt
                        termékek a Szolgáltató telephelyén, nyitvatartási
                        időben, a pénztárban kiválasztott napon vehetők át.
                    </li>
                    <li>
                        <strong>Házhozszállítás:</strong> a szállítás díja a
                        szállítási cím irányítószámától és a rendelés tömegétől
                        függ, pontos összegét a pénztár összesítője mutatja. A
                        szállítás a pénztárban kiválasztott napon és idősávban
                        történik
                        {adat
                            ? `; házhozszállítás ${forint(adat.szallitas.minimumRendelesiErtek)} termékérték felett kérhető`
                            : ''}
                        .
                    </li>
                    <li>
                        A Vásárló köteles gondoskodni arról, hogy a szállítási
                        cím tehergépjárművel megközelíthető legyen, és az árut
                        a megadott időpontban át tudja venni. A darus lerakodás
                        külön díj ellenében kérhető.
                    </li>
                    <li>
                        <strong>Raklap-betétdíj:</strong> a raklapos árukhoz a
                        Szolgáltató raklaponként
                        {adat ? ` ${forint(adat.raklapBetetdij)}` : ''}{' '}
                        betétdíjat számít fel, amely a sérülésmentes raklap
                        visszaszolgáltatásakor visszajár.
                    </li>
                    <li>
                        A Vásárló az átvételkor köteles az árut megvizsgálni,
                        és a mennyiségi hiányt vagy a látható sérülést az
                        átvételi dokumentumon jelezni.
                    </li>
                </ul>

                <h2>8. Elállási jog</h2>
                <p>
                    A fogyasztónak minősülő Vásárlót (aki a szakmája, önálló
                    foglalkozása vagy üzleti tevékenysége körén kívül jár el) a
                    fogyasztó és a vállalkozás közötti szerződések részletes
                    szabályairól szóló 45/2014. (II. 26.) Korm. rendelet
                    alapján megilleti az indokolás nélküli elállás joga. Az
                    elállási jog a termék átvételétől – több termék esetén az
                    utolsó termék átvételétől – számított 14 napon belül
                    gyakorolható, a Szolgáltató e-mail címére küldött
                    egyértelmű nyilatkozattal.
                </p>
                <ul>
                    <li>
                        Elállás esetén a Vásárló köteles a terméket
                        haladéktalanul, de legkésőbb az elállás közlésétől
                        számított 14 napon belül visszajuttatni. A
                        visszajuttatás közvetlen költsége a Vásárlót terheli.
                    </li>
                    <li>
                        A Szolgáltató az elállásról való tudomásszerzéstől
                        számított 14 napon belül visszatéríti a Vásárló által
                        megfizetett teljes összeget, az alapszállítási díjjal
                        együtt, a Vásárló által használt fizetési móddal
                        megegyező módon. A visszatérítést a Szolgáltató
                        visszatarthatja, amíg a terméket vissza nem kapta, vagy
                        a Vásárló nem igazolta, hogy azt visszaküldte.
                    </li>
                    <li>
                        A Vásárló felel a termék jellegének, tulajdonságainak
                        és működésének megállapításához szükséges használatot
                        meghaladó használatból eredő értékcsökkenésért.
                    </li>
                </ul>
                <p>Nem illeti meg az elállási jog a Vásárlót</p>
                <ul>
                    <li>
                        olyan termék esetén, amelyet a Vásárló utasítása
                        alapján vagy kifejezett kérésére állítottak elő (például
                        méretre vágott faanyag, egyedileg kevert beton vagy
                        habarcs);
                    </li>
                    <li>
                        olyan termék esetén, amely jellegénél fogva az átadást
                        követően elválaszthatatlanul vegyül más termékkel
                        (például leborított ömlesztett sóder, homok vagy
                        termőföld);
                    </li>
                    <li>gyorsan romló vagy minőségét rövid ideig megőrző termék esetén.</li>
                </ul>
                <p>
                    A nem fogyasztónak minősülő (céges) Vásárlót az indokolás
                    nélküli elállás joga nem illeti meg.
                </p>

                <h2>9. Szavatosság és jótállás</h2>
                <p>
                    A Szolgáltató hibás teljesítése esetén a Vásárló a Polgári
                    Törvénykönyvről szóló 2013. évi V. törvény szabályai
                    szerint <strong>kellékszavatossági</strong> igényt
                    érvényesíthet: elsősorban kijavítást vagy kicserélést
                    kérhet, ha pedig ez nem lehetséges, vagy a Szolgáltató nem
                    vállalja, árleszállítást igényelhet, vagy elállhat a
                    szerződéstől. A fogyasztó a hibát a felfedezése után
                    késedelem nélkül, de legkésőbb két hónapon belül köteles
                    közölni; a kellékszavatossági igény a teljesítéstől
                    számított két év alatt évül el. A teljesítéstől számított
                    egy éven belül felismert hibáról vélelmezni kell, hogy az
                    már a teljesítéskor megvolt.
                </p>
                <p>
                    A fogyasztó a termék hibája esetén – választása szerint –
                    a gyártóval szemben <strong>termékszavatossági</strong>{' '}
                    igényt is érvényesíthet a termék forgalomba hozatalától
                    számított két éven belül. Ugyanazon hiba miatt
                    kellékszavatossági és termékszavatossági igény egyszerre,
                    egymással párhuzamosan nem érvényesíthető. Ha valamely
                    termékre jogszabály vagy a gyártó jótállást ír elő, annak
                    feltételeit a termékhez mellékelt jótállási jegy
                    tartalmazza.
                </p>

                <h2>10. Panaszkezelés és jogérvényesítés</h2>
                <p>
                    A Vásárló a panaszát a Szolgáltató 1. pontban megadott
                    elérhetőségein terjesztheti elő. A Szolgáltató az írásbeli
                    panaszt 30 napon belül érdemben, írásban megválaszolja, a
                    panasz elutasítását megindokolja.
                </p>
                <p>
                    Ha a panaszt a Szolgáltató elutasítja, a fogyasztó
                    díjmentesen a lakóhelye vagy tartózkodási helye szerint
                    illetékes békéltető testülethez fordulhat (a testületek
                    elérhetősége:{' '}
                    <a
                        href="https://www.bekeltetes.hu"
                        target="_blank"
                        rel="noreferrer"
                    >
                        bekeltetes.hu
                    </a>
                    ), amelynek eljárásában a Szolgáltatót együttműködési
                    kötelezettség terheli. A fogyasztó panasszal élhet továbbá
                    a lakóhelye szerint illetékes vármegyei (fővárosi)
                    kormányhivatal fogyasztóvédelmi hatóságánál, illetve
                    igényét bíróság előtt érvényesítheti.
                </p>

                <h2>11. Adatkezelés és sütik</h2>
                <p>
                    A Szolgáltató a Vásárló személyes adatait (név, e-mail cím,
                    számlázási és szállítási adatok) a szerződés teljesítése és
                    a jogszabályi kötelezettségei teljesítése érdekében kezeli,
                    az Európai Unió általános adatvédelmi rendeletének (GDPR)
                    megfelelően. Az adatokat a Szolgáltató csak a teljesítéshez
                    szükséges körben adja át harmadik félnek (például a
                    fizetési szolgáltatónak). A webáruház által használt
                    sütikről a{' '}
                    <Link to="/sutik">Sütitájékoztató</Link> ad részletes
                    felvilágosítást.
                </p>

                <h2>12. Záró rendelkezések</h2>
                <p>
                    Az ÁSZF-ben nem szabályozott kérdésekben a magyar jog,
                    különösen a Polgári Törvénykönyvről szóló 2013. évi V.
                    törvény, az elektronikus kereskedelmi szolgáltatások,
                    valamint az információs társadalommal összefüggő
                    szolgáltatások egyes kérdéseiről szóló 2001. évi CVIII.
                    törvény, valamint a 45/2014. (II. 26.) Korm. rendelet
                    rendelkezései irányadók. Ha az ÁSZF valamely rendelkezése
                    érvénytelen, az a többi rendelkezés érvényességét nem
                    érinti.
                </p>
            </article>
        </main>
    );
};

export default Aszf;
