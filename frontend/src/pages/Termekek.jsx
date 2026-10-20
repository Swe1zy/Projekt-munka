import { useEffect, useState } from 'react';
import './Termekek.css';
import Building from '../components/Termek';

const Termekek = () => {
    const [termekek, setTermekek] = useState([]);

    useEffect(() => {
        const leker = async () => {
            const response = await fetch(
                'http://localhost:3600/api/frontend-buildings',
            );

            const valasz = await response.json();

            if (response.ok) setTermekek(valasz.buildings);
            else window.alert(`Hiba: ${valasz.msg}`);
        };

        leker();
    }, []);

    return (
        <div className="termekek-kontener">
            <h1>Termékek</h1>
            <div id="termekek-kontener">
                {termekek.map((termek) => {
                    return (
                        <Building
                            key={termek._id}
                            building={termek}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default Termekek;