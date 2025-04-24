import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './tradingpage.css';
import Navbar from '../../components/Navbar';

const TradingPage = () => {
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

    const fetchAllData = async () => {
        const token = localStorage.getItem('token');
        try {
            const userRes = await fetch('http://localhost:8000/api/user/', {
                headers: { 'Authorization': `Token ${token}` }
            });

            if (userRes.ok) {
                const userData = await userRes.json();
                setFriendID(userData.id);
            }

            // Fetch all friend data in parallel
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
            console.error('Error fetching data', err);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

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
                fetchAllData(); // Refresh all data
            }
        } catch (error) {
            console.error('Error accepting request', error);
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
            }
        } catch (error) {
            console.error('Error declining request', error);
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
                body: JSON.stringify({ action: 'decline' }) // Same as decline for outgoing
            });

            if (response.ok) {
                setOutgoingRequests(outgoingRequests.filter(req => req.id !== requestId));
            }
        } catch (error) {
            console.error('Error canceling request', error);
        }
    };

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
                setAddFriendMessage(data.message || "Friend request sent!");
                setFriendIdInput('');
                setTimeout(() => {
                    setShowModal(false);
                    fetchAllData(); // Refresh data
                }, 2000);
            } else {
                setAddFriendMessage(data.error || "Failed to send request");
            }
        } catch (error) {
            setAddFriendMessage('Something went wrong. Try again.');
        }
    };

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

                {/* Right Panel - Trading Area */}
                <div className="right-panel">
                    <button className="trade-btn">Start New Trade</button>
                    {/* Future trading interface will go here */}
                    <div className="empty-state">
                        Select a friend to start trading
                    </div>
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
                                <p className={addFriendMessage.includes('error') ? 'error-message' : 'success-message'}>
                                    {addFriendMessage}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


export default TradingPage;