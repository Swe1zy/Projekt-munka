import express from 'express';
import {
    getAdatExport,
    getFiok,
    patchFiok,
    postFiokTorles,
    putMentettAdatok,
} from '../../controllers/frontendcontrollers/fiokControllers.mjs';
import { requireAuthenticatedUser } from '../../middlewares/requireAdmin.mjs';

// A bejelentkezett felhasználó saját fiókjának kezelése (Profilom oldal).
const fiokRouter = express.Router();

fiokRouter.use(requireAuthenticatedUser);
fiokRouter.get('/', getFiok);
fiokRouter.patch('/', patchFiok);
fiokRouter.put('/mentett-adatok', putMentettAdatok);
fiokRouter.get('/adatok', getAdatExport);
fiokRouter.post('/torles', postFiokTorles);

export default fiokRouter;
