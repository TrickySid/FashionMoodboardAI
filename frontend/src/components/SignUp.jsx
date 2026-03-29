import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useToast } from "./ToastProvider";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/SignUp.css";

function SignUp() {
  const { addToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      addToast("Passwords do not match!", "error");
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      addToast("Sign up successful!", "success");
      navigate("/login");
    } catch (error) {
      addToast("Sign up failed: " + error.message, "error");
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        <Link to="/" className="back-to-home">
          ← Back to Explore
        </Link>
        <h1 className="title">Fashion Moodboard AI</h1>
        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              className="form-control"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              className="form-control"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              className="form-control"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="signup-btn">
            Sign Up
          </button>
        </form>
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
