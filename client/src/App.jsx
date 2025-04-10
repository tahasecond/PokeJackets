import { useState } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PokemonStatsPage from './pages/PokemonStatsPage';
import HomePage from './pages/HomePage';

function App() {
  const [count, setCount] = useState(0);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/PokemonStatsPage" element={<PokemonStatsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
