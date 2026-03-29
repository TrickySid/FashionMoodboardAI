import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useToast } from "./ToastProvider";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const { addToast } = useToast();
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem("authToken", await userCredential.user.getIdToken());
      localStorage.setItem("userEmail", userCredential.user.email);
      window.dispatchEvent(new Event("storage"));
      navigate("/upload");
    } catch (error) {
      addToast("Login failed: " + error.message, "error");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="brand-title">Fashion Moodboard AI</h1>
        <h2 className="title">Login</h2>
        <form className="login-form" onSubmit={handleSubmit}>
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
          <button type="submit" className="login-btn btn w-100">
            Login
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
