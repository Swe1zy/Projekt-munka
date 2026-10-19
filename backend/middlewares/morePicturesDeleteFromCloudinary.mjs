import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';
import BuildingModel from '../models/Termek.mjs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_API_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const pictureDeleter = async (req, res, next) => {
    try {
        const { id } = req.params;
        const torolKep = await BuildingModel.findById({ _id: id });
        const kepek = torolKep.kepek;

        for (let i = 0; i < kepek.length; i++) {
            const kep = kepek[i].split('/')[7].split('.')[0];
            await cloudinary.uploader.destroy(kep.toString());
        }

        next();
    } catch (error) {
        console.error('Cloudinary hiba:', error);
        res.status(500).json({
            msg: 'Képtörlési hiba!',
        });
    }
};

export default pictureDeleter;
