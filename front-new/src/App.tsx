import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AppBar, Button, Container, Toolbar, Typography } from '@mui/material';
import LoginPage from './components/pages/LoginPage';
import PartsPage from './components/pages/PartsPage';
import ResponsiveAppBar from './components/navbar/navbar';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogout = () => {
    // Clear token from localStorage
    localStorage.removeItem('token');
    // Update auth state
    setIsLoggedIn(false);
    // Redirect to login page
    window.location.href = '/login';
  };

  const handleOrderSubmit = (orderData: { partNumber: string }[]) => {
    // Implement logic to submit orders here
    console.log('Submitting orders with part numbers:', orderData);
  };

  return (
    <Router>
      <ResponsiveAppBar/>
      <Container maxWidth="sm" sx={{ marginTop: '2rem' }}>
        <Routes>
          <Route
            path="/login"
            element={<LoginPage setIsLoggedIn={setIsLoggedIn} />}
          />
          <Route
            path="/parts"
            element={<PartsPage onOrderSubmit={handleOrderSubmit} />}
          />
        </Routes>
      </Container>
    </Router>
  );
};

export default App;
