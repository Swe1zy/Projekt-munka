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
    .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    });

// READ művelet (frontend)
app.get('/api/frontend-buildings', async (req, res) => {
    try {
        const buildings = await BuildingModel.find({});

        return res.status(200).json({ buildings });
    } catch (error) {
        return res.status(500).json({ msg: `Hiba: ${error.message}` });
    }
});