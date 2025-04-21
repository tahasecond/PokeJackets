import { useState } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PokemonStatsPage from './pages/PokemonStatsPage/PokemonStatsPage';
import HomePage from './pages/HomePage/HomePage';
import MarketplacePage from './pages/MarketplacePage/MarketplacePage';
import AiGenerationPage from './pages/AiGenerationPage/AiGenerationPage';
import ErrorBoundary from './components/ErrorBoundary';
import Register from './pages/Register/Register';
import Login from './pages/Login/Login';

function App() {
  const [count, setCount] = useState(0);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/PokemonStatsPage" element={<PokemonStatsPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/pokemon/:id" element={<PokemonStatsPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        
        <Route path="/aigeneration" element={
          <ErrorBoundary>
            <AiGenerationPage />
          </ErrorBoundary>
        } />
      </Routes>
    </Router>
  );
}

export default App;
