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
    },
    { timestamps: true },
);

const UserModel = mongoose.model('user', userSchema);

export default UserModel;
