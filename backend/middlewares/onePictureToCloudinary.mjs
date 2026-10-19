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
        const legacyFields = ['kep1', 'kep2', 'kep3', 'kep'];
        const legacyImages = legacyFields
            .map((field) => req.body[field])
            .filter((image) => typeof image === 'string' && image.trim());
        const submittedImages = Array.isArray(req.body.kepek)
            ? req.body.kepek
            : typeof req.body.kepek === 'string'
              ? [req.body.kepek]
              : legacyImages;
        const kepek = submittedImages.filter(
            (image) => typeof image === 'string' && image.trim(),
        );

        if (
            Object.prototype.hasOwnProperty.call(req.body, 'kepek') ||
            legacyFields.some((field) =>
                Object.prototype.hasOwnProperty.call(req.body, field),
            )
        ) {
            req.body.kepek = kepek;
        }

        for (let index = 0; index < kepek.length; index += 1) {
            const image = kepek[index].trim();

            // A már Cloudinaryben tárolt kép URL-jét nem kell újra feltölteni.
            if (/^https?:\/\/res\.cloudinary\.com\//i.test(image)) continue;

            const source = /^https?:\/\//i.test(image)
                ? image
                : path.join(__dirname, '..', 'public', 'images', image);
            const result = await cloudinary.uploader.upload(source);
            kepek[index] = result.secure_url;
        }

        if (Object.prototype.hasOwnProperty.call(req.body, 'kepek')) {
            req.body.kepek = kepek;
        }

        next();
    } catch (error) {
        console.error('Cloudinary hiba:', error);
        res.status(500).json({
            msg: 'Képfeltöltési hiba!',
        });
    }
};

export default pictureUploader;
