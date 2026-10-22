import express from 'express';
import { getNewTermek, postNewTermek } from '../../../controllers/backendcontrollers/termek/newTermekControllers.mjs';
import pictureUploader from '../../../middlewares/onePictureToCloudinary.mjs';
import { requireAdmin } from '../../../middlewares/requireAdmin.mjs';

const newTermekRouter = express.Router();

newTermekRouter.get('/', requireAdmin, getNewTermek);
newTermekRouter.post('/', requireAdmin, pictureUploader, postNewTermek);

export default newTermekRouter;
