import express from 'express';
import { getEgyTermek, getTermekek } from '../../../controllers/frontendcontrollers/termek/termekekControllers.mjs';

const termekekFRouter = express.Router();

termekekFRouter.get('/', getTermekek);
termekekFRouter.get('/:id', getEgyTermek);

export default termekekFRouter;
