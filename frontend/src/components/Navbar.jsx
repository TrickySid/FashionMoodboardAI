import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Navbar.css";

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container">
        {/* Application Name */}
        <a className="navbar-brand" href="/">
          Fashion Moodboard AI
        </a>

        {/* Toggle button for mobile view */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Collapsible Navbar Links and Buttons */}
        <div
          className="collapse navbar-collapse justify-content-end"
          id="navbarNav"
        >
          <ul className="navbar-nav">
            <li className="nav-item upload">
              <a className="nav-link" href="/upload">
                Upload
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/recommendations">
                AI Recommendations
              </a>
            </li>
          </ul>

          {/* Login and Sign Up Buttons */}
          <div className="d-flex">
            <a href="/login" className="login-btn btn btn-outline-primary me-2">
              Login
            </a>
            <a href="/signup" className="signup-btn btn btn-primary">
              Sign Up
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
