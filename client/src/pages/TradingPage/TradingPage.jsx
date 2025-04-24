import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './tradingpage.css';
import Navbar from '../../components/Navbar';

const TradingPage = () => {
    const [friendId, setFriendId] = useState('123456');
    const [friends, setFriends] = useState(['Alice', 'Bob']);
    const [friendRequests, setFriendRequests] = useState(['Charlie', 'Dana']);
    const [showModal, setShowModal] = useState(false);
    const [friendIdInput, setFriendIdInput] = useState('');
    const [addFriendMessage, setAddFriendMessage] = useState('');

    const handleAccept = (name) => {
        setFriends([...friends, name]);
        setFriendRequests(friendRequests.filter(req => req !== name));
    };

    const handleDecline = (name) => {
        setFriendRequests(friendRequests.filter(req => req !== name));
    };

    const sendFriendRequest = async () => {
        try {
            const token = localStorage.getItem('token'); // Assuming you store auth token here

            const response = await fetch('http://localhost:8000/api/send-friend-request/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({ friend_id: friendIdInput })
            });

            const data = await response.json();
            setAddFriendMessage(data.message);

            if (response.ok) {
                setFriendIdInput('');
                setTimeout(() => setShowModal(false), 2000); // Close after 2s
            }
        } catch (error) {
            setAddFriendMessage('Something went wrong. Try again.');
        }
    };

    return (
        <div className="trading-page-container">
            <Navbar />
            
            <div className="trading-content">
                {/* Left Side */}
                <div className="left-panel">
                    <div className="actions">
                        <button className="add-friend-btn" onClick={() => setShowModal(true)}>Add Friend</button>

                        {/* Friends List */}
                        <div className="friends-list">
                            <h3>Friends</h3>
                            <ul>
                                {friends.map((friend, index) => (
                                    <li key={index}>{friend}</li>
                                ))}
                            </ul>
                        </div>

                        {/* Friend Requests */}
                        <div className="friend-requests-list">
                            <h3>Friend Requests</h3>
                            <ul>
                                {friendRequests.map((request, index) => (
                                    <li key={index} className="request-item">
                                        <span>{request}</span>
                                        <button className="accept-btn" onClick={() => handleAccept(request)}>Accept</button>
                                        <button className="decline-btn" onClick={() => handleDecline(request)}>Decline</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="friend-id">Friend ID: {friendId}</div>
                </div>

                {/* Right Side */}
                <div className="right-panel">
                    <button className="trade-btn">Trade</button>
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
                                <button onClick={sendFriendRequest}>Send</button>
                                <button onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                            {addFriendMessage && <p>{addFriendMessage}</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TradingPage;
