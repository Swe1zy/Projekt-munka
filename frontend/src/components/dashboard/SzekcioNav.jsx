import { useEffect, useState } from 'react';

// Az aktív szekció az, amelyiknek a teteje utoljára haladta meg ezt a vonalat
// (a látótér tetejétől számítva, a magasság arányában).
const AKTIV_VONAL = 0.3;

const aktivKeresese = (idk, elozo) => {
    const vonal = window.innerHeight * AKTIV_VONAL;
    const elemek = idk
        .map((id) => ({ id, elem: document.getElementById(id) }))
        .filter(({ elem }) => elem);
    if (!elemek.length) return elozo;

    // Az oldal alján az utolsó sor kártyái sosem érik el a vonalat, ott a
    // legutolsó szekció az aktív, hacsak nem épp egy látható alsó elemre kattintottak.
    const oldalAlja = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (oldalAlja) {
        const elozoElem = elemek.find(({ id }) => id === elozo)?.elem;
        if (elozoElem && elozoElem.getBoundingClientRect().top < window.innerHeight) return elozo;
        return elemek[elemek.length - 1].id;
    }

    let legjobb = null;
    for (const { id, elem } of elemek) {
        const teteje = elem.getBoundingClientRect().top;
        if (teteje > vonal) continue;
        // Egy sorban lévő kártyák teteje egyforma: ilyenkor az előzőleg aktív marad
        // (pl. amire épp rákattintottak), különben a sorban az első.
        if (!legjobb || teteje > legjobb.teteje + 1) legjobb = { id, teteje };
        else if (Math.abs(teteje - legjobb.teteje) <= 1 && id === elozo) legjobb = { id, teteje };
    }
    return legjobb?.id ?? elemek[0].id;
};

/**
 * Oldalsó navigáció a dashboard szekcióihoz. Görgetéskor kiemeli az éppen
 * olvasott szekciót, kattintásra odagörget (az URL nem változik).
 * `csoportok`: [{ cim, elemek: [{ id, cimke }] }]
 */
const SzekcioNav = ({ csoportok, kesz }) => {
    const idk = csoportok.flatMap((csoport) => csoport.elemek.map((elem) => elem.id));
    const idKulcs = idk.join('|');
    const [aktiv, setAktiv] = useState(idk[0]);

    useEffect(() => {
        const lista = idKulcs.split('|');
        let keret = 0;
        const frissit = () => {
            cancelAnimationFrame(keret);
            keret = requestAnimationFrame(() => setAktiv((elozo) => aktivKeresese(lista, elozo)));
        };

        frissit();
        window.addEventListener('scroll', frissit, { passive: true });
        window.addEventListener('resize', frissit);
        return () => {
            cancelAnimationFrame(keret);
            window.removeEventListener('scroll', frissit);
            window.removeEventListener('resize', frissit);
        };
    }, [idKulcs, kesz]);

    const ugras = (event, id) => {
        event.preventDefault();
        const cel = document.getElementById(id);
        if (!cel) return;
        setAktiv(id);
        cel.scrollIntoView({ block: 'start' });
    };

    return (
        <aside className="db-oldalsav">
            <nav aria-label="Dashboard szekciói">
                <span className="db-oldalsav-cim">Ugrás</span>
                {csoportok.map((csoport) => (
                    <div
                        key={csoport.cim}
                        className="db-oldalsav-csoport"
                    >
                        <span className="db-oldalsav-csoportcim">{csoport.cim}</span>
                        <ul>
                            {csoport.elemek.map((elem) => {
                                const elerheto = kesz || elem.id === idk[0];
                                return (
                                    <li key={elem.id}>
                                        <a
                                            href={`#${elem.id}`}
                                            className={aktiv === elem.id ? 'db-oldalsav-link db-oldalsav-link--aktiv' : 'db-oldalsav-link'}
                                            aria-current={aktiv === elem.id ? 'location' : undefined}
                                            aria-disabled={elerheto ? undefined : true}
                                            onClick={(event) => ugras(event, elem.id)}
                                        >
                                            {elem.cimke}
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>
        </aside>
    );
};

export default SzekcioNav;
