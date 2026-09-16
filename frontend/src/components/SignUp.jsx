import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebaseAuth";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useToast } from "./ToastProvider";
import { useAuth } from "../auth/AuthContext";
import { getAuthErrorMessage } from "../utils/errors";
import "../styles/SignUp.css";

function SignUp() {
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user) navigate("/upload", { replace: true });
  }, [navigate, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      addToast("Passwords do not match!", "error");
      return;
    }
    if (password.length < 6) {
      addToast("Use a password with at least 6 characters.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      addToast("Sign up successful!", "success");
      navigate("/upload", { replace: true });
    } catch (error) {
      addToast(getAuthErrorMessage(error, "Sign up failed. Please try again."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <main className="auth-loading" aria-live="polite">Checking your session...</main>;
  }

  return (
    <div className="signup-page">
      <div className="signup-card">
        <Link to="/" className="back-to-home">
          ← Back to Explore
        </Link>
        <h1 className="title">Fashion Moodboard AI</h1>
        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="visually-hidden" htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
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
            <label className="visually-hidden" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              className="form-control"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label className="visually-hidden" htmlFor="signup-confirm-password">Confirm password</label>
            <input
              id="signup-confirm-password"
              type="password"
              className="form-control"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength="6"
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="signup-btn" disabled={submitting}>
            {submitting ? "Creating account..." : "Sign Up"}
          </button>
        </form>
        <p className="legal-consent">
          By creating an account, you agree to the{" "}
          <Link to="/terms">Terms</Link> and acknowledge the{" "}
          <Link to="/privacy">Privacy Policy</Link>.
        </p>
        <div className="separator d-flex align-items-center">
          <hr className="flex-grow-1" />
          <span className="mx-2">Already have an account?</span>
          <hr className="flex-grow-1" />
        </div>
        <Link to="/login" className="login-link-btn">
          Login
        </Link>
      </div>
    </div>
  );
}

export default SignUp;
