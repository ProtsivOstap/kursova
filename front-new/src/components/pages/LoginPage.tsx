import React, { useState } from 'react';
import { Button, TextField, Typography } from '@mui/material';
import { jwtDecode } from 'jwt-decode';

interface LoginPageProps {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

const LoginPage: React.FC<LoginPageProps> = ({ setIsLoggedIn }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const handleLogin = async () => {
    try {
      const response = await fetch(
        'https://568f-109-207-116-159.ngrok-free.app/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: username, password }),
        }
      );

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      // Extract JWT token from response
      const token = await response.text(); // Parse token as text

      // Store token in localStorage
      localStorage.setItem('token', token);

      // Decode JWT token to extract user information
      const decodedToken: any = jwtDecode(token);

      // Extract user role from decoded token
      const userRole = decodedToken.role;

      // Update auth state
      setIsLoggedIn(true);

      // Redirect user based on role
      if (userRole === 'admin') {
        // Redirect admin user to admin dashboard
        window.location.href = '/admin-dashboard';
      } else {
        // Redirect regular user to parts
        console.log(userRole, 'role');
        window.location.href = '/parts';
      }
    } catch (error: any) {
      console.error('Login failed:', error.message);
      setError('Login failed. Please try again.');
    }
  };

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Login
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <TextField
        label="Username"
        variant="outlined"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        type="password"
        label="Password"
        variant="outlined"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button
        onClick={handleLogin}
        variant="contained"
        color="primary"
        fullWidth
      >
        Login
      </Button>
    </div>
  );
};

export default LoginPage;
