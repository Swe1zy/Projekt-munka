import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';
import fs from 'node:fs/promises';
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
        const { cloud_name, api_key, api_secret } = cloudinary.config();
        if (!cloud_name || !api_key || !api_secret) {
            return res.status(503).json({
                msg: 'A Cloudinary nincs konfigurálva. Ellenőrizd a CLOUDINARY_API_CLOUD_NAME, CLOUDINARY_API_KEY és CLOUDINARY_API_SECRET értékeket a backend/.env fájlban.',
            });
        }

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
            if (/^data:image\//i.test(image) && image.length > 11 * 1024 * 1024) {
                return res.status(413).json({ msg: 'Egy kép legfeljebb 8 MB lehet.' });
            }

            let source = image;
            if (!/^https?:\/\//i.test(image) && !/^data:image\//i.test(image)) {
                const imageDirectory = path.resolve(__dirname, '..', 'public', 'images');
                source = path.resolve(imageDirectory, image);
                if (!source.startsWith(`${imageDirectory}${path.sep}`)) {
                    return res.status(400).json({ msg: 'Érvénytelen képfájlnév.' });
                }
                await fs.access(source);
            }

            const result = await cloudinary.uploader.upload(source, {
                resource_type: 'image',
            });
            kepek[index] = result.secure_url;
        }

        if (Object.prototype.hasOwnProperty.call(req.body, 'kepek')) {
            req.body.kepek = kepek;
        }

        next();
    } catch (error) {
        console.error('Cloudinary hiba:', error);
        res.status(502).json({
            msg: `Képfeltöltési hiba: ${error.message}`,
        });
    }
};

export default pictureUploader;
