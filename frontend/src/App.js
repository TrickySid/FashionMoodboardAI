import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Home from "./components/Home";
import UploadPhoto from "./components/UploadPhoto";
import Recommendations from "./components/Recommendations";
import AccountSettings from "./components/AccountSettings";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import PrivacyPolicy from "./components/PrivacyPolicy";
import Navbar from "./components/Navbar";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);  // Add loading state

  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem("authToken");
      console.log("Current token:", token);
      if (!token) {
        console.log("No token found");
        setIsAuthenticated(false);
      } else {
        console.log("Token found");
        setIsAuthenticated(true);
      }
      setLoading(false);  // Set loading to false after we check auth
    };

    // Initial check
    handleStorageChange();

    // Add event listener for storage changes
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    console.log("isAuthenticated updated:", isAuthenticated);
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setIsAuthenticated(false);
  };

  const ProtectedRoute = ({ children }) => {
    console.log("Protected Route Check - isAuthenticated:", isAuthenticated);
    
    if (loading) {
      return <div>Loading...</div>;  // Show loading state while checking auth
    }
    
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  if (loading) {
    return <div>Loading...</div>;  // Show loading state while checking auth
  }

  return (
    <Router>
      {isAuthenticated && <Navbar isLoggedIn={isAuthenticated} onLogout={handleLogout} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadPhoto />
            </ProtectedRoute>
          }
        />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/account-settings" element={<AccountSettings />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
      </Routes>
    </Router>
  );
}
export default App;