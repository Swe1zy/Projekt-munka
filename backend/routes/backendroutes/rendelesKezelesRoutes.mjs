import express from 'express';
import {
    getRendelesek,
    patchRaklapVisszavetel,
    patchRendelesAllapot,
} from '../../controllers/backendcontrollers/rendelesKezelesControllers.mjs';
import { requireAdmin } from '../../middlewares/requireAdmin.mjs';

const rendelesKezelesRouter = express.Router();

rendelesKezelesRouter.get('/', requireAdmin, getRendelesek);
rendelesKezelesRouter.patch('/:id/allapot', requireAdmin, patchRendelesAllapot);
rendelesKezelesRouter.patch('/:id/raklap', requireAdmin, patchRaklapVisszavetel);

export default rendelesKezelesRouter;
