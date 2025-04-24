import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PokemonStatsPage from './pages/PokemonStatsPage/PokemonStatsPage';
import HomePage from './pages/HomePage/HomePage';
import MarketplacePage from './pages/MarketplacePage/MarketplacePage';
import AiGenerationPage from './pages/AiGenerationPage/AiGenerationPage';
import CollectionPage from './pages/CollectionPage/CollectionPage';
import ErrorBoundary from './components/ErrorBoundary';
import Register from './pages/Register/Register';
import Login from './pages/Login/Login';
import TradingPage from './pages/TradingPage/TradingPage';
import { BalanceProvider } from './context/BalanceContext';

function App() {
  const isAuthenticated = () => !!localStorage.getItem('token');

  return (
    <ErrorBoundary>
      <BalanceProvider>
        <Router>
          <Routes>
            <Route path="/register" 
              element={isAuthenticated() ? <Navigate to="/" /> : <Register />} 
            />
            <Route path="/login" 
              element={isAuthenticated() ? <Navigate to="/" /> : <Login />} 
            />
            <Route path="/" 
              element={isAuthenticated() ? <HomePage /> : <Navigate to="/login" />} 
            />
            <Route path="/PokemonStatsPage" 
              element={isAuthenticated() ? <PokemonStatsPage /> : <Navigate to="/login" />} 
            />
            <Route path="/marketplace" 
              element={isAuthenticated() ? <MarketplacePage /> : <Navigate to="/login" />} 
            />
            <Route path="/pokemon/:id" 
              element={isAuthenticated() ? <PokemonStatsPage /> : <Navigate to="/login" />} 
            />
            <Route path="/aigeneration" 
              element={isAuthenticated() ? <AiGenerationPage /> : <Navigate to="/login" />} 
            />
            <Route path="/trading" 
              element={isAuthenticated() ? <TradingPage /> : <Navigate to="/login" />} 
            />
            <Route path="/collection" 
              element={isAuthenticated() ? <CollectionPage /> : <Navigate to="/login" />} 
            />
          </Routes>
        </Router>
      </BalanceProvider>
    </ErrorBoundary>
  );
}

export default App;