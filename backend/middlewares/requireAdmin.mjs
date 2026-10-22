import UserModel from '../models/User.mjs';
import { readAuthToken, verifyAuthToken } from '../utils/authToken.mjs';

export const requireAuthenticatedUser = async (req, res, next) => {
    try {
        const token = readAuthToken(req);
        const payload = verifyAuthToken(token);
        if (!payload) {
            return res.status(401).json({ msg: 'A művelethez be kell jelentkezned.' });
        }

        const user = await UserModel.findById(payload.sub).select('_id nev email role');
        if (!user) {
            return res.status(401).json({ msg: 'A felhasználói munkamenet már nem érvényes.' });
        }

        req.authUser = user;
        return next();
    } catch (error) {
        console.error('Hitelesítési hiba:', error);
        return res.status(500).json({ msg: 'A hitelesítés nem sikerült.' });
    }
};

export const requireAdmin = async (req, res, next) => {
    await requireAuthenticatedUser(req, res, () => {
        if (req.authUser.role !== 'admin') {
            return res.status(403).json({ msg: 'Ehhez a művelethez admin jogosultság szükséges.' });
        }
        return next();
    });
};
