import { hetNapNeve } from '../utils/beallitasok';
import './arazas/Arazas.css';

// A hét hétfővel kezdődik a nyitvatartási táblában.
const SORREND = [1, 2, 3, 4, 5, 6, 0];

// A telephely címe, elérhetősége, nyitvatartása és térképe (OpenStreetMap, API-kulcs nélkül).
const Telephely = ({ telephely, nyitvatartas }) => {
    const { lat, lng } = telephely.koordinata;
    const d = 0.006;
    const terkepUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d / 2}%2C${lng + d}%2C${lat + d / 2}&layer=mapnik&marker=${lat}%2C${lng}`;
    const nagyTerkep = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
    const utvonal = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    const ma = new Date().getDay();

    return (
        <div className="telephely">
            <div className="telephely-adatok">
                <address>
                    <strong>{telephely.nev}</strong>
                    <span>{telephely.cim}</span>
                    <a href={`tel:${telephely.telefon.replace(/\s/g, '')}`}>{telephely.telefon}</a>
                    <a href={`mailto:${telephely.email}`}>{telephely.email}</a>
                </address>
                <dl className="telephely-nyitvatartas" aria-label="Nyitvatartás">
                    {SORREND.map((nap) => {
                        const sor = nyitvatartas.find((elem) => elem.nap === nap);
                        return (
                            <div key={nap} className={nap === ma ? 'telephely-ma' : undefined}>
                                <dt>{hetNapNeve(nap)}</dt>
                                <dd>{!sor || sor.zarva ? 'zárva' : `${sor.nyit}–${sor.zar}`}</dd>
                            </div>
                        );
                    })}
                </dl>
            </div>
            <div className="telephely-terkep">
                <iframe title={`${telephely.nev} térképen`} src={terkepUrl} loading="lazy" />
            </div>
            <div className="telephely-utvonal">
                <a href={utvonal} target="_blank" rel="noreferrer">Útvonaltervezés ↗</a>
                <a href={nagyTerkep} target="_blank" rel="noreferrer">Nagyobb térkép ↗</a>
            </div>
        </div>
    );
};

export default Telephely;
