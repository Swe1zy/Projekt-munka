import express from 'express';
import {
    getOneTermek,
    updateOneTermek,
} from '../../../controllers/backendcontrollers/termek/newTermekPicturesControllers.mjs';
import pictureUploader from '../../../middlewares/morePicturesToCloudinary.mjs';
import pictureDeleter from '../../../middlewares/morePicturesDeleteFromCloudinary.mjs';

const newTermekekPicturesRouter = express.Router();

newTermekekPicturesRouter.get('/:id', getOneTermek);
newTermekekPicturesRouter.patch(
    '/:id',
    pictureUploader,
    pictureDeleter,
    updateOneTermek,
);

export default newTermekekPicturesRouter;
