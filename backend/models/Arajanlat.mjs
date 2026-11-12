import mongoose from 'mongoose';

export const ARAJANLAT_ALLAPOTOK = {
    uj: 'Új',
    folyamatban: 'Folyamatban',
    megvalaszolva: 'Megválaszolva',
    lezarva: 'Lezárva',
};

const arajanlatTetelSchema = new mongoose.Schema(
    {
        termekId: { type: mongoose.Schema.Types.ObjectId, ref: 'termek', required: true },
        nev: { type: String, required: true },
        mennyiseg: { type: Number, min: 0.01, required: true },
        egyseg: { type: String, required: true },
        // A kérés pillanatában érvényes listaár.
        listaar: { type: Number, min: 0, required: true },
    },
    { _id: false },
);

const arajanlatSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', default: null },
        nev: { type: String, trim: true, required: true },
        cegnev: { type: String, trim: true, default: '' },
        adoszam: { type: String, trim: true, default: '' },
        email: { type: String, trim: true, lowercase: true, required: true },
        telefon: { type: String, trim: true, default: '' },
        iranyitoszam: { type: String, trim: true, default: '' },
        telepules: { type: String, trim: true, default: '' },
        megjegyzes: { type: String, trim: true, default: '' },
        tetelek: { type: [arajanlatTetelSchema], default: [] },
        listaOsszeg: { type: Number, min: 0, default: 0 },
        allapot: {
            type: String,
            enum: Object.keys(ARAJANLAT_ALLAPOTOK),
            default: 'uj',
        },
        // Belső megjegyzés (pl. a kiküldött ajánlat összege, határideje).
        adminMegjegyzes: { type: String, trim: true, default: '' },
    },
    { timestamps: true },
);

arajanlatSchema.index({ allapot: 1, createdAt: -1 });

const ArajanlatModel = mongoose.model('arajanlat', arajanlatSchema);

export default ArajanlatModel;
