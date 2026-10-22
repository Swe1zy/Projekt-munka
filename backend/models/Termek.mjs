import mongoose from 'mongoose';

export const TERMEKEK_KATEGORIAK = [
    'Falazóanyagok',
    'Cement és kötőanyagok',
    'Faanyagok',
    'Tetőfedés',
    'Hőszigetelés',
    'Szerszámok és kellékek',
];

const termekSchema = new mongoose.Schema(
    {
        nev: {
            type: String,
            required: true,
        },
        leiras: {
            type: String,
            required: true,
        },
        kategoria: {
            type: String,
            enum: TERMEKEK_KATEGORIAK,
            required: true,
        },
        kepek: {
            type: [String],
            default: [],
        },
        // Régi rekordok kompatibilitásához; az új termékek a `kepek` mezőt használják.
        kep: {
            type: String,
        },
        ar: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true },
);

const TermekModel = mongoose.model('termek', termekSchema);

export default TermekModel;