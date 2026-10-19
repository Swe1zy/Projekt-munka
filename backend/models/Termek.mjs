import mongoose from 'mongoose';

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
        kep: {
            type: String,
            required: true,
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