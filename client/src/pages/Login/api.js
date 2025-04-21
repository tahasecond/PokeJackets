export const loginUser = async (credentials) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
        });

        const data = await response.json();
        
        if (data.success && data.token) {
            localStorage.setItem("token", data.token);
        }

        return {
            success: data.success,
            message: data.message,
            token: data.token
        };

    } catch (error) {
        console.error("Login error:", error);
        return {
            success: false,
            message: "Network or server error occurred"
        };
    }
};