import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_API_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const pictureUploader = async (req, res, next) => {
    try {
        const { kepek } = req.body;

        let kepekFel = [];
        for (let i = 0; i < kepek.length; i++) {
            if (kepek[i].toString().includes('http')) {
                const result = await cloudinary.uploader.upload(kepek[i]);

                kepekFel.push(result.url);
            } else {
                const feltoltKep = path.join(
                    __dirname,
                    '..',
                    'public',
                    'images',
                    kepek[i],
                );
                const result = await cloudinary.uploader.upload(feltoltKep);

                kepekFel.push(result.url);
            }
        }

        req.body.kepek = kepekFel;

        next();
    } catch (error) {
        console.error('Cloudinary hiba:', error);
        res.status(500).json({
            msg: 'Képfeltöltési hiba!',
        });
    }
};

export default pictureUploader;
