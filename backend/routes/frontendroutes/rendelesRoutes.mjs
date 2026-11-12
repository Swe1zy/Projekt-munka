import express from 'express';
import { postRendeles } from '../../controllers/frontendcontrollers/rendelesControllers.mjs';

const rendelesRouter = express.Router();

rendelesRouter.post('/', postRendeles);

export default rendelesRouter;