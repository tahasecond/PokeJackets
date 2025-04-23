// The main page we start on
import { Link } from 'react-router-dom'
import "./HomePage.css"


const HomePage = () => {
    const handleLogout = () => {
        try {
            localStorage.removeItem("token");
            window.location.href = '/';
        } catch (error) {
            console.error("Logout error:", error);
        }
    }

    return (
        <div className="home-container">
            <div className="logout-container">
                <button onClick={handleLogout} className="logout-button">
                    Logout
                </button>
            </div>
            <div className="content">
                <h1>Welcome to PokeJackets!</h1>
                <Link to="/PokemonStatsPage">Check Pokemon Stats</Link>
                <Link to="/trading"> Check out TradingPage</Link>
            </div>
        </div>
    );
}

export default HomePage;