import React, { useState } from 'react';
import "./Register.css";
import { useNavigate, Link } from 'react-router-dom';
import { validatePassword, registerUser } from "./api.js";

const Register = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    })
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name] : e.target.value});
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        const { isValid, messages } = validatePassword(formData.password);
        if (!isValid) {
            setError(messages.join("\n"));
            return;
        }

        setLoading(true);
        try {
            await registerUser({
                username: formData.username, 
                email: formData.email, 
                password: formData.password
            });
            navigate("/login");
        } catch (error) {
            setError("Registration failed. \nMessage: ", error.message, "\nError: ", error);
        } finally {
            setLoading(false);
        }
    }


    return (
        <>
        <div className = "register-header">
          <h1>Welcome to PokeJackets!</h1>
          Already have an account? <Link to="/login">Sign In</Link>
        </div>

        <div className="register-container">
          <form className="register-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
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
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            {error && <div className="error">{error}</div>}

            <button type="submit" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        </div>
        </>
      );
}

export default Register;