import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { auth } from "../firebaseAuth";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useToast } from "./ToastProvider";
import { useAuth } from "../auth/AuthContext";
import { getAuthErrorMessage } from "../utils/errors";
import "../styles/Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const destination = location.state?.from || "/upload";

  const { addToast } = useToast();

  useEffect(() => {
    if (user) navigate(destination, { replace: true });
  }, [destination, navigate, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate(destination, { replace: true });
    } catch (error) {
      addToast(getAuthErrorMessage(error, "Login failed. Please try again."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <main className="auth-loading" aria-live="polite">Checking your session...</main>;
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <Link to="/" className="back-to-home">
          ← Back to Explore
        </Link>
        <h1 className="brand-title">Fashion Moodboard AI</h1>
        <h2 className="title">Login</h2>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="visually-hidden" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              className="form-control"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="visually-hidden" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-control"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="login-btn btn w-100" disabled={submitting}>
            {submitting ? "Signing in..." : "Login"}
          </button>
        </form>
        <div className="separator d-flex align-items-center">
          <hr className="flex-grow-1" />
          <span className="mx-2">No Account? Create one</span>
          <hr className="flex-grow-1" />
        </div>
        <Link to="/signup" className="signup-link-btn">
          Sign Up
        </Link>
      </div>
    </div>
  );
}

export default Login;
