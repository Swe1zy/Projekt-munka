import { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Logout = () => {
    const { user, logout } = useAuth();
    const { siker } = useToast();
    const kesz = useRef(false);

    useEffect(() => {
        // Csak akkor köszönünk el, ha valaki tényleg be volt jelentkezve.
        if (!user || kesz.current) return;

        kesz.current = true;
        logout();
        siker('Sikeresen kijelentkeztél!');
    }, [user, logout, siker]);

    return (
        <Navigate
            to="/"
            replace
        />
    );
};

export default Logout;
