import express from 'express';
import { getBeallitasok } from '../../controllers/frontendcontrollers/beallitasokControllers.mjs';

const beallitasokRouter = express.Router();

beallitasokRouter.get('/', getBeallitasok);

export default beallitasokRouter;
