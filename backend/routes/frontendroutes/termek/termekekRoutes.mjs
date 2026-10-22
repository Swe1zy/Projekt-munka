import express from 'express';
import { getTermekek } from '../../../controllers/frontendcontrollers/termek/termekekControllers.mjs';

const termekekFRouter = express.Router();

termekekFRouter.get('/', getTermekek);

export default termekekFRouter;
