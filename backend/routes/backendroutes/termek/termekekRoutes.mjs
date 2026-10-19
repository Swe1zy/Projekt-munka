import express from 'express';
import {
    deleteTermek,
    getTermek,
    getOneTermek,
    updateOneTermek,
} from '../../../controllers/backendcontrollers/termek/termekekControllers.mjs';
import pictureDeleter from '../../../middlewares/onePictureDeleteFromCloudinary.mjs';
import pictureUploader from '../../../middlewares/onePictureToCloudinary.mjs';

const termekekRouter = express.Router();

termekekRouter.get('/', getTermek);
termekekRouter.delete('/:id', pictureDeleter, deleteTermek);
termekekRouter.get('/:id', getOneTermek);
termekekRouter.put('/:id', pictureUploader, pictureDeleter, updateOneTermek);

export default termekekRouter;
