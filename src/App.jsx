import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RagDashboard from './pages/RagDashboard';
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
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
