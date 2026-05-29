import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RoomProvider, useRoom } from './context/RoomContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RoomsPage from './pages/RoomsPage';
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
  const { room } = useRoom();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!room) return <Navigate to="/rooms" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <Navigate to="/rooms" replace /> : children;
}

function RoomGate({ children }) {
  const { user, loading } = useAuth();
  const { room } = useRoom();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (room) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <RoomProvider>
        <Routes>
          <Route path="/login"    element={<GuestOnly><LoginPage /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
          <Route path="/rooms"    element={<RoomGate><RoomsPage /></RoomGate>} />
          <Route path="/"                 element={<Private><DashboardPage /></Private>} />
          <Route path="/collection/:id"   element={<Private><CollectionPage /></Private>} />
          <Route path="/logs"             element={<Private><LogsPage /></Private>} />
          <Route path="*"                 element={<Navigate to="/" replace />} />
        </Routes>
      </RoomProvider>
    </AuthProvider>
  );
}
