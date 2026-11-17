import express from 'express';
import {
    deleteSzallitasiCim,
    getAdatExport,
    getFiok,
    patchFiok,
    postFiokTorles,
    postSzallitasiCim,
    putBeallitasok,
    putMentettAdatok,
    putSzallitasiCim,
} from '../../controllers/frontendcontrollers/fiokControllers.mjs';
import { requireAuthenticatedUser } from '../../middlewares/requireAdmin.mjs';

// A bejelentkezett felhasználó saját fiókjának kezelése (Profilom oldal).
const fiokRouter = express.Router();

fiokRouter.use(requireAuthenticatedUser);
fiokRouter.get('/', getFiok);
fiokRouter.patch('/', patchFiok);
fiokRouter.put('/mentett-adatok', putMentettAdatok);
fiokRouter.post('/cimek', postSzallitasiCim);
fiokRouter.put('/cimek/:id', putSzallitasiCim);
fiokRouter.delete('/cimek/:id', deleteSzallitasiCim);
fiokRouter.put('/beallitasok', putBeallitasok);
fiokRouter.get('/adatok', getAdatExport);
fiokRouter.post('/torles', postFiokTorles);

export default fiokRouter;
