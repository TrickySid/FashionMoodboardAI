import { Link, NavLink } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Navbar.css";

function Navbar({ isLoggedIn, onLogout }) {
  return (
    <nav className="navbar navbar-expand-lg">
      <div className="container-fluid d-flex justify-content-between align-items-center px-4">
        {/* Left: Brand */}
        <Link className="navbar-brand" to="/">
          FASHION MOODBOARD <span className="ai-text">AI</span>
        </Link>

        {/* Right: Nav links and buttons */}
        <div className="d-flex align-items-center">
          {isLoggedIn && (
            <>
              <NavLink className="nav-link" to="/upload">
                Upload
              </NavLink>
              <NavLink className="nav-link" to="/recommendations">
                AI Recommendations
              </NavLink>
            </>
          )}
          {!isLoggedIn ? (
            <>
              <Link to="/login" className="login-btn btn btn-outline-primary ms-2">
                Login
              </Link>
              <Link to="/signup" className="signup-btn btn btn-primary ms-2">
                Sign Up
              </Link>
            </>
          ) : (
            <div className="dropdown ms-2">
              <button
                className="avatar-btn dropdown-toggle"
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
                  <Link className="dropdown-item d-flex align-items-center menu-item" to="/account-settings">
                    <i className="fa-solid fa-gear" />
                    <span>Account Settings</span>
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <Link 
                    className="dropdown-item d-flex align-items-center menu-item text-danger" 
                    to="/login"
                    onClick={onLogout}
                  >
                    <i className="fa-solid fa-right-from-bracket" />
                    <span>Sign Out</span>
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;