import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RagDashboard from './pages/RagDashboard';
import AdminPortal from './pages/AdminPortal';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NetworkBackground from './components/NetworkBackground';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      {/* Background stays rendered across all pages */}
      <NetworkBackground />
      <div className="relative z-10 w-full min-h-screen">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/rag" element={<RagDashboard />} />
          <Route path="/dashboard" element={<RagDashboard />} />
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
