export const getToken = () => localStorage.getItem("token");

export const logoutUser = () => {
    localStorage.removeItem("token");
};