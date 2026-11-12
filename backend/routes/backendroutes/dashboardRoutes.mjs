import express from 'express';
import { getDashboard } from '../../controllers/backendcontrollers/dashboardControllers.mjs';
import { requireAdmin } from '../../middlewares/requireAdmin.mjs';

const dashboardRouter = express.Router();

dashboardRouter.get('/', requireAdmin, getDashboard);

export default dashboardRouter;
