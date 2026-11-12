import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import { TELEPHELY } from '../config/uzlet.mjs';

const BACKEND_GYOKER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// SMTP a .env alapján (SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS).
// Ha nincs SMTP_HOST, fejlesztői módban a levelek .eml fájlba kerülnek a
// backend/kimeno-levelek mappába (vagy az EMAIL_MAPPA-ba), így bármelyik
// levelezőprogrammal megnyithatók.
const smtpBeallitva = () => Boolean(process.env.SMTP_HOST);

let transzport = null;
let transzportKulcs = null;

const getTranszport = () => {
    const kulcs = smtpBeallitva() ? `smtp:${process.env.SMTP_HOST}:${process.env.SMTP_PORT}` : 'fajl';
    if (!transzport || transzportKulcs !== kulcs) {
        transzport = smtpBeallitva()
            ? nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
            })
            : nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'unix' });
        transzportKulcs = kulcs;
    }
    return transzport;
};

const fajlnev = (targy) => `${new Date().toISOString().replace(/[:.]/g, '-')}-${targy
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)}.eml`;

export const emailKuldes = async ({ cimzett, targy, html, szoveg, csatolmanyok = [] }) => {
    const info = await getTranszport().sendMail({
        from: process.env.EMAIL_FELADO || `"${TELEPHELY.nev}" <${TELEPHELY.email}>`,
        to: cimzett,
        subject: targy,
        html,
        text: szoveg,
        attachments: csatolmanyok,
    });

    if (!smtpBeallitva()) {
        const mappa = process.env.EMAIL_MAPPA || path.join(BACKEND_GYOKER, 'kimeno-levelek');
        await fs.mkdir(mappa, { recursive: true });
        const fajl = path.join(mappa, fajlnev(targy));
        await fs.writeFile(fajl, info.message);
        console.log(`E-mail (SMTP nincs beállítva) mentve: ${fajl}`);
        return { fajl };
    }
    return { azonosito: info.messageId };
};
