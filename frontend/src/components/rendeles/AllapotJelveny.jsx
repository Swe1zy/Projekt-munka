import './Rendeles.css';

// Minden állapot saját ikont kap, így a jelentése szín nélkül is olvasható.
const IKONOK = {
    feldolgozasra_var: (
        <>
            <circle cx="8" cy="8" r="6.25" />
            <path d="M8 4.75V8l2.25 1.5" />
        </>
    ),
    visszaigazolva: (
        <>
            <circle cx="8" cy="8" r="6.25" />
            <path d="M5.25 8.25l1.85 1.85 3.65-3.85" />
        </>
    ),
    kiszallitas_alatt: (
        <>
            <path d="M1.25 4h8.5v6.75h-8.5z" />
            <path d="M9.75 6.5h2.75l2.25 2.25v2h-5" />
            <circle cx="4.25" cy="11.75" r="1.25" />
            <circle cx="11.75" cy="11.75" r="1.25" />
        </>
    ),
    teljesitve: (
        <>
            <path d="M8 1.5l1.7 1.2 2.05-.1.65 1.95 1.6 1.3-.6 1.95.6 1.95-1.6 1.3-.65 1.95-2.05-.1L8 14.5l-1.7-1.2-2.05.1-.65-1.95-1.6-1.3.6-1.95-.6-1.95 1.6-1.3.65-1.95 2.05.1z" />
            <path d="M5.5 8.1l1.7 1.7 3.3-3.4" />
        </>
    ),
    lemondva: (
        <>
            <circle cx="8" cy="8" r="6.25" />
            <path d="M5.75 5.75l4.5 4.5m0-4.5l-4.5 4.5" />
        </>
    ),
};

export const AllapotIkon = ({ allapot }) => (
    <svg className="rendeles-allapot-ikon" viewBox="0 0 16 16" aria-hidden="true">
        {IKONOK[allapot] ?? IKONOK.feldolgozasra_var}
    </svg>
);

const AllapotJelveny = ({ allapot, cimke }) => (
    <span className={`rendeles-allapot rendeles-allapot--${allapot}`}>
        <AllapotIkon allapot={allapot} />
        {cimke}
    </span>
);

export default AllapotJelveny;
