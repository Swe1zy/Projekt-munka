// Kártyán belüli kisebb mutatók: felirat, érték és opcionális magyarázó sor.
const KulcsSzamok = ({ sorok }) => (
    <dl className="db-kulcsszamok">
        {sorok.map((sor) => (
            <div key={sor.cimke} className={sor.kiemelt ? 'db-kulcsszam--kiemelt' : undefined}>
                <dt>{sor.cimke}</dt>
                <dd>
                    <strong>{sor.ertek}</strong>
                    {sor.mellek && <span>{sor.mellek}</span>}
                </dd>
            </div>
        ))}
    </dl>
);

export default KulcsSzamok;
