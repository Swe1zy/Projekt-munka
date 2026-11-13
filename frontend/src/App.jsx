import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Nav from './components/Nav';
import Lablec from './components/Lablec';
import SutiSav from './components/SutiSav';
import AuthProvider from './context/AuthProvider';
import CartProvider from './context/CartProvider';
import ToastProvider from './context/ToastProvider';
import Home from './pages/Home';
import Kosar from './pages/Kosar';
import Vasarlas from './pages/Vasarlas';
import Login from './pages/Login';
import Logout from './pages/Logout';
import Profil from './pages/Profil';
import Register from './pages/Register';
import Termekek from './pages/Termekek';
import TermekReszlet from './pages/TermekReszlet';
import AdminTermekek from './pages/AdminTermekek';
import AdminDashboard from './pages/AdminDashboard';
import AdminRendelesek from './pages/AdminRendelesek';
import AdminArajanlatok from './pages/AdminArajanlatok';
import Arajanlat from './pages/Arajanlat';
import Kalkulator from './pages/Kalkulator';
import StripeSikeres from './pages/StripeSikeres';
import StripeMegszakitva from './pages/StripeMegszakitva';
import Aszf from './pages/Aszf';
import SutiTajekoztato from './pages/SutiTajekoztato';

function App() {
    return (
        <div className="app-kontener">
            <BrowserRouter>
                <ToastProvider>
                    <CartProvider>
                        <AuthProvider>
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
                                <Route
                                    path="/termekek/:id"
                                    element={<TermekReszlet />}
                                />
                                <Route
                                    path="/kosar"
                                    element={<Kosar />}
                                />
                                <Route
                                    path="/vasarlas"
                                    element={<Vasarlas />}
                                />
                                <Route
                                    path="/fizetes/sikeres"
                                    element={<StripeSikeres />}
                                />
                                <Route
                                    path="/fizetes/megszakitva"
                                    element={<StripeMegszakitva />}
                                />
                                <Route
                                    path="/admin/termekek"
                                    element={<AdminTermekek />}
                                />
                                <Route
                                    path="/admin/dashboard"
                                    element={<AdminDashboard />}
                                />
                                <Route
                                    path="/admin/rendelesek"
                                    element={<AdminRendelesek />}
                                />
                                <Route
                                    path="/admin/arajanlatok"
                                    element={<AdminArajanlatok />}
                                />
                                <Route
                                    path="/kalkulator"
                                    element={<Kalkulator />}
                                />
                                <Route
                                    path="/arajanlat"
                                    element={<Arajanlat />}
                                />
                                <Route
                                    path="/register"
                                    element={<Register />}
                                />
                                <Route
                                    path="/login"
                                    element={<Login />}
                                />
                                <Route
                                    path="/logout"
                                    element={<Logout />}
                                />
                                <Route
                                    path="/profil"
                                    element={<Profil />}
                                />
                                <Route
                                    path="/aszf"
                                    element={<Aszf />}
                                />
                                <Route
                                    path="/sutik"
                                    element={<SutiTajekoztato />}
                                />
                            </Routes>
                            <Lablec />
                            <SutiSav />
                        </AuthProvider>
                    </CartProvider>
                </ToastProvider>
            </BrowserRouter>
        </div>
    );
}

export default App;
