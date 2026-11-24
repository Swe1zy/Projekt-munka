import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { t } from './nyelv';

/**
 * Kosárba tétel előtti ellenőrzés. Bejelentkezett felhasználónál `true`-t ad
 * vissza. Kijelentkezettnél értesítést mutat, a bejelentkezési oldalra visz
 * (ahonnan belépés után ide tér vissza), és `false`-t ad.
 */
export const useBejelentkezesKell = (uzenet = t('A kosárba tételhez jelentkezz be!')) => {
    const { user, authReady } = useAuth();
    const { hiba } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    return useCallback(() => {
        if (user) return true;
        // A munkamenet ellenőrzése még tart: nem tudjuk, be van-e jelentkezve,
        // ezért nem tesszük kosárba, de át sem irányítjuk.
        if (!authReady) return false;

        hiba(uzenet);
        navigate('/login', { state: { from: location.pathname + location.search } });
        return false;
    }, [user, authReady, hiba, navigate, location.pathname, location.search, uzenet]);
};
