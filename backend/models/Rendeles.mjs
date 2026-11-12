import mongoose from 'mongoose';

const rendelesTetelSchema = new mongoose.Schema(
    {
        termekId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'termek',
            required: true,
        },
        nev: {
            type: String,
            required: true,
        },
        mennyiseg: {
            type: Number,
            min: 0.01,
            required: true,
        },
        egyseg: {
            type: String,
            required: true,
        },
        egysegar: {
            type: Number,
            min: 0,
            required: true,
        },
    },
    { _id: false },
);

const szallitasiAdatokSchema = new mongoose.Schema(
    {
        atvevoNev: { type: String, trim: true, required: true },
        iranyitoszam: { type: String, trim: true, required: true },
        telepules: { type: String, trim: true, required: true },
        utca: { type: String, trim: true, required: true },
        megjegyzes: { type: String, trim: true, default: '' },
    },
    { _id: false },
);

const rendelesSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        teljesNev: {
            type: String,
            required: true,
            trim: true,
        },
        atvetelModja: {
            type: String,
            enum: ['hazhozszallitas', 'szemelyes_atvetel'],
            required: true,
        },
        szallitasiCim: {
            type: String,
            trim: true,
            default: '',
        },
        szallitasiEgyezik: {
            type: Boolean,
            default: false,
        },
        szallitasiAdatok: {
            type: szallitasiAdatokSchema,
            default: undefined,
        },
        szamlazasiAdatok: {
            type: new mongoose.Schema(
                {
                    tipus: { type: String, enum: ['maganszemely', 'ceg'], required: true },
                    nev: { type: String, trim: true, required: true },
                    adoszam: { type: String, trim: true, default: '' },
                    iranyitoszam: { type: String, trim: true, required: true },
                    telepules: { type: String, trim: true, required: true },
                    utca: { type: String, trim: true, required: true },
                    megjegyzes: { type: String, trim: true, default: '' },
                },
                { _id: false },
            ),
            required: true,
        },
        tetelek: {
            type: [rendelesTetelSchema],
            required: true,
            validate: {
                validator: (tetelek) => tetelek.length > 0,
                message: 'A rendelésnek legalább egy tételt tartalmaznia kell.',
            },
        },
        vegosszeg: {
            type: Number,
            min: 0,
            required: true,
        },
        allapot: {
            type: String,
            enum: ['feldolgozasra_var'],
            default: 'feldolgozasra_var',
        },
    },
    { timestamps: true },
);

const RendelesModel = mongoose.model('rendeles', rendelesSchema);

export default RendelesModel;