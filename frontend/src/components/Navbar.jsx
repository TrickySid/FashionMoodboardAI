import React from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Navbar.css";

function Navbar({ isLoggedIn, onLogout }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-light">
      <div className="container">
        {/* Application Name */}
        <Link className="navbar-brand" to="/">
          Fashion Moodboard AI
        </Link>

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
            {isLoggedIn && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/upload">
                    Upload
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/recommendations">
                    AI Recommendations
                  </Link>
                </li>
              </>
            )}
          </ul>

          {/* Conditional Buttons for Login/Signup or Avatar Dropdown */}
          <div className="d-flex align-items-center">
            {!isLoggedIn ? (
              <>
                <Link
                  to="/login"
                  className="login-btn btn btn-outline-primary me-2"
                >
                  Login
                </Link>
                <Link to="/signup" className="signup-btn btn btn-primary">
                  Sign Up
                </Link>
              </>
            ) : (
              <div className="dropdown">
                <button
                  className="btn avatar-btn dropdown-toggle"
                  type="button"
                  id="dropdownMenuButton"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="user-avatar fa-regular fa-circle-user" />
                </button>
                <ul
                  className="dropdown-menu dropdown-menu-end"
                  aria-labelledby="dropdownMenuButton"
                >
                  <li>
                    <Link className="dropdown-item" to="/account-settings">
                      <i className="fa-solid fa-gear" />
                      <span>Account Settings</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="dropdown-item"
                      to="/login"
                      style={{ marginLeft: "-20px" }}
                    >
                      <button
                        onClick={onLogout}
                        className="logout-btn btn ms-2"
                      >
                        <i className="fa-solid fa-right-from-bracket" />
                        <span>Sign Out</span>
                      </button>
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
