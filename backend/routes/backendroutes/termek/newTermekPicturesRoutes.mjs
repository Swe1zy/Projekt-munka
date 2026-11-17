import express from 'express';
import {
    getOneTermek,
    updateOneTermek,
} from '../../../controllers/backendcontrollers/termek/newTermekPicturesControllers.mjs';
import pictureUploader from '../../../middlewares/onePictureToCloudinary.mjs';
import { requireAdmin } from '../../../middlewares/requireAdmin.mjs';

const newTermekekPicturesRouter = express.Router();

newTermekekPicturesRouter.get('/:id', requireAdmin, getOneTermek);
newTermekekPicturesRouter.patch('/:id', requireAdmin, pictureUploader, updateOneTermek);

export default newTermekekPicturesRouter;
