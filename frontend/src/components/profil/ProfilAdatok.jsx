import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiKeres } from '../../utils/api';
import Uzenet from './Uzenet';

// Név és e-mail-cím módosítása. Az e-mail a belépési azonosító, ezért a
// megváltoztatásához a szerver a jelenlegi jelszót is kéri.
const ProfilAdatok = () => {
    const { user, login } = useAuth();
    const [nev, setNev] = useState(user.nev);
    const [email, setEmail] = useState(user.email);
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
                body: { nev, email, jelszo: emailValtozott ? jelszo : undefined },
            });
            // A menü és a munkamenet tárolt adatai is az új nevet és címet mutatják.
            login(valasz.user);
            setNev(valasz.user.nev);
            setEmail(valasz.user.email);
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
