import React from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Login.css";

function Login({ onLogin }) {
  return (
    <div className="login-page d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 text-center">
        <h1 className="title mb-4">Fashion Moodboard AI</h1>

        {/* Login with Facebook Button */}
        <Link to="/upload">
          <button
            className="login-btn btn btn-block w-100 mb-3"
            onClick={onLogin}
          >
            <i className="bi bi-facebook" />
            <span>Login with Facebook</span>
          </button>
        </Link>

        {/* Separator */}
        <div className="separator d-flex align-items-center my-3">
          <hr className="flex-grow-1" />
          <span className="mx-2">No Account? Create one</span>
          <hr className="flex-grow-1" />
        </div>

        {/* Sign Up Button */}
        <Link to="/signup">
          <button className="signup-btn btn btn-outline-dark w-100 mb-2">
            Sign Up
          </button>
        </Link>
      </div>
    </div>
  );
}

export default Login;
