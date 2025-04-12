import './PokemonStatsPage.css';
import { Link } from "react-router-dom";
import pikapika from '../../assets/pikapika.png';

const PokemonStatsPage = () => {
    
  return (
    <div className="pokemon-page">
      <div className="header-container">
        <div className="return-btn-container">
            <div id="btn"><Link to="/">Return</Link></div>
            <div id="header">
                <h3>PokeStats</h3>
            </div>
            <div id="subheader">
                <p>Search the stats of all discoverable Pokemon!</p>
            </div>
            </div>
        <div className="search-bar"><input type="text" placeholder="Pikachu" /></div>
      </div>

      <div className="main-container">
        <div className="image-container">
            <img src={pikapika} alt="Pokemon Image..." /></div>
        <div className="stats-container">
            <p id="result"></p>
        </div>
      </div>
    </div>
  );
};

export default PokemonStatsPage;
