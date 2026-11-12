import mongoose from 'mongoose';

// Az adatbázisban már szereplő összes kategória és mértékegység – a hiányzók miatt
// eddig nem lehetett szerkeszteni (és szűrni) pl. az ömlesztett anyagokat.
export const TERMEKEK_KATEGORIAK = [
    'Falazóanyagok',
    'Cement és kötőanyagok',
    'Ömlesztett anyagok és betonok',
    'Faanyagok',
    'Tetőfedés',
    'Hőszigetelés',
    'Térkövek és burkolatok',
    'Szerszámok és kellékek',
];

export const TERMEK_EGYSEGEK = ['m³', 'm²', 'db', 'csomag', 'doboz', 'készlet', 'pár', 'tekercs'];

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
            validate: {
                validator(value) {
                    return this.egyseg !== 'db' || Number.isInteger(value);
                },
                message: 'A darabban megadott készletnek egész számnak kell lennie.',
            },
            required: true,
        },
        // Nem kötelező szállítási/kalkulátor adatok. Ha hiányoznak, a config/uzlet.mjs
        // kategória szerinti alapértékei érvényesek.
        suly: {
            // kg / egység (pl. kg/m², kg/m³, kg/db)
            type: Number,
            min: 0,
            default: undefined,
        },
        raklapon: {
            // egység / raklap; 0 = nem raklapos áru
            type: Number,
            min: 0,
            default: undefined,
        },
        darabPerEgyseg: {
            // pl. 16 db tégla / m², 10 db cserép / m², 2 tábla / m²
            type: Number,
            min: 0,
            default: undefined,
        },
    },
    { timestamps: true },
);

const TermekModel = mongoose.model('termek', termekSchema);

export default TermekModel;