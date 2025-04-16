import { useState } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PokemonStatsPage from './pages/PokemonStatsPage/PokemonStatsPage';
import HomePage from './pages/HomePage/HomePage';
import MarketplacePage from './pages/MarketplacePage/MarketplacePage';

function App() {
  const [count, setCount] = useState(0);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/PokemonStatsPage" element={<PokemonStatsPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
      </Routes>
    </Router>
  );
}

export default App;
