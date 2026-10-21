import { Link } from 'react-router-dom';
import './Home.css';

const ikonUtak = {
    nyil: (
        <>
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
        </>
    ),
    teglafal: (
        <>
            <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="1"
            />
            <path d="M3 9.67h18M3 14.33h18M9 5v4.67M15 9.67v4.66M9 14.33V19" />
        </>
    ),
    cement: (
        <>
            <path d="M7 3h10l2 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7l2-4z" />
            <path d="M5 7h14M9 12h6" />
        </>
    ),
    faanyag: (
        <>
            <rect
                x="3"
                y="4"
                width="18"
                height="4"
                rx="1"
            />
            <rect
                x="3"
                y="10"
                width="18"
                height="4"
                rx="1"
            />
            <rect
                x="3"
                y="16"
                width="18"
                height="4"
                rx="1"
            />
        </>
    ),
    teto: (
        <>
            <path d="m3 12 9-8 9 8" />
            <path d="M5 10v10h14V10" />
            <path d="M10 20v-6h4v6" />
        </>
    ),
    szigeteles: (
        <>
            <path d="M3 8c3-3 6 3 9 0s6 3 9 0" />
            <path d="M3 13c3-3 6 3 9 0s6 3 9 0" />
            <path d="M3 18c3-3 6 3 9 0s6 3 9 0" />
        </>
    ),
    szerszam: (
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    ),
    szallitas: (
        <>
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
            <path d="M15 18H9" />
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
            <circle
                cx="17"
                cy="18"
                r="2"
            />
            <circle
                cx="7"
                cy="18"
                r="2"
            />
        </>
    ),
    csomag: (
        <>
            <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
            <path d="M12 22V12" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="m7.5 4.27 9 5.15" />
        </>
    ),
    ar: (
        <>
            <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
            <circle
                cx="7.5"
                cy="7.5"
                r=".5"
                fill="currentColor"
            />
        </>
    ),
    minoseg: (
        <>
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            <path d="m9 12 2 2 4-4" />
        </>
    ),
    tanacs: (
        <>
            <circle
                cx="12"
                cy="8"
                r="4"
            />
            <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
        </>
    ),
};

const Ikon = ({ nev }) => {
    return (
        <svg
            className="home-ikon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {ikonUtak[nev]}
        </svg>
    );
};

const kategoriak = [
    {
        ikon: 'teglafal',
        nev: 'Falazóanyagok',
        leiras: 'Tégla, falazóblokk és áthidalók a tartós szerkezetekhez.',
    },
    {
        ikon: 'cement',
        nev: 'Cement és kötőanyagok',
        leiras: 'Cement, habarcs, ragasztók és vakolatok minden munkához.',
    },
    {
        ikon: 'faanyag',
        nev: 'Faanyagok',
        leiras: 'Gerendák, deszkák és lemezek szerkezetekhez és belső munkákhoz.',
    },
    {
        ikon: 'teto',
        nev: 'Tetőfedés',
        leiras: 'Cserép, lemez és tetőtartozékok a biztos fedélért.',
    },
    {
        ikon: 'szigeteles',
        nev: 'Hőszigetelés',
        leiras: 'Szigetelőanyagok, hogy a ház télen is meleg, nyáron hűvös legyen.',
    },
    {
        ikon: 'szerszam',
        nev: 'Szerszámok és kellékek',
        leiras: 'Kéziszerszámok, rögzítők és munkavédelmi eszközök.',
    },
];

const elonyok = [
    {
        ikon: 'szallitas',
        nev: 'Kiszállítás',
        leiras: 'Az anyagot az építkezés helyszínére szállítjuk.',
    },
    {
        ikon: 'csomag',
        nev: 'Széles választék',
        leiras: 'Az alapozástól a tetőig mindent egy helyen megtalálsz.',
    },
    {
        ikon: 'ar',
        nev: 'Kedvező árak',
        leiras: 'Versenyképes árak, nagyobb tételnél is.',
    },
    {
        ikon: 'tanacs',
        nev: 'Szakmai tanácsadás',
        leiras: 'Segítünk kiválasztani a munkához illő anyagot.',
    },
];

