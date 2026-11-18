import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiKeres } from '../../utils/api';
import { datum } from '../../utils/dashboardFormazas';
import { TELEFON_MINTA, TELEFON_PELDA } from '../../utils/fiok';
import Uzenet from './Uzenet';

// Név, e-mail-cím és telefonszám módosítása. Az e-mail a belépési azonosító, ezért a
// megváltoztatásához a szerver a jelenlegi jelszót is kéri. `frissult` a szerver
// válaszával (a teljes fiókadattal) frissíti az Adataim fület.
const ProfilAdatok = ({ fiok, frissult }) => {
    const { user, login } = useAuth();
    const [nev, setNev] = useState(user.nev);
    const [email, setEmail] = useState(user.email);
    const [telefon, setTelefon] = useState(fiok.telefon);
    const [jelszo, setJelszo] = useState('');
    const [uzenet, setUzenet] = useState(null);
    const [kuldes, setKuldes] = useState(false);

    const admin = user.role === 'admin';
    const emailValtozott = email.trim().toLowerCase() !== user.email;

    const bekuld = async (event) => {
        event.preventDefault();
        setUzenet(null);
        setKuldes(true);

        try {
            const valasz = await apiKeres('/fiok', {
                method: 'PATCH',
                body: { nev, email, telefon, jelszo: emailValtozott ? jelszo : undefined },
            });
            // A menü és a munkamenet tárolt adatai is az új nevet és címet mutatják.
            login(valasz.user);
            frissult(valasz);
            setNev(valasz.user.nev);
            setEmail(valasz.user.email);
            setTelefon(valasz.telefon);
            setJelszo('');
            setUzenet({ tipus: 'siker', szoveg: valasz.msg });
        } catch (error) {
            setUzenet({ tipus: 'hiba', szoveg: error.message });
        } finally {
            setKuldes(false);
        }
    };

    return (
        <form
            className="profil-panel profil-urlap"
            onSubmit={bekuld}
        >
            <div className="profil-panel-fej">
                <h2>Személyes adatok</h2>
                <p>A neved a fiókodban és a menüben jelenik meg, az e-mail-címeddel lépsz be.</p>
            </div>

            <dl className="profil-fiok-info">
                {fiok.regisztralt && (
                    <div>
                        <dt>Regisztráltál</dt>
                        <dd>{datum(fiok.regisztralt)}</dd>
                    </div>
                )}
                <div>
                    <dt>Általános Szerződési Feltételek</dt>
                    <dd>
                        {fiok.aszfElfogadas
                            ? `${fiok.aszfElfogadas.verzio} verzió, elfogadva: ${datum(fiok.aszfElfogadas.idopont)}`
                            : 'Nincs rögzített elfogadás'}
                    </dd>
                </div>
            </dl>

            <div className="profil-mezo-par">
                <label className="auth-mezo">
                    Név
                    <input
                        type="text"
                        autoComplete="name"
                        minLength="2"
                        maxLength="120"
                        value={nev}
                        onChange={(event) => setNev(event.target.value)}
                        disabled={admin}
                        required
                    />
                </label>
                <label className="auth-mezo">
                    E-mail cím
                    <input
                        type="email"
                        autoComplete="email"
                        maxLength="200"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        disabled={admin}
                        required
                    />
                </label>
                <label className="auth-mezo">
                    Telefonszám
                    <input
                        type="tel"
                        autoComplete="tel"
                        pattern={TELEFON_MINTA}
                        title={`Pl. ${TELEFON_PELDA}`}
                        maxLength="40"
                        value={telefon}
                        onChange={(event) => setTelefon(event.target.value)}
                        placeholder={TELEFON_PELDA}
                        disabled={admin}
                    />
                    <small>Kiszállításkor ezen a számon keres a sofőr. A pénztár ezzel tölti ki előre a mezőt.</small>
                </label>
            </div>

            {emailValtozott && (
                <label className="auth-mezo">
                    Jelenlegi jelszó
                    <input
                        type="password"
                        autoComplete="current-password"
                        value={jelszo}
                        onChange={(event) => setJelszo(event.target.value)}
                        required
                    />
                    <small>
                        Az e-mail-cím módosítását a jelszavaddal kell megerősítened. A korábbi
                        rendeléseid visszaigazolásai a régi címen maradnak.
                    </small>
                </label>
            )}

            {admin && (
                <p className="profil-megjegyzes">
                    Az admin fiók neve és e-mail-címe a szerver beállításaiban módosítható.
                </p>
            )}
            <Uzenet uzenet={uzenet} />

            {!admin && (
                <div className="profil-gombok">
                    <button
                        type="submit"
                        className="auth-gomb"
                        disabled={kuldes}
                    >
                        {kuldes ? 'Mentés…' : 'Adatok mentése'}
                    </button>
                </div>
            )}
        </form>
    );
};

export default ProfilAdatok;
