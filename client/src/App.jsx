import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CollectionPage from './pages/CollectionPage';
import LogsPage from './pages/LogsPage';
import Navbar from './components/layout/Navbar';

function Spinner() {
  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center">
      <div className="w-9 h-9 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
    </div>
  );
}

function AppLayout({ children }) {
  return (
    <div className="min-h-screen mesh-bg">
      <Navbar />
      <main className="pt-16">{children}</main>
    </div>
  );
}

function Private({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <AppLayout>{children}</AppLayout> : <Navigate to="/login" replace />;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
        <Route path="/" element={<Private><DashboardPage /></Private>} />
        <Route path="/collection/:id" element={<Private><CollectionPage /></Private>} />
        <Route path="/logs" element={<Private><LogsPage /></Private>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
