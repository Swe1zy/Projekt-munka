import express from 'express';
import ejs from 'ejs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const app = express();

app.use(express.json({ limit: '30mb' }));
app.use(cors());

app.set('view engine', ejs);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('views', path.join(__dirname, '..', 'views'));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Route-ok
import mainRouter from '../routes/backendroutes/mainRoutes.mjs';
app.use('/api', mainRouter);

import newTermekRouter from '../routes/backendroutes/termek/newTermekRoutes.mjs';
app.use('/api/new-termek', newTermekRouter);

import termekekRouter from '../routes/backendroutes/termek/termekekRoutes.mjs';
app.use('/api/termekek', termekekRouter);

// import buildingsFRouter from '../routes/frontendroutes/building/buildingsRoutes.mjs';
// app.use('/api/buildings-frontend', buildingsFRouter);

export default app;
