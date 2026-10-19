import mongoose from 'mongoose';
import dns from 'node:dns'   

dns.setServers(['8.8.8.8', '8.8.4.4']);

const dbConnection = async () => {
    try {
        const connection = await mongoose.connect(process.env.MONGO_DB);
        return connection;
    } catch (error) {
        throw new Error(`Adatbázis-kapcsolódási hiba: ${error.message}`, {
            cause: error,
        });
    }
};

export default dbConnection;