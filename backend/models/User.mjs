import mongoose from 'mongoose';

const mentettSzamlazasSchema = new mongoose.Schema(
    {
        tipus: { type: String, enum: ['maganszemely', 'ceg'], required: true },
        nev: { type: String, trim: true, required: true },
        adoszam: { type: String, trim: true, default: '' },
        iranyitoszam: { type: String, trim: true, required: true },
        telepules: { type: String, trim: true, required: true },
        utca: { type: String, trim: true, required: true },
    },
    { _id: false },
);

const mentettSzallitasSchema = new mongoose.Schema(
    {
        atvevoNev: { type: String, trim: true, required: true },
        iranyitoszam: { type: String, trim: true, required: true },
        telepules: { type: String, trim: true, required: true },
        utca: { type: String, trim: true, required: true },
        megjegyzes: { type: String, trim: true, default: '' },
    },
    { _id: false },
);

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
        // A profilban elmentett adatok, amelyekkel a pénztár előre kitölti az űrlapot.
        // Ha nincs külön szállítási adat, a szállítás a számlázási címre megy.
        mentettAdatok: {
            type: new mongoose.Schema(
                {
                    szamlazas: { type: mentettSzamlazasSchema, required: true },
                    szallitas: { type: mentettSzallitasSchema, default: undefined },
                },
                { _id: false },
            ),
            default: undefined,
        },
    },
    { timestamps: true },
);

const UserModel = mongoose.model('user', userSchema);

export default UserModel;
