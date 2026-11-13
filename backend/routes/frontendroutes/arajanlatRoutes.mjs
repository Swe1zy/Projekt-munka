import express from 'express';
import { getSajatArajanlatok, postArajanlat } from '../../controllers/frontendcontrollers/arajanlatControllers.mjs';
import { optionalAuthenticatedUser, requireAuthenticatedUser } from '../../middlewares/requireAdmin.mjs';

const arajanlatRouter = express.Router();

arajanlatRouter.post('/', optionalAuthenticatedUser, postArajanlat);
arajanlatRouter.get('/sajat', requireAuthenticatedUser, getSajatArajanlatok);

export default arajanlatRouter;
