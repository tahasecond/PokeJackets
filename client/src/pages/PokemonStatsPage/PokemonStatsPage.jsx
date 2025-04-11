import './PokemonStatsPage.css';
import { Link } from "react-router-dom";

const PokemonStatsPage = () => {
  return (
    <div className="pokemon-page">
      <div className="header-container">
        <div className="return-btn-container"><Link to="/">Back</Link></div>
        <div className="search-bar"><input type="text" placeholder="Pikachu" /></div>
      </div>

      <div className="main-container">
        <div className="image-container"></div>
        <div className="stats-container"></div>
      </div>
    </div>
  );
};

export default PokemonStatsPage;
