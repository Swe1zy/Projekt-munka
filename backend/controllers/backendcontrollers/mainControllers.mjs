const getMain = (req, res) => {
    try {
        return res.status(200).render('index.ejs');
    } catch (error) {
        return res.status(500).json({ msg: `Hiba: ${error.msg}` });
    }
};

export default getMain;
