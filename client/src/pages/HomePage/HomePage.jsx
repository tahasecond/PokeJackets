// The main page we start on
import { Link } from 'react-router-dom'
import "./HomePage.css"

const HomePage = ( { onLogout } ) => {
    return(
        <div className="home-container">
            <div className="logout-container">
                <button onClick={onLogout} className="logout-button">
                    Logout
                </button>
            </div>
            <div className="content">
                <h1>Welcome to PokeJackets!</h1>
                <Link to="/PokemonStatsPage">Check Pokemon Stats</Link>
            </div>
        </div>
    );
}

export default HomePage;