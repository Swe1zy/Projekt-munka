import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TAJEKOZTATAS_SUTI, TAJEKOZTATAS_SUTI_NAPOK } from '../utils/sutik';
import './Jogi.css';

const SutiTajekoztato = () => {
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, []);

    return (
        <main className="jogi-oldal">
            <article className="jogi-kartya">
                <span className="jogi-felirat">Jogi információk</span>
                <h1>Sütitájékoztató</h1>
                <p className="jogi-hataly">
                    Milyen sütiket (cookie-kat) használ a webáruház, és mire.
                </p>

                <p>
                    A süti egy kis adatfájl, amelyet a weboldal a böngésződben
                    tárol. A webáruház <strong>kizárólag a működéséhez
                    elengedhetetlen sütiket</strong> használ: ezek nélkül nem
                    tudnál bejelentkezni, kosarat összeállítani vagy fizetni.
                    Statisztikai, marketing- vagy hirdetési célú sütiket nem
                    alkalmazunk, és a látogatóinkat nem követjük más
                    weboldalakon.
                </p>
                <p>
                    Az elengedhetetlen sütikhez a jogszabályok szerint nem kell
                    a hozzájárulásodat kérnünk, tájékoztatnunk viszont kell
                    róluk – erre szolgál ez az oldal és az első látogatáskor
                    megjelenő sáv.
                </p>

                <h2>1. A webáruház saját sütijei</h2>
                <div className="jogi-tabla-keret">
                    <table className="jogi-tabla">
                        <thead>
                            <tr>
                                <th scope="col">Süti neve</th>
                                <th scope="col">Mire szolgál</th>
                                <th scope="col">Élettartam</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <code>projekt_session</code>
                                </td>
                                <td>
                                    A bejelentkezett munkamenetedet azonosítja,
                                    hogy ne kelljen minden oldalon újra
                                    belépned. Bejelentkezéskor jön létre, a
                                    böngészőben futó kód nem fér hozzá
                                    (HttpOnly).
                                </td>
                                <td>12 óra, vagy a kijelentkezésig</td>
                            </tr>
                            <tr>
                                <td>
                                    <code>{TAJEKOZTATAS_SUTI}</code>
                                </td>
                                <td>
                                    Megjegyzi, hogy a sütikről szóló
                                    tájékoztató sávot már tudomásul vetted, így
                                    az nem jelenik meg újra.
                                </td>
                                <td>{TAJEKOZTATAS_SUTI_NAPOK} nap</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h2>2. A böngésző helyi tárolója</h2>
                <p>
                    A sütik mellett a böngésződ helyi tárolójába (localStorage)
                    is mentünk a működéshez szükséges adatokat. Ezek az adatok
                    a saját eszközödön maradnak, a böngésző nem küldi el őket
                    automatikusan a szervernek.
                </p>
                <div className="jogi-tabla-keret">
                    <table className="jogi-tabla">
                        <thead>
                            <tr>
                                <th scope="col">Kulcs</th>
                                <th scope="col">Mire szolgál</th>
                                <th scope="col">Meddig marad meg</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <code>kosar</code>
                                </td>
                                <td>
                                    A kosarad tartalma, hogy az oldal
                                    újratöltése vagy bezárása után is
                                    megmaradjon.
                                </td>
                                <td>
                                    Amíg ki nem üríted a kosarat, vagy nem
                                    törlöd a böngésző adatait
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <code>felhasznalo</code>
                                </td>
                                <td>
                                    A bejelentkezett fiókod neve, e-mail címe
                                    és jogosultsága, hogy a menü azonnal a
                                    megfelelő állapotban jelenjen meg.
                                </td>
                                <td>A kijelentkezésig</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h2>3. Külső szolgáltatók</h2>
                <ul>
                    <li>
                        <strong>Stripe (bankkártyás fizetés):</strong> ha
                        bankkártyával fizetsz, a Stripe saját fizetési oldalára
                        irányítunk át. A Stripe ott a fizetés lebonyolításához
                        és a csalások megelőzéséhez saját sütiket használ;
                        ezekről a{' '}
                        <a
                            href="https://stripe.com/cookies-policy/legal"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Stripe sütitájékoztatója
                        </a>{' '}
                        ad felvilágosítást.
                    </li>
                    <li>
                        <strong>OpenStreetMap (térkép):</strong> a pénztár
                        oldalán a telephelyet beágyazott OpenStreetMap-térkép
                        mutatja. A térkép betöltésekor a böngésződ az
                        OpenStreetMap szervereihez kapcsolódik, amely a saját{' '}
                        <a
                            href="https://osmfoundation.org/wiki/Privacy_Policy"
                            target="_blank"
                            rel="noreferrer"
                        >
                            adatvédelmi szabályzata
                        </a>{' '}
                        szerint jár el.
                    </li>
                </ul>

                <h2>4. A sütik törlése és tiltása</h2>
                <p>
                    A sütiket és a helyi tárolót a böngésződ beállításaiban
                    bármikor törölheted, illetve a sütik használatát le is
                    tilthatod. Mivel az oldal csak elengedhetetlen sütiket
                    használ, a tiltásuk után a bejelentkezés és a rendelés nem
                    fog működni.
                </p>
                <p>
                    A vásárlás további feltételeit az{' '}
                    <Link to="/aszf">Általános Szerződési Feltételek</Link>{' '}
                    tartalmazzák.
                </p>
            </article>
        </main>
    );
};

export default SutiTajekoztato;
