import express from 'express';
import { getDijbekero, getSajatRendelesek, postOsszesito, postRendeles } from '../../controllers/frontendcontrollers/rendelesControllers.mjs';
import { getStripeFizetesEllenorzes, postStripeFizetesMegszakit } from '../../controllers/frontendcontrollers/stripeFizetesControllers.mjs';
import { optionalAuthenticatedUser, requireAuthenticatedUser } from '../../middlewares/requireAdmin.mjs';

const rendelesRouter = express.Router();

rendelesRouter.post('/', optionalAuthenticatedUser, postRendeles);
rendelesRouter.get('/sajat', requireAuthenticatedUser, getSajatRendelesek);
rendelesRouter.post('/osszesito', postOsszesito);
rendelesRouter.get('/stripe-ellenorzes', getStripeFizetesEllenorzes);
rendelesRouter.post('/stripe-megszakit', postStripeFizetesMegszakit);
rendelesRouter.get('/:id/dijbekero', requireAuthenticatedUser, getDijbekero);

export default rendelesRouter;
