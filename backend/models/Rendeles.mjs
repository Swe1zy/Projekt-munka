import mongoose from 'mongoose';

export const RENDELES_ALLAPOTOK = {
    feldolgozasra_var: 'Feldolgozásra vár',
    visszaigazolva: 'Visszaigazolva',
    kiszallitas_alatt: 'Kiszállítás alatt',
    teljesitve: 'Teljesítve',
    lemondva: 'Lemondva',
};

export const ATVETELI_MODOK = {
    hazhozszallitas: 'Házhozszállítás',
    szemelyes_atvetel: 'Személyes átvétel',
};

// Melyik állapotból hová léphet tovább a rendelés. A teljesített és a lemondott
// rendelés lezárt: így a lemondáskor visszaadott készletet sem lehet kétszer jóváírni.
const ALLAPOT_ATMENETEK = {
    feldolgozasra_var: ['visszaigazolva', 'lemondva'],
    visszaigazolva: ['kiszallitas_alatt', 'teljesitve', 'lemondva'],
    kiszallitas_alatt: ['teljesitve', 'lemondva'],
    teljesitve: [],
    lemondva: [],
};

export const kovetkezoAllapotok = (allapot, atvetelModja) =>
    (ALLAPOT_ATMENETEK[allapot] ?? []).filter(
        (uj) => uj !== 'kiszallitas_alatt' || atvetelModja === 'hazhozszallitas',
    );

const allapotTortenetSchema = new mongoose.Schema(
    {
        allapot: {
            type: String,
            enum: Object.keys(RENDELES_ALLAPOTOK),
            required: true,
        },
        datum: {
            type: Date,
            default: Date.now,
        },
        megjegyzes: {
            type: String,
            trim: true,
            maxlength: 300,
            default: '',
        },
    },
    { _id: false },
);

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
        // Bejelentkezve leadott rendelésnél a vásárló fiókja; vendégként null.
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            default: null,
            index: true,
        },
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
        // A végösszeg összetevői a rendelés pillanatában (régebbi rendeléseknél hiányzik).
        osszesites: {
            type: new mongoose.Schema(
                {
                    termekOsszeg: { type: Number, min: 0, required: true },
                    kedvezmenySzazalek: { type: Number, min: 0, default: 0 },
                    kedvezmeny: { type: Number, min: 0, default: 0 },
                    szallitasiDij: { type: Number, min: 0, default: 0 },
                    sulyKg: { type: Number, min: 0, default: 0 },
                    raklapok: { type: Number, min: 0, default: 0 },
                    raklapBetetdij: { type: Number, min: 0, default: 0 },
                    szallitas: {
                        type: new mongoose.Schema(
                            {
                                zona: String,
                                zonaNev: String,
                                jarmu: String,
                                fuvarok: Number,
                                darus: Boolean,
                                alapdij: Number,
                                darusPotdij: Number,
                            },
                            { _id: false },
                        ),
                        default: undefined,
                    },
                },
                { _id: false },
            ),
            default: undefined,
        },
        // Kiszállítás vagy személyes átvétel napja („ÉÉÉÉ-HH-NN”) és kiszállításnál az idősáv.
        atvetelNapja: {
            type: String,
            match: /^\d{4}-\d{2}-\d{2}$/,
            default: undefined,
        },
        idosav: {
            type: String,
            default: undefined,
        },
        // A vevő által visszahozott raklapok száma (ennyi betétdíj jár vissza).
        visszahozottRaklapok: {
            type: Number,
            min: 0,
            default: 0,
        },
        // Mikor ment ki a visszaigazoló (vevő) és az értesítő (bolt) e-mail, illetve a hiba oka.
        ertesitesek: {
            type: new mongoose.Schema(
                {
                    vevo: { type: Date, default: null },
                    bolt: { type: Date, default: null },
                    hiba: { type: String, default: '' },
                },
                { _id: false },
            ),
            default: undefined,
        },
        allapot: {
            type: String,
            enum: Object.keys(RENDELES_ALLAPOTOK),
            default: 'feldolgozasra_var',
        },
        allapotTortenet: {
            type: [allapotTortenetSchema],
            default: () => [{ allapot: 'feldolgozasra_var' }],
        },
    },
    { timestamps: true },
);

// A dashboard időszakos lekérdezései dátum szerint, a rendeléskezelő állapot szerint szűr.
rendelesSchema.index({ createdAt: -1 });
rendelesSchema.index({ allapot: 1, createdAt: -1 });

const RendelesModel = mongoose.model('rendeles', rendelesSchema);

export default RendelesModel;