const Home = () => {
    return (
        <div className="home-kontener">
            <section
                className="home-hero"
                aria-labelledby="home-cim"
            >
                <div className="home-belso home-hero-belso">
                    <div className="home-hero-szoveg">
                        <span className="home-jelveny">
                            Tüzép és építőanyag-kereskedés
                        </span>
                        <h1 id="home-cim">
                            Minden, ami az építkezéshez kell –{' '}
                            <span className="home-kiemeles">egy helyen</span>
                        </h1>
                        <p className="home-bevezeto">
                            Minőségi építőanyagok, kedvező árak és gyors
                            kiszállítás házépítőknek, felújítóknak és
                            szakembereknek egyaránt.
                        </p>
                        <div className="home-gombok">
                            <Link
                                to="/termekek"
                                className="home-gomb home-gomb-elsodleges"
                            >
                                Termékek megtekintése
                                <Ikon nev="nyil" />
                            </Link>
                            <Link
                                to="/register"
                                className="home-gomb home-gomb-masodlagos"
                            >
                                Regisztráció
                            </Link>
                        </div>
                        <ul className="home-hero-lista">
                            <li>
                                <Ikon nev="minoseg" />
                                Minőségi anyagok
                            </li>
                            <li>
                                <Ikon nev="szallitas" />
                                Gyors kiszállítás
                            </li>
                            <li>
                                <Ikon nev="tanacs" />
                                Szaktanácsadás
                            </li>
                        </ul>
                    </div>

                    <div
                        className="home-hero-kep"
                        aria-hidden="true"
                    >
                        <div className="home-hero-kartya home-hero-kartya-1">
                            <span className="home-hero-kartya-ikon">
                                <Ikon nev="szallitas" />
                            </span>
                            <div>
                                <strong>Kiszállítás</strong>
                                <small>Az építkezés helyszínére</small>
                            </div>
                        </div>
                        <div className="home-hero-kartya home-hero-kartya-2">
                            <span className="home-hero-kartya-ikon">
                                <Ikon nev="csomag" />
                            </span>
                            <div>
                                <strong>Raktárról</strong>
                                <small>Széles termékválaszték</small>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section
                className="home-szekcio"
                aria-labelledby="home-kategoriak-cim"
            >
                <div className="home-belso">
                    <header className="home-szekcio-fej">
                        <span className="home-felirat">Kínálatunk</span>
                        <h2 id="home-kategoriak-cim">Termékkategóriák</h2>
                        <p>
                            Válassz a legfontosabb építőanyag-csoportjaink
                            közül.
                        </p>
                    </header>
                    <div className="home-kategoriak">
                        {kategoriak.map((kategoria) => {
                            return (
                                <Link
                                    key={kategoria.nev}
                                    to="/termekek"
                                    className="home-kategoria"
                                >
                                    <span className="home-kategoria-ikon">
                                        <Ikon nev={kategoria.ikon} />
                                    </span>
                                    <h3>{kategoria.nev}</h3>
                                    <p>{kategoria.leiras}</p>
                                    <span className="home-kategoria-tovabb">
                                        Megnézem
                                        <Ikon nev="nyil" />
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section
                className="home-szekcio home-szekcio-sotet"
                aria-labelledby="home-elonyok-cim"
            >
                <div className="home-belso">
                    <header className="home-szekcio-fej">
                        <span className="home-felirat">Miért mi?</span>
                        <h2 id="home-elonyok-cim">
                            Megbízható partner az építkezésen
                        </h2>
                        <p>
                            Azért dolgozunk, hogy a munkád ne az anyagbeszerzésen
                            akadjon el.
                        </p>
                    </header>
                    <ul className="home-elonyok">
                        {elonyok.map((elony) => {
                            return (
                                <li
                                    key={elony.nev}
                                    className="home-elony"
                                >
                                    <span className="home-elony-ikon">
                                        <Ikon nev={elony.ikon} />
                                    </span>
                                    <h3>{elony.nev}</h3>
                                    <p>{elony.leiras}</p>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </section>

            <section
                className="home-szekcio"
                aria-labelledby="home-cta-cim"
            >
                <div className="home-belso">
                    <div className="home-cta">
                        <div>
                            <h2 id="home-cta-cim">Kezdjük el az építkezést!</h2>
                            <p>
                                Regisztrálj, böngéssz a termékeink között, és
                                állítsd össze a következő projekted anyaglistáját.
                            </p>
                        </div>
                        <div className="home-gombok">
                            <Link
                                to="/register"
                                className="home-gomb home-gomb-elsodleges"
                            >
                                Regisztráció
                            </Link>
                            <Link
                                to="/login"
                                className="home-gomb home-gomb-masodlagos"
                            >
                                Bejelentkezés
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
