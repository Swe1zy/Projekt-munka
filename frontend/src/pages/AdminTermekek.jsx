import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import './AdminTermekek.css';

const KATEGORIAK = [
    'Falazóanyagok',
    'Cement és kötőanyagok',
    'Faanyagok',
    'Tetőfedés',
    'Hőszigetelés',
    'Szerszámok és kellékek',
];

const uresUrlap = () => ({
    id: '',
    nev: '',
    kategoria: '',
    leiras: '',
    ar: '',
    kepek: [''],
});

const kepekLista = (termek) => {
    if (Array.isArray(termek.kepek) && termek.kepek.length) return termek.kepek;
    return [termek.kep, termek.kep1, termek.kep2, termek.kep3].filter(Boolean);
};

const fajlDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Nem sikerült beolvasni: ${file.name}`));
    reader.readAsDataURL(file);
});

const AdminTermekek = () => {
    const { user, authReady } = useAuth();
    const location = useLocation();
    const [termekek, setTermekek] = useState([]);
    const [urlap, setUrlap] = useState(uresUrlap);
    const [betoltes, setBetoltes] = useState(true);
    const [kuldes, setKuldes] = useState(false);
    const [hiba, setHiba] = useState('');

    const termekekBetoltese = useCallback(async () => {
        const response = await fetch(`${API_URL}/frontend-termekek`, { credentials: 'include' });
        const valasz = await response.json();
        if (!response.ok) throw new Error(valasz.msg || 'A terméklista betöltése nem sikerült.');
        setTermekek(valasz.termekek);
    }, []);

    useEffect(() => {
        if (!authReady || user?.role !== 'admin') return;
        let aktiv = true;
        const timeout = window.setTimeout(() => {
            termekekBetoltese()
                .catch((error) => {
                    if (aktiv) setHiba(error.message);
                })
                .finally(() => {
                    if (aktiv) setBetoltes(false);
                });
        }, 0);

        return () => {
            aktiv = false;
            window.clearTimeout(timeout);
        };
    }, [authReady, user, termekekBetoltese]);

    if (!authReady) return <p className="admin-allapot">Munkamenet ellenőrzése…</p>;
    if (!user || user.role !== 'admin') {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    const mezoFrissitese = (mezo, ertek) => setUrlap((elozo) => ({ ...elozo, [mezo]: ertek }));

    const termekSzerkesztese = (termek) => {
        setUrlap({
            id: termek._id,
            nev: termek.nev || '',
            kategoria: termek.kategoria || '',
            leiras: termek.leiras || '',
            ar: String(termek.ar ?? ''),
            kepek: kepekLista(termek).length ? kepekLista(termek) : [''],
        });
        setHiba('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const fajlokHozzaadasa = async (event) => {
        const fajlok = [...event.target.files];
        event.target.value = '';
        const totalSize = fajlok.reduce((total, file) => total + file.size, 0);
        if (fajlok.some((file) => !file.type.startsWith('image/'))) {
            setHiba('Csak képfájl tölthető fel.');
            return;
        }
        const tulmeretes = fajlok.find((file) => file.size > 8 * 1024 * 1024);
        if (tulmeretes) {
            setHiba(`${tulmeretes.name}: egy kép legfeljebb 8 MB lehet.`);
            return;
        }
        if (totalSize > 20 * 1024 * 1024) {
            setHiba('A képek együttes mérete legfeljebb 20 MB lehet egy feltöltésnél.');
            return;
        }
        try {
            const ujKepek = await Promise.all(fajlok.map(fajlDataUrl));
            setUrlap((elozo) => ({ ...elozo, kepek: [...elozo.kepek.filter(Boolean), ...ujKepek] }));
            setHiba('');
        } catch (error) {
            setHiba(error.message);
        }
    };

    const mentes = async (event) => {
        event.preventDefault();
        setHiba('');
        const kepek = urlap.kepek.map((kep) => kep.trim()).filter(Boolean);
        const ar = Number(urlap.ar);
        if (!urlap.nev.trim() || !urlap.kategoria || !urlap.leiras.trim() || !Number.isFinite(ar) || ar < 0 || !kepek.length) {
            setHiba('Töltsd ki a nevet, kategóriát, leírást, érvényes árat és adj meg legalább egy képet.');
            return;
        }

        setKuldes(true);
        try {
            const szerkesztes = Boolean(urlap.id);
            const response = await fetch(
                szerkesztes ? `${API_URL}/termekek/${urlap.id}` : `${API_URL}/new-termek`,
                {
                    method: szerkesztes ? 'PUT' : 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nev: urlap.nev.trim(),
                        kategoria: urlap.kategoria,
                        leiras: urlap.leiras.trim(),
                        ar,
                        kepek,
                    }),
                },
            );
            const valasz = await response.json();
            if (!response.ok) throw new Error(valasz.msg || 'A mentés nem sikerült.');
            await termekekBetoltese();
            setUrlap(uresUrlap());
        } catch (error) {
            setHiba(error.message || 'A mentés nem sikerült.');
        } finally {
            setKuldes(false);
        }
    };

    const termekTorlese = async (termek) => {
        if (!window.confirm(`Biztosan törlöd ezt a terméket: ${termek.nev}?`)) return;
        setHiba('');
        try {
            const response = await fetch(`${API_URL}/termekek/${termek._id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const valasz = await response.json();
            if (!response.ok) throw new Error(valasz.msg || 'A törlés nem sikerült.');
            if (urlap.id === termek._id) setUrlap(uresUrlap());
            await termekekBetoltese();
        } catch (error) {
            setHiba(error.message || 'A törlés nem sikerült.');
        }
    };

    return (
        <main className="admin-termekek">
            <header className="admin-termekek-fejlec">
                <div>
                    <span>ADMINISZTRÁCIÓ</span>
                    <h1>Termékkezelés</h1>
                    <p>Új termékek feltöltése, meglévők módosítása és törlése.</p>
                </div>
                <Link to="/termekek">Vissza a termékekhez</Link>
            </header>

            <form className="admin-termek-urlap" onSubmit={mentes}>
                <h2>{urlap.id ? 'Termék módosítása' : 'Új termék feltöltése'}</h2>
                <label>Név<input value={urlap.nev} onChange={(event) => mezoFrissitese('nev', event.target.value)} required /></label>
                <label>Kategória
                    <select value={urlap.kategoria} onChange={(event) => mezoFrissitese('kategoria', event.target.value)} required>
                        <option value="" disabled>Válassz kategóriát</option>
                        {KATEGORIAK.map((kategoria) => <option key={kategoria} value={kategoria}>{kategoria}</option>)}
                    </select>
                </label>
                <label>Leírás<textarea rows="4" value={urlap.leiras} onChange={(event) => mezoFrissitese('leiras', event.target.value)} required /></label>
                <label>Ár (Ft)<input type="number" min="0" step="0.01" value={urlap.ar} onChange={(event) => mezoFrissitese('ar', event.target.value)} required /></label>
                <div className="admin-kepek-fejlec"><strong>Termékképek</strong><label className="admin-fajl-gomb">Képek kiválasztása<input type="file" accept="image/*" multiple onChange={fajlokHozzaadasa} /></label></div>
                <div className="admin-kepek-lista">
                    {urlap.kepek.map((kep, index) => (
                        <div className="admin-kep-sor" key={`kep-${index}`}>
                            {kep.startsWith('data:image/') && <img src={kep} alt={`Feltöltendő kép ${index + 1}`} />}
                            <input aria-label={`Kép URL ${index + 1}`} value={kep.startsWith('data:image/') ? `Kiválasztott kép ${index + 1}` : kep} readOnly={kep.startsWith('data:image/')} placeholder="Kép URL-je" onChange={(event) => setUrlap((elozo) => ({ ...elozo, kepek: elozo.kepek.map((elem, i) => i === index ? event.target.value : elem) }))} />
                            <button type="button" onClick={() => setUrlap((elozo) => ({ ...elozo, kepek: elozo.kepek.filter((_, i) => i !== index) }))}>Eltávolít</button>
                        </div>
                    ))}
                </div>
                {hiba && <p className="admin-hiba" role="alert">{hiba}</p>}
                <div className="admin-urlap-gombok">
                    <button type="submit" disabled={kuldes}>{kuldes ? 'Mentés…' : urlap.id ? 'Módosítás mentése' : 'Termék feltöltése'}</button>
                    {urlap.id && <button type="button" className="admin-megse" onClick={() => { setUrlap(uresUrlap()); setHiba(''); }}>Mégse</button>}
                </div>
            </form>

            <section className="admin-termeklista">
                <h2>Meglévő termékek</h2>
                {hiba && !urlap.id && <p className="admin-hiba" role="alert">{hiba}</p>}
                {betoltes ? <p>Termékek betöltése…</p> : termekek.length === 0 ? <p>Még nincs termék.</p> : (
                    <div className="admin-termeklista-elemek">
                        {termekek.map((termek) => (
                            <article className="admin-termek-sor" key={termek._id}>
                                <div><strong>{termek.nev}</strong><span>{termek.kategoria || 'Nincs kategória'} · {Number(termek.ar).toLocaleString('hu-HU')} Ft</span></div>
                                <div className="admin-termek-akciok">
                                    <button type="button" onClick={() => termekSzerkesztese(termek)}>Módosít</button>
                                    <button type="button" className="admin-torol" onClick={() => termekTorlese(termek)}>Törlés</button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
};

export default AdminTermekek;
