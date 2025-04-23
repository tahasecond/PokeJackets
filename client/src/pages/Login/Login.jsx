import React, { useState } from 'react';
import "./Login.css";
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from "./api.js";

const Login = ({ setIsLoggedIn }) => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: "",
        password: "",
    })
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name] : e.target.value});
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await loginUser({
                username: formData.username,
                password: formData.password
            });

            if (response.success) {
              localStorage.setItem("token", response.token);
              setIsLoggedIn(true);
              navigate("/");
            } else {
              setError(response.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
        <div className = "login-header">
          <h1>Welcome to PokeJackets!</h1>
          Don't have an account? <Link to="/register">Register</Link>
        </div>

        <div className="login-container">
          <form className="login-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            {error && <div className="error">{error}</div>}

            <button type="submit" disabled={loading}>
              {loading ? "Logging In..." : "Login"}
            </button>
          </form>
        </div>
        </>
      );
}

export default Login;