import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';
import TermekModel from '../models/Termek.mjs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_API_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const pictureDeleter = async (req, res, next) => {
    try {
        const { id } = req.params;
        const building = await TermekModel.findById(id);
        if (!building) {
            return res.status(404).json({ msg: 'Az termék nem található!' });
        }

        const legacyFields = ['kep1', 'kep2', 'kep3', 'kep'];
        const oldImages = Array.isArray(building.kepek) && building.kepek.length
            ? building.kepek
            : legacyFields.map((field) => building[field]);
        const validOldImages = oldImages.filter(
            (image) => typeof image === 'string' && image,
        );
        let imagesToDelete = validOldImages;

        if (req.method === 'PUT') {
            const submittedLegacyFields = legacyFields.filter((field) =>
                Object.prototype.hasOwnProperty.call(req.body, field),
            );
            const hasImageUpdate =
                Object.prototype.hasOwnProperty.call(req.body, 'kepek') ||
                submittedLegacyFields.length > 0;

            if (hasImageUpdate) {
                const newImages = Array.isArray(req.body.kepek)
                    ? req.body.kepek
                    : typeof req.body.kepek === 'string'
                      ? [req.body.kepek]
                      : legacyFields
                            .map((field) => req.body[field])
                            .filter((image) => typeof image === 'string' && image);
                const retainedImages = new Set(newImages);
                imagesToDelete = validOldImages.filter(
                    (image) => !retainedImages.has(image),
                );
            } else {
                imagesToDelete = [];
            }
        }

        const publicIds = new Set();
        for (const image of imagesToDelete) {
            try {
                const imageUrl = new URL(image);
                if (imageUrl.hostname !== 'res.cloudinary.com') continue;

                const uploadPath = imageUrl.pathname.split('/upload/')[1];
                if (!uploadPath) continue;

                const publicId = uploadPath
                    .replace(/^v\d+\//, '')
                    .replace(/\.[^/.]+$/, '');
                if (publicId) publicIds.add(publicId);
            } catch {
                // Nem URL vagy nem Cloudinary URL: nincs mit törölni a Cloudinaryből.
            }
        }

        await Promise.all(
            [...publicIds].map((publicId) =>
                cloudinary.uploader.destroy(publicId),
            ),
        );

        next();
    } catch (error) {
        console.error('Cloudinary hiba:', error);
        res.status(500).json({
            msg: 'Képtörlési hiba!',
        });
    }
};

export default pictureDeleter;
