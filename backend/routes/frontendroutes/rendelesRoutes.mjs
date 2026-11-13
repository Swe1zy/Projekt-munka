import express from 'express';
import { getDijbekero, getSajatRendelesek, postOsszesito, postRendeles, postRendelesLemondas } from '../../controllers/frontendcontrollers/rendelesControllers.mjs';
import { getStripeFizetesEllenorzes, postFizetesFolytatas, postStripeFizetesMegszakit } from '../../controllers/frontendcontrollers/stripeFizetesControllers.mjs';
import { optionalAuthenticatedUser, requireAuthenticatedUser } from '../../middlewares/requireAdmin.mjs';

const rendelesRouter = express.Router();

rendelesRouter.post('/', optionalAuthenticatedUser, postRendeles);
rendelesRouter.get('/sajat', requireAuthenticatedUser, getSajatRendelesek);
rendelesRouter.post('/osszesito', postOsszesito);
rendelesRouter.get('/stripe-ellenorzes', getStripeFizetesEllenorzes);
rendelesRouter.post('/stripe-megszakit', postStripeFizetesMegszakit);
rendelesRouter.get('/:id/dijbekero', requireAuthenticatedUser, getDijbekero);
rendelesRouter.post('/:id/lemondas', requireAuthenticatedUser, postRendelesLemondas);
rendelesRouter.post('/:id/fizetes', requireAuthenticatedUser, postFizetesFolytatas);

export default rendelesRouter;
