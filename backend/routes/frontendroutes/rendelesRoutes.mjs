import express from 'express';
import { getDijbekero, getSajatRendelesek, postOsszesito, postRendeles } from '../../controllers/frontendcontrollers/rendelesControllers.mjs';
import { optionalAuthenticatedUser, requireAuthenticatedUser } from '../../middlewares/requireAdmin.mjs';

const rendelesRouter = express.Router();

rendelesRouter.post('/', optionalAuthenticatedUser, postRendeles);
rendelesRouter.get('/sajat', requireAuthenticatedUser, getSajatRendelesek);
rendelesRouter.post('/osszesito', postOsszesito);
rendelesRouter.get('/:id/dijbekero', requireAuthenticatedUser, getDijbekero);

export default rendelesRouter;
