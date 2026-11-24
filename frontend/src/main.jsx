import { createRoot } from 'react-dom/client';
import './index.css';
import './Uveg.css';
import './Sotet.css';
import './Rtl.css';
import App from './App.jsx';
import { nyelvInditasa } from './utils/nyelv';
import { penznemInditasa } from './utils/penznem';
import { temaInditasa } from './utils/tema';

temaInditasa();
penznemInditasa();

// A mentett nyelv szótára még a kirajzolás előtt betöltődik, így nem villan fel a magyar szöveg.
nyelvInditasa().then(() => {
    createRoot(document.getElementById('root')).render(<App />);
});
