// Rangsorolt vízszintes sávok egy színnel: a hosszabb sáv nagyobb értéket jelent,
// az érték a sáv végén olvasható, így szín nélkül is értelmezhető.
const RangsorSavok = ({ sorok, formazo, ures }) => {
    if (!sorok.length) return <p className="db-ures">{ures}</p>;

    const maxErtek = Math.max(...sorok.map((sor) => sor.ertek), 0);

    return (
        <ol className="db-rangsor">
            {sorok.map((sor) => {
                const arany = maxErtek ? sor.ertek / maxErtek : 0;
                return (
                    <li key={sor.kulcs}>
                        <div className="db-rangsor-fej">
                            <span className="db-rangsor-nev" title={sor.cimke}>{sor.cimke}</span>
                            {sor.mellek && <span className="db-rangsor-mellek">{sor.mellek}</span>}
                        </div>
                        <div className="db-rangsor-sav">
                            <span
                                className="db-rangsor-jelolo"
                                style={{ '--arany': arany }}
                                aria-hidden="true"
                            />
                            <strong>{formazo(sor.ertek)}</strong>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
};

export default RangsorSavok;
