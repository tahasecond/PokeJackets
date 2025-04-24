import React, { createContext, useState, useEffect, useContext } from 'react';

// Create the context
const BalanceContext = createContext();

// Create a provider component
export const BalanceProvider = ({ children }) => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch initial balance
  useEffect(() => {
    fetchBalance();
  }, []);

  // Function to fetch balance from API
  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/api/user/balance/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance);
      }
      
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to update balance
  const updateBalance = (newBalance) => {
    setBalance(newBalance);
  };

  return (
    <BalanceContext.Provider value={{ balance, updateBalance, loading, fetchBalance }}>
      {children}
    </BalanceContext.Provider>
  );
};

// Custom hook to use the balance context
export const useBalance = () => {
  const context = useContext(BalanceContext);
  if (!context) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
}; 