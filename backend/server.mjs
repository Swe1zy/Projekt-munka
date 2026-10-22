import 'dotenv/config';
import app from './utils/app.mjs';
import dbConnect from './utils/dbConnect.mjs';
import ensureAdmin from './utils/ensureAdmin.mjs';

const PORT = process.env.PORT || 3600;

dbConnect()
    .then(async () => {
        await ensureAdmin();
        app.listen(PORT, () => {
            console.log(`http://localhost:${PORT}/api`);
        });
        console.log('Sikeres adatbázis csatlakozás!');
    })
    .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    });