import { useEffect, useState, useCallback } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PokemonStatsPage from './pages/PokemonStatsPage/PokemonStatsPage';
import HomePage from './pages/HomePage/HomePage';
import MarketplacePage from './pages/MarketplacePage/MarketplacePage';
import AiGenerationPage from './pages/AiGenerationPage/AiGenerationPage';
import ErrorBoundary from './components/ErrorBoundary';
import Register from './pages/Register/Register';
import Login from './pages/Login/Login';
import { logoutUser } from './api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogout = useCallback(() => {
    logoutUser();
    setIsLoggedIn(false);
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/register" element={isLoggedIn ? <Navigate to = "/" /> : <Register />} />
          <Route path="/login" element={isLoggedIn ? <Navigate to = "/" /> :<Login setIsLoggedIn={setIsLoggedIn} />} />
          
          <Route path="/*" element={
            isLoggedIn ? 
              <PrivateRoutes onLogout = {handleLogout} /> : 
              <Navigate to = "/login" />
              } />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

function PrivateRoutes({ onLogout }) {
  return (
    <Routes>
        <Route path="/" element={<HomePage onLogout = {onLogout} />} />
        <Route path="/PokemonStatsPage" element={<PokemonStatsPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/pokemon/:id" element={<PokemonStatsPage />} />
        <Route path="/aigeneration" element={<AiGenerationPage />} />
    </Routes>
  );
}
export default App;
