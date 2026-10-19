import express from 'express';
import {
    getOneTermekek,
    updateOneTermekek,
} from '../../../controllers/backendcontrollers/termek/newTermekPicturesControllers.mjs';
import pictureUploader from '../../../middlewares/morePicturesToCloudinary.mjs';
import pictureDeleter from '../../../middlewares/morePicturesDeleteFromCloudinary.mjs';

const newTermekekPicturesRouter = express.Router();

newTermekekPicturesRouter.get('/:id', getOneTermekek);
newTermekekPicturesRouter.patch(
    '/:id',
    pictureUploader,
    pictureDeleter,
    updateOneTermekek,
);

export default newTermekekPicturesRouter;
