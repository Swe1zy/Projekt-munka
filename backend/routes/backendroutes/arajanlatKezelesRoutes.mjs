import express from 'express';
import { getArajanlatok, patchArajanlat } from '../../controllers/frontendcontrollers/arajanlatControllers.mjs';
import { requireAdmin } from '../../middlewares/requireAdmin.mjs';

const arajanlatKezelesRouter = express.Router();

arajanlatKezelesRouter.get('/', requireAdmin, getArajanlatok);
arajanlatKezelesRouter.patch('/:id', requireAdmin, patchArajanlat);

export default arajanlatKezelesRouter;
