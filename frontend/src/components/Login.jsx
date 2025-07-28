import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Login.css";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem("authToken", await userCredential.user.getIdToken());
      localStorage.setItem("userEmail", userCredential.user.email);
      alert("Login successful!");
      window.dispatchEvent(new Event("storage"));
      navigate("/upload");
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  };

  return (
    <div className="login-page d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 text-center">
        <h1 className="title mb-4">Login</h1>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group mb-3">
            <input
              type="email"
              className="form-control"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-btn btn w-100 mb-3">
            Login
          </button>
        </form>
        <div className="separator d-flex align-items-center my-3">
          <hr className="flex-grow-1" />
          <span className="mx-2">No Account? Create one</span>
          <hr className="flex-grow-1" />
        </div>
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