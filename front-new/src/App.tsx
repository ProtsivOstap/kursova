import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Container } from "@mui/material";
import ResponsiveAppBar from "./components/navbar/navbar";
import LoginPage from "./components/pages/LoginPage";
import PartsPage from "./components/pages/PartsPage";
import OrdersPage from "./components/pages/OrdersPage";
import OrderDetailsPage from "./components/pages/OrderDetailsPage";
import SuppliersPage from "./components/pages/suppliersPage";
import SupplierDetailsPage from "./components/pages/SupplierDetailsPage";

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogout = () => {
    // Clear token from localStorage
    localStorage.removeItem("token");
    // Update auth state
    setIsLoggedIn(false);
    // Redirect to login page
    window.location.href = "/login";
  };

  const handleOrderSubmit = (orderData: { partNumber: string }[]) => {
    // Implement logic to submit orders here
    console.log("Submitting orders with part numbers:", orderData);
  };

  return (
    <Router>
      <ResponsiveAppBar />
      <Container maxWidth="xl" sx={{ marginTop: "2rem" }}>
        <Routes>
          <Route
            path="/login"
            element={<LoginPage setIsLoggedIn={setIsLoggedIn} />}
          />
          <Route
            path="/parts"
            element={<PartsPage onOrderSubmit={handleOrderSubmit} />}
          />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailsPage />} />
          <Route path="/suppliers/:id" element={<SupplierDetailsPage />} />
        </Routes>
      </Container>
    </Router>
  );
};

export default App;
