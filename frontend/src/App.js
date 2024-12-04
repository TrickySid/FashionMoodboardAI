import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  Navigate,
} from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Home from "./components/Home";
import UploadPhoto from "./components/UploadPhoto";
import Recommendations from "./components/Recommendations";
import AccountSettings from "./components/AccountSettings";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import PrivacyPolicy from "./components/PrivacyPolicy";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute"; // Custom PrivateRoute for authenticated pages

function App() {
  const [user, setUser] = useState(null);

  // Retrieve user data from localStorage on app load (page refresh)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData); // Update state with user data
    localStorage.setItem("user", JSON.stringify(userData)); // Store user data in localStorage
  };

  const handleLogout = () => {
    setUser(null); // Clear user data
    localStorage.removeItem("user"); // Remove from localStorage
  };

  return (
    <GoogleOAuthProvider clientId="52814765259-iik4mbjput3qocfos4gbuiujsm352p8u.apps.googleusercontent.com">
      <Router>
        <LocationWrapper user={user} onLogout={handleLogout}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to="/upload" />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/signup"
              element={
                user ? (
                  <Navigate to="/upload" />
                ) : (
                  <SignUp onLogin={handleLogin} />
                )
              }
            />
            <Route path="/privacy" element={<PrivacyPolicy />} />

            {/* Protected Routes */}
            <Route
              path="/upload"
              element={
                <PrivateRoute isLoggedIn={user !== null}>
                  <UploadPhoto />
                </PrivateRoute>
              }
            />
            <Route
              path="/recommendations"
              element={
                <PrivateRoute isLoggedIn={user !== null}>
                  <Recommendations />
                </PrivateRoute>
              }
            />
            <Route
              path="/account-settings"
              element={
                <PrivateRoute isLoggedIn={user !== null}>
                  <AccountSettings />
                </PrivateRoute>
              }
            />
          </Routes>
        </LocationWrapper>
      </Router>
    </GoogleOAuthProvider>
  );
}

// LocationWrapper component to handle conditional Navbar rendering
const LocationWrapper = ({ user, onLogout, children }) => {
  const location = useLocation();
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";

  return (
    <>
      {!isAuthPage && (
        <Navbar isLoggedIn={user !== null} user={user} onLogout={onLogout} />
      )}
      {children}
    </>
  );
};

export default App;
