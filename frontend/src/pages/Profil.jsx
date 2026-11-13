import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Arajanlataim from '../components/profil/Arajanlataim';
import FiokKezeles from '../components/profil/FiokKezeles';
import JelszoModositas from '../components/profil/JelszoModositas';
import MentettAdatok from '../components/profil/MentettAdatok';
import ProfilAdatok from '../components/profil/ProfilAdatok';
import RaklapEgyenleg from '../components/profil/RaklapEgyenleg';
import SajatRendeles from '../components/profil/SajatRendeles';
import { useLekeres } from '../utils/api';
import './Auth.css';
import './Profil.css';

// A fülek az URL hash-éből nyílnak (#rendeleseim, #adataim…), így a menüből és
// az e-mailekből közvetlenül hivatkozhatók, és a böngésző vissza gombja is működik.
const FULEK = [
    { kulcs: 'rendeleseim', cimke: 'Rendeléseim' },
    { kulcs: 'arajanlataim', cimke: 'Árajánlataim' },
    { kulcs: 'adataim', cimke: 'Adataim' },
    { kulcs: 'fiok', cimke: 'Biztonság és fiók' },
];

const Rendeleseim = () => {
    const { adat, hiba, betoltes, ujratolt, modosit } = useLekeres('/rendelesek/sajat');

    const frissult = (uj) => modosit((elozo) => ({
        ...elozo,
        rendelesek: elozo.rendelesek.map((rendeles) => (rendeles.id === uj.id ? uj : rendeles)),
    }));

    return (
        <section
            className="profil-rendelesek"
            aria-labelledby="rendeleseim-cim"
            aria-busy={betoltes}
        >
            <div className="profil-rendelesek-fej">
                <h2 id="rendeleseim-cim">Rendeléseim</h2>
                <p>A bejelentkezve leadott rendeléseid és azok állapota.</p>
            </div>

            {hiba && (
                <p
                    className="auth-uzenet auth-hiba"
                    role="alert"
                >
                    {hiba}
                </p>
            )}
            {!adat ? (
                !hiba && <p className="profil-rendelesek-uzenet">Rendelések betöltése…</p>
            ) : adat.rendelesek.length === 0 ? (
                <div className="profil-rendelesek-uzenet">
                    <p>Még nincs rendelésed.</p>
                    <Link to="/termekek">Nézz körül a termékek között</Link>
                </div>
            ) : (
                <>
                    <RaklapEgyenleg egyenleg={adat.raklapEgyenleg} />
                    <div className="profil-rendelesek-lista">
                        {adat.rendelesek.map((rendeles) => (
                            <SajatRendeles
                                key={rendeles.id}
                                rendeles={rendeles}
                                frissult={frissult}
                                ujratolt={ujratolt}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
};

const Adataim = () => {
    const { adat, hiba, modosit } = useLekeres('/fiok');

    return (
        <div className="profil-panelek">
            <ProfilAdatok />
            {hiba ? (
                <p
                    className="auth-uzenet auth-hiba"
                    role="alert"
                >
                    {hiba}
                </p>
            ) : !adat ? (
                <p className="profil-rendelesek-uzenet">Mentett adatok betöltése…</p>
            ) : (
                <MentettAdatok
                    mentettAdatok={adat.mentettAdatok}
                    mentve={(mentettAdatok) => modosit((elozo) => ({ ...elozo, mentettAdatok }))}
                />
            )}
        </div>
    );
};

const Fiok = () => (
    <div className="profil-panelek">
        <JelszoModositas />
        <FiokKezeles />
    </div>
);

const TARTALOM = {
    rendeleseim: Rendeleseim,
    arajanlataim: Arajanlataim,
    adataim: Adataim,
    fiok: Fiok,
};

const Profil = () => {
    const { user, authReady } = useAuth();
    const location = useLocation();

    // Oldalfrissítéskor a munkamenet ellenőrzéséig nem irányítunk át a belépéshez.
    if (!authReady) {
        return <div className="auth-kontener"><p>Munkamenet ellenőrzése…</p></div>;
    }

    if (!user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: `/profil${location.hash}` }}
            />
        );
    }

    const aktiv = FULEK.find((ful) => `#${ful.kulcs}` === location.hash)?.kulcs ?? FULEK[0].kulcs;
    const Tartalom = TARTALOM[aktiv];
    const kezdobetu = (user.nev || user.email || '?')
        .trim()
        .charAt(0)
        .toUpperCase();

    return (
        <div className="auth-kontener profil-oldal">
            <div className="profil-racs">
                <aside className="auth-kartya profil-kartya">
                    <div className="profil-fej">
                        <span
                            className="profil-avatar"
                            aria-hidden="true"
                        >
                            {kezdobetu}
                        </span>
                        <div className="profil-adatok">
                            <h1>{user.nev}</h1>
                            <p>{user.email}</p>
                        </div>
                    </div>

                    <nav
                        className="profil-fulek"
                        aria-label="Profil részei"
                    >
                        {FULEK.map((ful) => (
                            <Link
                                key={ful.kulcs}
                                to={{ hash: `#${ful.kulcs}` }}
                                aria-current={ful.kulcs === aktiv ? 'page' : undefined}
                            >
                                {ful.cimke}
                            </Link>
                        ))}
                    </nav>
                </aside>

                {/* A kulcs miatt fiókváltáskor a fül saját állapota (űrlapok, betöltött listák) újraindul. */}
                <div className="profil-tartalom">
                    <Tartalom key={`${user.id}-${aktiv}`} />
                </div>
            </div>
        </div>
    );
};

export default Profil;
