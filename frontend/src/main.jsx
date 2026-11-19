import { createRoot } from 'react-dom/client';
import './index.css';
import './Uveg.css';
import './Sotet.css';
import App from './App.jsx';
import { temaInditasa } from './utils/tema';

temaInditasa();

createRoot(document.getElementById('root')).render(<App />);
