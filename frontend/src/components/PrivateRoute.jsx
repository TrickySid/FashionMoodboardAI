import React from "react";
import { Navigate } from "react-router-dom";

function PrivateRoute({ children, isLoggedIn }) {
  // If not logged in, redirect to /login page
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  return children;
}

export default PrivateRoute;
