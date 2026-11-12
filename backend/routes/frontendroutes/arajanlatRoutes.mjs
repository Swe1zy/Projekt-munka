import express from 'express';
import { postArajanlat } from '../../controllers/frontendcontrollers/arajanlatControllers.mjs';
import { optionalAuthenticatedUser } from '../../middlewares/requireAdmin.mjs';

const arajanlatRouter = express.Router();

arajanlatRouter.post('/', optionalAuthenticatedUser, postArajanlat);

export default arajanlatRouter;
