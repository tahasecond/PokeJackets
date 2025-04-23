// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
const API_BASE_URL = "http://localhost:8000";

export const loginUser = async (credentials) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
        });

        const data = await response.json();

        if (response.status === 200 ) {
            return {
                success: true,
                message: data.message,
                token: data.token
            };
        }

        console.error("Django error:" + data.error);
        return {
            success: false,
            message: data.message || "Login failed",
            error: data.error
        };  
    } catch (error) {
        console.error("Login error:", error);
        return {
            success: false,
            message: "Network or server error occurred",
            error: error.message
        };
    }
};