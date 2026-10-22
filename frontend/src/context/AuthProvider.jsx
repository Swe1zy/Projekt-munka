import { useCallback, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';

const TAROLO_KULCS = 'felhasznalo';

const mentettFelhasznalo = () => {
    try {
        return JSON.parse(localStorage.getItem(TAROLO_KULCS));
    } catch {
        return null;
    }
};

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(mentettFelhasznalo);

    const login = useCallback((felhasznalo) => {
        setUser(felhasznalo);
        try {
            localStorage.setItem(TAROLO_KULCS, JSON.stringify(felhasznalo));
        } catch {
            // A böngésző nem engedi a tárolást, a munkamenet ilyenkor csak az oldal bezárásáig él.
        }
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        try {
            localStorage.removeItem(TAROLO_KULCS);
        } catch {
            // Nincs mit törölni, ha a tárolás nem elérhető.
        }
    }, []);

    const value = useMemo(
        () => ({ user, login, logout }),
        [user, login, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
