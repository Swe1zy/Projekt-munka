import express from 'express';
import getMain from '../../controllers/backendcontrollers/mainControllers.mjs';

const mainRouter = express.Router();

mainRouter.get('/', getMain);

export default mainRouter;
