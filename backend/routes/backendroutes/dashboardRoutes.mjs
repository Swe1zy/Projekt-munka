import express from 'express';
import { getDashboard } from '../../controllers/backendcontrollers/dashboardControllers.mjs';
import { getDashboardExport } from '../../controllers/backendcontrollers/dashboardExportControllers.mjs';
import { requireAdmin } from '../../middlewares/requireAdmin.mjs';

const dashboardRouter = express.Router();

dashboardRouter.get('/', requireAdmin, getDashboard);
dashboardRouter.get('/export', requireAdmin, getDashboardExport);

export default dashboardRouter;
