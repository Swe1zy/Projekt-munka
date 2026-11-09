import mongoose from 'mongoose';

export const TERMEKEK_KATEGORIAK = [
    'Falazóanyagok',
    'Cement és kötőanyagok',
    'Faanyagok',
    'Tetőfedés',
    'Hőszigetelés',
    'Szerszámok és kellékek',
];

export const TERMEK_EGYSEGEK = ['m³', 'm²'];

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
        egyseg: {
            type: String,
            enum: TERMEK_EGYSEGEK,
            required: true,
        },
        keszlet: {
            type: Number,
            min: 0,
            required: true,
        },
    },
    { timestamps: true },
);

const TermekModel = mongoose.model('termek', termekSchema);

export default TermekModel;