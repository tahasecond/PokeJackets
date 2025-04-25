import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './tradingpage.css';
import Navbar from '../../components/Navbar';

const TradingPage = () => {
    {/*    Friends Constants  */ } //I should have used a different folder but whatever :(
    const [showFriendID, setShowFriendId] = useState(false);
    const [friendID, setFriendID] = useState('loading');
    const [copied, setCopied] = useState(false);
    const [friends, setFriends] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [friendIdInput, setFriendIdInput] = useState('');
    const [addFriendMessage, setAddFriendMessage] = useState('');
    const [outgoingRequests, setOutgoingRequests] = useState([]);
    const navigate = useNavigate();

    {/*     Trading Constants */ }
    const [tradeFlow, setTradeFlow] = useState(null);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [userCards, setUserCards] = useState([]);
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [tradeError, setTradeError] = useState('');
    const [tradeCardDetails, setTradeCardDetails] = useState({});
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const fetchAllData = async () => {
        const token = localStorage.getItem('token');
        try {

            const userRes = await fetch('http://localhost:8000/api/user/profile/', {
                headers: { 'Authorization': `Token ${token}` }
            });
            if (userRes.ok) {
                const userData = await userRes.json();
                setFriendID(userData.id);
            }


            const [friendsRes, pendingRes] = await Promise.all([
                fetch('http://localhost:8000/api/friends/list/', {
                    headers: { 'Authorization': `Token ${token}` }
                }),
                fetch('http://localhost:8000/api/friends/pending/', {
                    headers: { 'Authorization': `Token ${token}` }
                })
            ]);

            if (friendsRes.ok) {
                const friendsData = await friendsRes.json();
                setFriends(friendsData.friends);
            }

            if (pendingRes.ok) {
                const pendingData = await pendingRes.json();
                setIncomingRequests(pendingData.incoming_requests);
                setOutgoingRequests(pendingData.outgoing_requests);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const sendFriendRequest = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/friends/request/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({ user_id: friendIdInput })
            });

            const data = await response.json();

            if (response.ok) {
                setAddFriendMessage("Invite sent! Refresh page to see updates.");
                setFriendIdInput('');

                setTimeout(() => {
                    setShowModal(false);
                    fetchAllData();
                    setAddFriendMessage('');
                }, 3000);
            } else {
                // Error case from server
                setAddFriendMessage(data.error || "Failed to send friend request");
            }
        } catch (error) {
            // Network error case
            setAddFriendMessage('Network error. Please try again.');
            console.error('Error sending friend request:', error);
        }
    };

    const handleAccept = async (requestId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/friends/respond/${requestId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({ action: 'accept' })
            });

            if (response.ok) {
                fetchAllData();
            } else {
                console.error('Failed to accept request:', await response.json());
            }
        } catch (error) {
            console.error('Error accepting request:', error);
        }
    };

    const handleDecline = async (requestId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/friends/respond/${requestId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({ action: 'decline' })
            });

            if (response.ok) {
                setIncomingRequests(incomingRequests.filter(req => req.id !== requestId));
            } else {
                console.error('Failed to decline request:', await response.json());
            }
        } catch (error) {
            console.error('Error declining request:', error);
        }
    };

    const handleCancelRequest = async (requestId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/api/friends/respond/${requestId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({ action: 'decline' })
            });

            if (response.ok) {
                setOutgoingRequests(outgoingRequests.filter(req => req.id !== requestId));
            } else {
                console.error('Failed to cancel request:', await response.json());
            }
        } catch (error) {
            console.error('Error canceling request:', error);
        }
    };
    const fetchCardDetails = async (cardId) => {
        try {
            // Skip if we already have this card's details
            if (tradeCardDetails[cardId]) return;

            const response = await fetch(`https://api.pokemontcg.io/v2/cards/${cardId}`);
            const data = await response.json();

            if (data.data) {
                setTradeCardDetails(prev => ({
                    ...prev,
                    [cardId]: {
                        name: data.data.name,
                        image: data.data.images?.small || data.data.images?.large,
                        // Add other details you might want to display
                    }
                }));
            }
        } catch (error) {
            console.error('Error fetching card details:', error);
        }
    };
    {/*  TRADING FUNCTIONS */ }
    const fetchUserCollection = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/collection/', {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch collection');
            }

            const data = await response.json();
            console.log("API Response:", data);

            // Transform data to consistent format
            const formattedCards = data.data.map(card => ({
                id: card.id || card.pokemon_id,
                name: card.name,
                image: card.images?.small || card.image || card.imageUrl,
                pokemon_id: card.pokemon_id
            }));

            console.log("Formatted Cards:", formattedCards);
            setUserCards(formattedCards);
        } catch (error) {
            console.error('Error fetching collection:', error);
            setTradeError('Failed to load your collection');
        }
    };

    useEffect(() => {
        if (tradeFlow === 'select-card') {
            fetchUserCollection();
        }
    }, [tradeFlow]);

    const initiateTrade = async () => {
        if (!selectedCardId || !selectedFriend) {
            setTradeError('Please select both a friend and a card');
            return;
        }

        setIsLoading(true);
        setTradeError('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/trades/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({
                    recipient_id: selectedFriend.id,
                    card_id: selectedCardId
                })
            });

            // First check if the response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Server returned ${response.status}: ${text}`);
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send trade');
            }

            alert(`Trade request sent to ${selectedFriend.username}!`);
            setTradeFlow(null);
            setSelectedFriend(null);
            setSelectedCardId(null);
            fetchPendingTrades();
        } catch (error) {
            console.error('Trade error:', error);
            setTradeError(error.message || 'Failed to send trade request');
        } finally {
            setIsLoading(false);
        }
    };


    const [pendingTrades, setPendingTrades] = useState({
        received: [],
        sent: []
    });

    const fetchPendingTrades = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/trades/pending/', {
                headers: { 'Authorization': `Token ${token}` }
            });

            const data = await response.json();
            if (response.ok) {
                setPendingTrades(data);
            }
        } catch (error) {
            console.error('Error fetching trades:', error);
        }
    };

    const respondToTrade = async (tradeId, action) => {
        try {
            const token = localStorage.getItem('token');
            let body = { action };

            // If accepting and we need to select a card
            if (action === 'accept' && !selectedResponseCard) {
                setCurrentTrade(pendingTrades.received.find(t => t.id === tradeId));
                setShowResponseModal(true);
                return;
            }

            if (selectedResponseCard) {
                body.recipient_card_id = selectedResponseCard;
            }

            const response = await fetch(`http://localhost:8000/api/trades/${tradeId}/respond/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (response.ok) {
                fetchPendingTrades();
                fetchUserCollection();
                setSelectedResponseCard(null);
                setShowResponseModal(false);

                if (action === 'accept') {
                    alert(data.status === 'awaiting_response'
                        ? 'Trade offer sent to original sender!'
                        : 'Trade completed successfully!');
                } else {
                    alert('Trade declined');
                }
            } else {
                setTradeError(data.error || 'Failed to respond to trade');
            }
        } catch (error) {
            console.error('Error responding to trade:', error);
            setTradeError('Network error. Please try again.');
        }
    };

    useEffect(() => {
        fetchPendingTrades();
    }, []);

    useEffect(() => {
        if (pendingTrades.received.length > 0 || pendingTrades.sent.length > 0) {
            const allCardIds = [
                ...new Set([
                    ...pendingTrades.received.map(t => t.card_id),
                    ...pendingTrades.sent.map(t => t.card_id)
                ])
            ];

            allCardIds.forEach(cardId => {
                if (!tradeCardDetails[cardId]) {
                    fetchCardDetails(cardId);
                }
            });
        }
    }, [pendingTrades]);

    return (
        <div className="trading-page-container">
            <Navbar />

            <div className="trading-content">
                {/* Left Panel - All friend-related components */}
                <div className="left-panel">
                    <div className="actions">
                        <button className="add-friend-btn" onClick={() => setShowModal(true)}>
                            Add Friend
                        </button>

                        {/* Friends List */}
                        <div className="section">
                            <h3 className="section-title">Friends</h3>
                            {friends.length > 0 ? (
                                <ul className="friends-list">
                                    {friends.map((friend) => (
                                        <li key={friend.id} className="friend-item">
                                            <div className="friend-info">
                                                <span className="friend-username">{friend.username}</span>
                                                <span className="friend-email">{friend.email}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="empty-state">No friends yet</p>
                            )}
                        </div>

                        {/* Incoming Friend Requests */}
                        <div className="section">
                            <h3 className="section-title">Friend Requests</h3>
                            {incomingRequests.length > 0 ? (
                                <ul className="friend-requests-list">
                                    {incomingRequests.map((request) => (
                                        <li key={request.id} className="request-item">
                                            <div className="request-info">
                                                <span className="request-username">{request.from_user.username}</span>
                                                <span className="request-email">{request.from_user.email}</span>
                                            </div>
                                            <div>
                                                <button
                                                    className="accept-btn"
                                                    onClick={() => handleAccept(request.id)}
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    className="decline-btn"
                                                    onClick={() => handleDecline(request.id)}
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="empty-state">No pending requests</p>
                            )}
                        </div>

                        {/* Outgoing Friend Requests */}
                        <div className="section">
                            <h3 className="section-title">Sent Requests</h3>
                            {outgoingRequests.length > 0 ? (
                                <ul className="outgoing-requests-list">
                                    {outgoingRequests.map((request) => (
                                        <li key={request.id} className="outgoing-item">
                                            <div className="request-info">
                                                <span className="request-username">{request.to_user.username}</span>
                                                <span className="request-email">{request.to_user.email}</span>
                                            </div>
                                            <button
                                                className="cancel-btn"
                                                onClick={() => handleCancelRequest(request.id)}
                                            >
                                                Cancel
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="empty-state">No outgoing requests</p>
                            )}
                        </div>
                    </div>

                    {/* Friend ID Section */}
                    <div className="friend-id-section">
                        <button
                            onClick={() => setShowFriendId(!showFriendID)}
                            className="toggle-id-btn"
                        >
                            {showFriendID ? "Hide Friend ID" : "Show Friend ID"}
                        </button>
                        {showFriendID && (
                            <div className="friend-id-box">
                                <p>{friendID}</p>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(friendID);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 1500);
                                    }}
                                    className="copy-id-btn"
                                >
                                    {copied ? "Copied!" : "Copy"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                {/* Trade Requests */}
                <div className="trade-requests">
                    {/* Received Requests */}
                    <div className="received-requests">
                        <h4>Received</h4>
                        {pendingTrades.received.length > 0 ? (
                            pendingTrades.received.map(trade => (
                                <div key={trade.id} className="trade-request">
                                    <div className="trade-info">
                                        <p><strong>{trade.sender}</strong> wants to trade:</p>
                                        <div className="card-preview">
                                            {tradeCardDetails[trade.card_id] ? (
                                                <>
                                                    <img
                                                        src={tradeCardDetails[trade.card_id].image}
                                                        alt={tradeCardDetails[trade.card_id].name}
                                                        className="trade-card-image"
                                                    />
                                                    <p>{tradeCardDetails[trade.card_id].name}</p>
                                                </>
                                            ) : (
                                                <p>Loading card details...</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="trade-actions">
                                        <button onClick={() => respondToTrade(trade.id, 'accept')}>
                                            Accept
                                        </button>
                                        <button onClick={() => respondToTrade(trade.id, 'decline')}>
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>No received trade requests</p>
                        )}
                    </div>

                    {/* Sent Requests */}
                    <div className="sent-requests">
                        <h4>Sent</h4>
                        {pendingTrades.sent.length > 0 ? (
                            pendingTrades.sent.map(trade => (
                                <div key={trade.id} className="trade-request">
                                    <div className="trade-info">
                                        <p>You offered to <strong>{trade.recipient}</strong>:</p>
                                        <div className="card-preview">
                                            {tradeCardDetails[trade.card_id] ? (
                                                <>
                                                    <img
                                                        src={tradeCardDetails[trade.card_id].image}
                                                        alt={tradeCardDetails[trade.card_id].name}
                                                        className="trade-card-image"
                                                    />
                                                    <p>{tradeCardDetails[trade.card_id].name}</p>
                                                </>
                                            ) : (
                                                <p>Loading card details...</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>No sent trade requests</p>
                        )}
                    </div>
                </div>
                {/* Right Panel - Trading Area */}
                <div className="right-panel">
                    {!tradeFlow && (
                        <button
                            className="trade-btn"
                            onClick={() => setTradeFlow('select-friend')}
                        >
                            Start New Trade
                        </button>
                    )}

                    {/* Friend Selection */}
                    {tradeFlow === 'select-friend' && (
                        <div className="trade-flow-container">
                            <h3>Select a Friend to Trade With</h3>
                            <div className="friends-select-list">
                                {friends.length > 0 ? (
                                    friends.map(friend => (
                                        <div
                                            key={friend.id}
                                            className={`friend-select-item ${selectedFriend?.id === friend.id ? 'selected' : ''}`}
                                            onClick={() => {
                                                setSelectedFriend(friend);
                                                setTradeFlow('select-card');
                                            }}
                                        >
                                            {friend.username}
                                        </div>
                                    ))
                                ) : (
                                    <p className="empty-state">No friends available to trade with</p>
                                )}
                            </div>
                            <div className="trade-flow-buttons">
                                <button onClick={() => setTradeFlow(null)}>Cancel</button>
                            </div>
                        </div>
                    )}

                    {/* Card Selection */}
                    {tradeFlow === 'select-card' && (
                        <div className="trade-flow-container">
                            <div className="trade-header">
                                <button
                                    className="back-button"
                                    onClick={() => setTradeFlow('select-friend')}
                                >
                                    ← Back
                                </button>
                                <h3>Select Card to Trade</h3>
                            </div>

                            <div className="cards-grid">
                                {userCards.map(card => (
                                    <div
                                        key={card.id}
                                        className={`card-item ${selectedCardId === card.id ? 'selected' : ''}`}
                                        onClick={() => {
                                            console.log("Selecting card:", card.id);
                                            setSelectedCardId(card.id);
                                        }}
                                    >
                                        <p className="card-name">
                                            {card.name}
                                            {selectedCardId === card.id && (
                                                <span className="selected-badge">✓</span>
                                            )}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="trade-flow-buttons">
                                <button
                                    onClick={initiateTrade}
                                    disabled={!selectedCardId}
                                >
                                    Send Trade Request
                                </button>
                            </div>

                            {tradeError && <p className="error-message">{tradeError}</p>}
                        </div>
                    )}
                </div>

                {/* Add Friend Modal */}
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <h3>Add Friend by ID</h3>
                            <input
                                type="text"
                                value={friendIdInput}
                                onChange={(e) => setFriendIdInput(e.target.value)}
                                placeholder="Enter Friend ID"
                            />
                            <div className="modal-buttons">
                                <button onClick={() => {
                                    setShowModal(false);
                                    setAddFriendMessage('');
                                }}>
                                    Cancel
                                </button>
                                <button onClick={sendFriendRequest}>
                                    Send Request
                                </button>
                            </div>
                            {addFriendMessage && (
                                <p className={
                                    addFriendMessage.includes('Invite sent') ?
                                        'success-message' :
                                        'error-message'
                                }>
                                    {addFriendMessage}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {showResponseModal && currentTrade && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Select Your Pokémon to Trade</h3>
                        <p>You're accepting {currentTrade.sender}'s offer</p>

                        <div className="cards-grid">
                            {userCards.map(card => (
                                <div
                                    key={card.id}
                                    className={`card-item ${selectedResponseCard === card.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedResponseCard(card.id)}
                                >
                                    <img src={card.image} alt={card.name} className="card-image" />
                                    <p className="card-name">
                                        {card.name}
                                        {selectedResponseCard === card.id && <span> ✓</span>}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="modal-actions">
                            <button
                                onClick={() => {
                                    setShowResponseModal(false);
                                    setSelectedResponseCard(null);
                                }}
                                className="cancel-btn"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => respondToTrade(currentTrade.id, 'accept')}
                                disabled={!selectedResponseCard}
                                className="submit-btn"
                            >
                                Submit Trade
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>


    );
};


export default TradingPage;