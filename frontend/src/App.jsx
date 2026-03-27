import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RagDashboard from './pages/RagDashboard';
import AdminPortal from './pages/AdminPortal';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NetworkBackground from './components/NetworkBackground';
import { useAuthStore } from './store/useAuthStore';
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import './App.css';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, role, isLoading } = useAuthStore();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center relative z-20"><div className="w-10 h-10 border-4 border-[#0672CE] border-t-transparent rounded-full animate-spin"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && role !== 'admin') return <Navigate to="/dashboard" replace />;
  
  return children;
};

function App() {
  const initializeAuth = useAuthStore(state => state.initialize);
  
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <BrowserRouter>
      {/* Background stays rendered across all pages */}
      <NetworkBackground />
      <div className="relative z-10 w-full min-h-screen">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/rag" element={<ProtectedRoute><RagDashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><RagDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminPortal /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
