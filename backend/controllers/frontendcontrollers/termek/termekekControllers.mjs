import TermekModel from '../../../models/Termek.mjs';

const getTermekek = async (req, res) => {
    try {
        const termekek = await TermekModel.find({}).sort({ createdAt: -1 });

        return res.status(200).json({ termekek });
    } catch (error) {
        return res.status(500).json({ msg: `Hiba: ${error.message}` });
    }
};

export { getTermekek };
