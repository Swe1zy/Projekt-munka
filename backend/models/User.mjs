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

// A címjegyzék egy eleme (pl. „Családi ház – Göd”), a pénztárban választható.
const szallitasiCimSchema = new mongoose.Schema({
    megnevezes: { type: String, trim: true, required: true, maxlength: 60 },
    atvevoNev: { type: String, trim: true, required: true },
    iranyitoszam: { type: String, trim: true, required: true },
    telepules: { type: String, trim: true, required: true },
    utca: { type: String, trim: true, required: true },
    megjegyzes: { type: String, trim: true, default: '' },
    // Behajtás, kapu, súlykorlátozás, a raklapok lerakodási helye.
    behajtas: { type: String, trim: true, default: '' },
});

export const MAX_SZALLITASI_CIM = 10;

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
        // Kapcsolattartási telefonszám (a kiszállításhoz); a pénztár ezzel tölti ki előre.
        telefon: { type: String, trim: true, default: '' },
        // A profilban elmentett számlázási adatok, amelyekkel a pénztár előre kitölti az űrlapot.
        // A `szallitas` a régi, egyetlen mentett szállítási cím: első lekéréskor átkerül a címjegyzékbe.
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
        szallitasiCimek: {
            type: [szallitasiCimSchema],
            default: [],
            validate: {
                validator: (cimek) => cimek.length <= MAX_SZALLITASI_CIM,
                message: `Legfeljebb ${MAX_SZALLITASI_CIM} szállítási cím menthető.`,
            },
        },
        alapertelmezettCim: { type: mongoose.Schema.Types.ObjectId, default: null },
        // A pénztár alapértékei házhozszállításnál.
        szallitasiBeallitasok: {
            darus: { type: Boolean, default: false },
            idosav: { type: String, default: '' },
        },
        ertesitesiBeallitasok: {
            // E-mail a rendelés állapotának változásáról (visszaigazolva, úton, teljesítve…).
            allapotValtozas: { type: Boolean, default: true },
            // Akciós hírlevél: csak kifejezett hozzájárulással, az időpont a hozzájárulás igazolása.
            hirlevel: { type: Boolean, default: false },
            hirlevelIdopont: { type: Date, default: null },
        },
    },
    { timestamps: true },
);

const UserModel = mongoose.model('user', userSchema);

export default UserModel;
