// The main page we start on
import { Link } from 'react-router-dom'
import "./HomePage.css"
import Navbar from '../../components/Navbar';

const HomePage = () => {
    return (
        <div className="home-container">
            <Navbar />
            
            <div className="home-content">
                <div className="welcome-section">
                    <h1>Welcome to PokeJackets!</h1>
                    <p>Your one-stop platform for Pokémon card trading, collection and AI creation</p>
                    
                    <div className="feature-buttons">
                        <Link to="/marketplace" className="feature-button marketplace">
                            <div className="button-icon">🛒</div>
                            <div className="button-text">
                                <h3>Marketplace</h3>
                                <p>Browse and buy Pokémon cards</p>
                            </div>
                        </Link>
                        
                        <Link to="/aigeneration" className="feature-button ai-creation">
                            <div className="button-icon">✨</div>
                            <div className="button-text">
                                <h3>AI Creation</h3>
                                <p>Create your own unique Pokémon cards</p>
                            </div>
                        </Link>
                        
                        <Link to="/trading" className="feature-button trading">
                            <div className="button-icon">🔄</div>
                            <div className="button-text">
                                <h3>Trading</h3>
                                <p>Trade cards with other trainers</p>
                            </div>
                        </Link>
                        
                        <Link to="/collection" className="feature-button collection">
                            <div className="button-icon">📚</div>
                            <div className="button-text">
                                <h3>My Pokémon</h3>
                                <p>View and manage your collection</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HomePage;