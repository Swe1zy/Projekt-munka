import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        nev: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        jelszo: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        // Az ÁSZF regisztrációkori elfogadásának nyoma. A korábban regisztrált
        // felhasználóknál és az .env-ből létrehozott admin fióknál nincs kitöltve.
        aszfElfogadas: {
            verzio: String,
            idopont: Date,
        },
    },
    { timestamps: true },
);

const UserModel = mongoose.model('user', userSchema);

export default UserModel;
