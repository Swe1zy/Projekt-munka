const getMain = (req, res) => {
    try {
        return res.status(200).render('index.ejs');
    } catch (error) {
        console.error('Főoldal-hiba:', error);
        return res.status(500).json({ msg: 'Az oldal betöltése nem sikerült.' });
    }
};

export default getMain;
