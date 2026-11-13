// Irányítószám, település és utca mezői a profil mentett címeihez.
const CimMezok = ({ cim, frissit, tipus }) => {
    const elotag = tipus === 'szallitas' ? 'shipping' : 'billing';

    return (
        <div className="profil-cim-mezok">
            <label className="auth-mezo">
                Irányítószám
                <input
                    type="text"
                    inputMode="numeric"
                    autoComplete={`${elotag} postal-code`}
                    pattern="\d{4}"
                    maxLength="4"
                    title="4 számjegy"
                    value={cim.iranyitoszam}
                    onChange={(event) => frissit('iranyitoszam', event.target.value)}
                    placeholder="1234"
                    required
                />
            </label>
            <label className="auth-mezo">
                Település
                <input
                    type="text"
                    autoComplete={`${elotag} address-level2`}
                    minLength="2"
                    maxLength="100"
                    value={cim.telepules}
                    onChange={(event) => frissit('telepules', event.target.value)}
                    required
                />
            </label>
            <label className="auth-mezo profil-cim-utca">
                Utca, házszám, emelet, ajtó
                <input
                    type="text"
                    autoComplete={`${elotag} street-address`}
                    minLength="3"
                    maxLength="200"
                    value={cim.utca}
                    onChange={(event) => frissit('utca', event.target.value)}
                    required
                />
            </label>
        </div>
    );
};

export default CimMezok;
