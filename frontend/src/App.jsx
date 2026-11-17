import { lazy, Suspense } from 'react';
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
import Termekek from './pages/Termekek';
import TermekReszlet from './pages/TermekReszlet';

// A böngészés fő oldalai azonnal betöltődnek; a többi (pénztár, profil, admin,
// jogi oldalak) csak megnyitáskor, így a kezdőoldal JavaScriptje jóval kisebb.
const Vasarlas = lazy(() => import('./pages/Vasarlas'));
const Login = lazy(() => import('./pages/Login'));
const Logout = lazy(() => import('./pages/Logout'));
const Profil = lazy(() => import('./pages/Profil'));
const Register = lazy(() => import('./pages/Register'));
const AdminTermekek = lazy(() => import('./pages/AdminTermekek'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminRendelesek = lazy(() => import('./pages/AdminRendelesek'));
const AdminArajanlatok = lazy(() => import('./pages/AdminArajanlatok'));
const Arajanlat = lazy(() => import('./pages/Arajanlat'));
const Kalkulator = lazy(() => import('./pages/Kalkulator'));
const StripeSikeres = lazy(() => import('./pages/StripeSikeres'));
const StripeMegszakitva = lazy(() => import('./pages/StripeMegszakitva'));
const Aszf = lazy(() => import('./pages/Aszf'));
const SutiTajekoztato = lazy(() => import('./pages/SutiTajekoztato'));
const NemTalalhato = lazy(() => import('./pages/NemTalalhato'));

const OldalBetoltes = () => (
    <main className="oldal-betoltes" aria-busy="true">Betöltés…</main>
);

function App() {
    return (
        <div className="app-kontener">
            <BrowserRouter>
                <ToastProvider>
                    <CartProvider>
                        <AuthProvider>
                            <Nav />
                            <Suspense fallback={<OldalBetoltes />}>
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
                                    <Route
                                        path="*"
                                        element={<NemTalalhato />}
                                    />
                                </Routes>
                            </Suspense>
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
