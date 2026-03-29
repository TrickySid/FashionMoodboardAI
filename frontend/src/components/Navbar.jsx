import { Link, NavLink, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Navbar.css";
import { useEffect, useState } from "react";
// Reverted to default avatar image; no SVG avatar in navbar
// import AvatarSVG from "./AvatarSVG";
import { auth, } from "../firebase";
import { onAuthStateChanged, signOut, onIdTokenChanged } from "firebase/auth";

function Navbar({ isLoggedIn, onLogout }) {
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  // Sync with Firebase auth state
  useEffect(() => {
    const unsub1 = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    // Ensure avatar updates when token changes (e.g., after profile updates)
    const unsub2 = onIdTokenChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  // Local derived login state (fallback if no observer yet)
  const isUserLoggedIn = !!currentUser;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Let the onAuthStateChanged listener propagate login state change
      if (typeof onLogout === "function") {
        onLogout();
      }
      navigate("/login");
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  return (
    <nav className="navbar navbar-expand-lg">
      <div className="container-fluid d-flex justify-content-between align-items-center px-4">
        {/* Left: Brand */}
        <Link className="navbar-brand" to="/">
          FASHION MOODBOARD <span className="ai-text">AI</span>
        </Link>

        {/* Right: Nav links and buttons */}
        <div className="d-flex align-items-center">
          {isUserLoggedIn && (
            <>
              <NavLink className="nav-link" to="/upload">
                Upload
              </NavLink>
              <NavLink className="nav-link" to="/recommendations">
                AI Recommendations
              </NavLink>
            </>
          )}
          {!isUserLoggedIn ? (
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
                <img src={currentUser?.photoURL || "/assets/default-avatar.jpg"} alt="Avatar" style={{ width: 28, height: 28, borderRadius: '50%' }} />
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
                  <button
                    className="dropdown-item d-flex align-items-center menu-item text-danger"
                    onClick={async (e) => {
                      e.preventDefault();
                      await handleLogout();
                    }}
                  >
                    <i className="fa-solid fa-right-from-bracket" />
                    <span>Sign Out</span>
                  </button>
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
