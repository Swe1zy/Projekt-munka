import { useEffect, useState } from 'react';
import './Termekek.css';
import Termek from '../components/Termek';
import { API_URL } from '../config';

const Termekek = () => {
    const [termekek, setTermekek] = useState([]);

    useEffect(() => {
        const leker = async () => {
            try {
                const response = await fetch(`${API_URL}/frontend-termekek`);

                const valasz = await response.json();

                if (response.ok) setTermekek(valasz.termekek);
                else window.alert(`Hiba: ${valasz.msg}`);
            } catch {
                window.alert('A szerver nem érhető el. Próbáld újra később!');
            }
        };

        leker();
    }, []);

    return (
        <div className="termekek-kontener">
            <h1>Termékek</h1>
            <div id="termekek-kontener">
                {termekek.map((termek) => {
                    return (
                        <Termek
                            key={termek._id}
                            termek={termek}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default Termekek;