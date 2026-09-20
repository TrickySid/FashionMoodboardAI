import { Link, NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseAuth";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "./ToastProvider";
import "../styles/Navbar.css";

function Navbar() {
  const { user, loading } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      navigate("/", { replace: true });
      await signOut(auth);
    } catch {
      addToast("Sign out failed. Please try again.", "error");
    }
  };

  return (
    <nav className="navbar navbar-expand-lg" aria-label="Primary navigation">
      <div className="container-fluid d-flex justify-content-between align-items-center px-4">
        <Link className="navbar-brand" to="/">
          FASHION MOODBOARD <span className="ai-text">AI</span>
        </Link>

        <div className="navbar-actions d-flex align-items-center">
          {!loading && user && (
            <>
              <NavLink className="nav-link" to="/upload">Upload</NavLink>
              <NavLink className="nav-link" to="/recommendations">AI Recommendations</NavLink>
            </>
          )}
          {!loading && !user ? (
            <>
              <Link to="/login" className="login-btn btn btn-outline-primary ms-2">Login</Link>
              <Link to="/signup" className="signup-btn btn btn-primary ms-2">Sign Up</Link>
            </>
          ) : !loading ? (
            <div className="dropdown ms-2">
              <button
                className="avatar-btn dropdown-toggle"
                type="button"
                id="account-menu"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                aria-label="Open account menu"
              >
                <img
                  src={user.photoURL || "/assets/default-avatar.jpg"}
                  alt=""
                  width="28"
                  height="28"
                />
              </button>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="account-menu">
                <li>
                  <Link className="dropdown-item d-flex align-items-center menu-item" to="/account-settings">
                    <i className="fa-solid fa-gear" aria-hidden="true" />
                    <span>Account Settings</span>
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-flex align-items-center menu-item text-danger"
                    onClick={handleLogout}
                  >
                    <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
                    <span>Sign Out</span>
                  </button>
                </li>
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
