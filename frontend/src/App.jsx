import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Nav from './components/Nav';
import AuthProvider from './context/AuthProvider';
import ToastProvider from './context/ToastProvider';
import Home from './pages/Home';
import Login from './pages/Login';
import Logout from './pages/Logout';
import Profil from './pages/Profil';
import Register from './pages/Register';
import Termekek from './pages/Termekek';

function App() {
    return (
        <div className="app-kontener">
            <BrowserRouter>
                <ToastProvider>
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
                </ToastProvider>
            </BrowserRouter>
        </div>
    );
}

export default App;
