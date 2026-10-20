import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Nav from './components/Nav';
import Home from './pages/Home';
import Termekek from './pages/Termekek';

function App() {
    return (
        <div className="app-kontener">
            <BrowserRouter>
                <Nav />
                <Routes>
                    <Route
                        path="/"
                        element={<Home />}
                    />
                    <Route
                        path="/termekek"
                        element={<Termekek />}
                    />
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;