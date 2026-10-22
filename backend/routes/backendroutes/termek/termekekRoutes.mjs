import express from 'express';
import {
    deleteTermek,
    getTermek,
    getOneTermek,
    updateOneTermek,
} from '../../../controllers/backendcontrollers/termek/termekekControllers.mjs';
import pictureDeleter from '../../../middlewares/onePictureDeleteFromCloudinary.mjs';
import pictureUploader from '../../../middlewares/onePictureToCloudinary.mjs';
import { requireAdmin } from '../../../middlewares/requireAdmin.mjs';

const termekekRouter = express.Router();

termekekRouter.get('/', requireAdmin, getTermek);
termekekRouter.delete('/:id', requireAdmin, pictureDeleter, deleteTermek);
termekekRouter.get('/:id', requireAdmin, getOneTermek);
termekekRouter.put('/:id', requireAdmin, pictureUploader, pictureDeleter, updateOneTermek);

export default termekekRouter;
