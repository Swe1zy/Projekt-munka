// Űrlap alatti visszajelzés: { tipus: 'siker' | 'hiba', szoveg }.
const Uzenet = ({ uzenet }) => {
    if (!uzenet?.szoveg) return null;

    return (
        <p
            className={`auth-uzenet ${uzenet.tipus === 'hiba' ? 'auth-hiba' : 'auth-siker'}`}
            role={uzenet.tipus === 'hiba' ? 'alert' : 'status'}
        >
            {uzenet.szoveg}
        </p>
    );
};

export default Uzenet;
