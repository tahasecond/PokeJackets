export const validatePassword = (password) => {
    const requirements = {
        minLength: password.length >= 8,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const messages = [];
    if (!requirements.minLength) messages.push("Password must be at least 8 characters long");
    if (!requirements.hasUpperCase) messages.push("Password must contain at least one uppercase letter");
    if (!requirements.hasLowerCase) messages.push("Password must contain at least one lowercase letter");
    if (!requirements.hasNumber) messages.push("Password must contain at least one number");
    if (!requirements.hasSpecialChar) messages.push("Password must contain at least one special character");

    return {
        isValid: Object.values(requirements).every(Boolean),
        messages
    };
};

// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
const API_BASE_URL = "http://localhost:8000";

export const registerUser = async (userData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/register/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });

        const data = await response.json();
        
        return {
            success: data.success,
            message: data.message,
        };

    } catch (error) {
        console.error("Registration error:", error);
        return {
            success: false,
            message: "Network or server error occurred"
        };
    }
};