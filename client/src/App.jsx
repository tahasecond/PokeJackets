import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PokemonStatsPage from './pages/PokemonStatsPage/PokemonStatsPage';
import MarketplacePage from './pages/MarketplacePage/MarketplacePage';
import AiGenerationPage from './pages/AiGenerationPage/AiGenerationPage';
import CollectionPage from './pages/CollectionPage/CollectionPage';
import ErrorBoundary from './components/ErrorBoundary';
import Register from './pages/Register/Register';
import Login from './pages/Login/Login';
import TradingPage from './pages/TradingPage/TradingPage';
import { BalanceProvider } from './context/BalanceContext';
import DailyShopPage from './pages/DailyShopPage/DailyShopPage';

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  const validateToken = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuth(false);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('https://pokejackets-93oe.onrender.com/api/user/profile/', {
        headers: {
          'Authorization': `Token ${token}`,  
        }
      });

      if (response.ok) {
        setIsAuth(true);
      } else {
        localStorage.removeItem('token');
        setIsAuth(false);
      }
    } catch (error) {
      console.error('Token validation error:', error);
      localStorage.removeItem('token');
      setIsAuth(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    validateToken();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ErrorBoundary>
      <BalanceProvider>
        <Router>
          <Routes>
            <Route path="/register" 
              element={isAuth ? <Navigate to="/" /> : <Register />} 
            />
            <Route path="/login" 
              element={isAuth ? <Navigate to="/" /> : <Login />} 
            />
            <Route path="/" 
              element={isAuth ? <Navigate to="/dailyshop" /> : <Navigate to="/login" />} 
            />
            <Route path="/PokemonStatsPage" 
              element={isAuth ? <PokemonStatsPage /> : <Navigate to="/login" />} 
            />
            <Route path="/marketplace" 
              element={isAuth ? <MarketplacePage /> : <Navigate to="/login" />} 
            />
            <Route path="/pokemon/:id" 
              element={isAuth ? <PokemonStatsPage /> : <Navigate to="/login" />} 
            />
            <Route path="/pokemon" 
              element={isAuth ? <PokemonStatsPage /> : <Navigate to="/login" />} 
            />
            <Route path="/aigeneration" 
              element={isAuth ? <AiGenerationPage /> : <Navigate to="/login" />} 
            />
            <Route path="/trading" 
              element={isAuth ? <TradingPage /> : <Navigate to="/login" />} 
            />
            <Route path="/collection" 
              element={isAuth ? <CollectionPage /> : <Navigate to="/login" />} 
            />
            <Route path="/dailyshop" 
              element={isAuth ? <DailyShopPage /> : <Navigate to="/login" />} 
            />
          </Routes>
        </Router>
      </BalanceProvider>
    </ErrorBoundary>
  );
}

export default App;