import dotenv from 'dotenv';
import app from './utils/app.mjs';
import dbConnect from './utils/dbConnect.mjs';
dotenv.config();

const PORT = process.env.PORT || 3600;

dbConnect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`http://localhost:${PORT}/api`);
        });
        console.log('Sikeres adatbázis csatlakozás!');
    })
    .catch((error) => console.log(error.message));
