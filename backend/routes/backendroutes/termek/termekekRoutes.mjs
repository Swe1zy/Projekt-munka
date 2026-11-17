import express from 'express';
import {
    deleteTermek,
    getTermek,
    getOneTermek,
    updateOneTermek,
} from '../../../controllers/backendcontrollers/termek/termekekControllers.mjs';
import pictureUploader from '../../../middlewares/onePictureToCloudinary.mjs';
import { requireAdmin } from '../../../middlewares/requireAdmin.mjs';

const termekekRouter = express.Router();

// A régi képeket a controllerek a sikeres adatbázis-művelet után törlik a Cloudinaryből.
termekekRouter.get('/', requireAdmin, getTermek);
termekekRouter.delete('/:id', requireAdmin, deleteTermek);
termekekRouter.get('/:id', requireAdmin, getOneTermek);
termekekRouter.put('/:id', requireAdmin, pictureUploader, updateOneTermek);

export default termekekRouter;
