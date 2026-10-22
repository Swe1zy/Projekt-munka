import express from 'express';
import {
    getMe,
    postLogin,
    postLogout,
    postPassword,
    postRegister,
} from '../../../controllers/frontendcontrollers/auth/authControllers.mjs';
import { requireAuthenticatedUser } from '../../../middlewares/requireAdmin.mjs';

const authRouter = express.Router();

authRouter.post('/register', postRegister);
authRouter.post('/login', postLogin);
authRouter.post('/password', postPassword);
authRouter.get('/me', requireAuthenticatedUser, getMe);
authRouter.post('/logout', postLogout);

export default authRouter;
