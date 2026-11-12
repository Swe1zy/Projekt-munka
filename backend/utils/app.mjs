import express from 'express';
import ejs from 'ejs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const app = express();

app.use(express.json({ limit: '30mb' }));
app.use(cors({
	origin: process.env.FRONTEND_URL || 'http://localhost:5173',
	credentials: true,
	// A CSV-export fájlnevét a frontend ebből a fejlécből olvassa ki.
	exposedHeaders: ['Content-Disposition'],
}));

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

import newTermekPicturesRouter from '../routes/backendroutes/termek/newTermekPicturesRoutes.mjs';
app.use('/api/termek-pictures', newTermekPicturesRouter);

import termekekFRouter from '../routes/frontendroutes/termek/termekekRoutes.mjs';
app.use('/api/frontend-termekek', termekekFRouter);

import authRouter from '../routes/frontendroutes/auth/authRoutes.mjs';
app.use('/api/auth', authRouter);

import rendelesRouter from '../routes/frontendroutes/rendelesRoutes.mjs';
app.use('/api/rendelesek', rendelesRouter);

import dashboardRouter from '../routes/backendroutes/dashboardRoutes.mjs';
app.use('/api/dashboard', dashboardRouter);

import rendelesKezelesRouter from '../routes/backendroutes/rendelesKezelesRoutes.mjs';
app.use('/api/admin/rendelesek', rendelesKezelesRouter);

import beallitasokRouter from '../routes/frontendroutes/beallitasokRoutes.mjs';
app.use('/api/beallitasok', beallitasokRouter);

import arajanlatRouter from '../routes/frontendroutes/arajanlatRoutes.mjs';
app.use('/api/arajanlatok', arajanlatRouter);

import arajanlatKezelesRouter from '../routes/backendroutes/arajanlatKezelesRoutes.mjs';
app.use('/api/admin/arajanlatok', arajanlatKezelesRouter);

export default app;
