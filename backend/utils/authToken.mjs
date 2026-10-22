import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'projekt_session';
const TOKEN_ELETTARTAM_MASODPERC = 60 * 60 * 12;

const authSecret = () => process.env.AUTH_TOKEN_SECRET;

const sign = (payload) =>
    createHmac('sha256', authSecret()).update(payload).digest('base64url');

export const createAuthToken = (userId) => {
    if (!authSecret()) throw new Error('Az AUTH_TOKEN_SECRET nincs beállítva.');

    const payload = Buffer.from(JSON.stringify({
        sub: userId.toString(),
        exp: Math.floor(Date.now() / 1000) + TOKEN_ELETTARTAM_MASODPERC,
    })).toString('base64url');

    return `${payload}.${sign(payload)}`;
};

export const verifyAuthToken = (token) => {
    if (!authSecret() || typeof token !== 'string') return null;

    const [payload, signature, ...extra] = token.split('.');
    if (!payload || !signature || extra.length) return null;

    const expected = Buffer.from(sign(payload));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

    try {
        const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (typeof data.sub !== 'string' || data.exp <= Math.floor(Date.now() / 1000)) return null;
        return data;
    } catch {
        return null;
    }
};

export const setAuthCookie = (res, token) => {
    const options = [
        `${COOKIE_NAME}=${encodeURIComponent(token)}`,
        'HttpOnly',
        'SameSite=Lax',
        'Path=/',
        `Max-Age=${TOKEN_ELETTARTAM_MASODPERC}`,
    ];
    if (process.env.NODE_ENV === 'production') options.push('Secure');
    res.setHeader('Set-Cookie', options.join('; '));
};

export const clearAuthCookie = (res) => {
    const options = [`${COOKIE_NAME}=`, 'HttpOnly', 'SameSite=Lax', 'Path=/', 'Max-Age=0'];
    if (process.env.NODE_ENV === 'production') options.push('Secure');
    res.setHeader('Set-Cookie', options.join('; '));
};

export const readAuthToken = (req) => {
    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
    if (!match) return null;

    try {
        return decodeURIComponent(match[1]);
    } catch {
        return null;
    }
};
