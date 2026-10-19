import express from 'express';
import { getNewTermek, postNewTermek } from '../../../controllers/backendcontrollers/termek/newTermekControllers.mjs';
import pictureUploader from '../../../middlewares/onePictureToCloudinary.mjs';

const newTermekRouter = express.Router();

newTermekRouter.get('/', getNewTermek);
newTermekRouter.post('/', pictureUploader, postNewTermek);

export default newTermekRouter;
