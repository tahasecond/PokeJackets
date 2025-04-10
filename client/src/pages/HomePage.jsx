// The main page we start on
import { Link } from 'react-router-dom'

const HomePage = () => {
    return(
        <>
        <div>
            <h1>Welcome to PokeJackets!</h1>
            <Link to="/PokemonStatsPage">Check Pokemon Stats</Link>
        </div>
        </>
    );
}

export default HomePage;