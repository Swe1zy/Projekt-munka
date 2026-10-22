import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';
import { API_URL } from '../config';

const TAROLO_KULCS = 'felhasznalo';

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [authReady, setAuthReady] = useState(false);

    useEffect(() => {
        let aktiv = true;
        fetch(`${API_URL}/auth/me`, { credentials: 'include' })
            .then(async (response) => {
                if (!response.ok) throw new Error('Nincs aktív munkamenet.');
                return response.json();
            })
            .then(({ user: aktualisFelhasznalo }) => {
                if (!aktiv) return;
                setUser(aktualisFelhasznalo);
                try {
                    localStorage.setItem(TAROLO_KULCS, JSON.stringify(aktualisFelhasznalo));
                } catch {
                    // A szerveroldali munkamenet ettől függetlenül érvényes.
                }
            })
            .catch(() => {
                if (!aktiv) return;
                setUser(null);
                try {
                    localStorage.removeItem(TAROLO_KULCS);
                } catch {
                    // Nincs mit törölni, ha a tárolás nem elérhető.
                }
            })
            .finally(() => {
                if (aktiv) setAuthReady(true);
            });

        return () => { aktiv = false; };
    }, []);

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
        () => ({ user, authReady, login, logout }),
        [user, authReady, login, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
