import express from 'express';
import {
    getOneTermek,
    updateOneTermek,
} from '../../../controllers/backendcontrollers/termek/newTermekPicturesControllers.mjs';
import pictureUploader from '../../../middlewares/morePicturesToCloudinary.mjs';
import pictureDeleter from '../../../middlewares/morePicturesDeleteFromCloudinary.mjs';
import { requireAdmin } from '../../../middlewares/requireAdmin.mjs';

const newTermekekPicturesRouter = express.Router();

newTermekekPicturesRouter.get('/:id', requireAdmin, getOneTermek);
newTermekekPicturesRouter.patch(
    '/:id',
    requireAdmin,
    pictureUploader,
    pictureDeleter,
    updateOneTermek,
);

export default newTermekekPicturesRouter;
