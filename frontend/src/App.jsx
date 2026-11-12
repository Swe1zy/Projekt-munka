import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Nav from './components/Nav';
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
                                    path="/admin/termekek"
                                    element={<AdminTermekek />}
                                />
                                <Route
                                    path="/admin/dashboard"
                                    element={<AdminDashboard />}
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
                            </Routes>
                        </AuthProvider>
                    </CartProvider>
                </ToastProvider>
            </BrowserRouter>
        </div>
    );
}

export default App;
