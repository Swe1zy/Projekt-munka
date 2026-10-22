import express from 'express';
import {
    postLogin,
    postPassword,
    postRegister,
} from '../../../controllers/frontendcontrollers/auth/authControllers.mjs';

const authRouter = express.Router();

authRouter.post('/register', postRegister);
authRouter.post('/login', postLogin);
authRouter.post('/password', postPassword);

export default authRouter;
