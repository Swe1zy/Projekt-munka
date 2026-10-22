import express from 'express';
import {
    postLogin,
    postRegister,
} from '../../../controllers/frontendcontrollers/auth/authControllers.mjs';

const authRouter = express.Router();

authRouter.post('/register', postRegister);
authRouter.post('/login', postLogin);

export default authRouter;
