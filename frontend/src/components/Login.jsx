import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Login.css";
import { Link } from "react-router-dom";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // This effect will capture the access token and refresh token from the URL when redirected from Pinterest
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      navigate("/upload"); // Redirect to /upload after successful login
    } else {
      console.log("Tokens are missing in the URL.");
    }
  }, [navigate]);

  // Handle regular form login
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "https://fashion-moods.wm.r.appspot.com/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("authToken", data.token); // Store token in local storage
        localStorage.setItem("userEmail", data.email); // Store email in local storage
        alert("Login successful!");
        window.dispatchEvent(new Event("storage")); // Trigger storage event manually
        navigate("/upload"); // Redirect to upload page
      } else {
        alert("Login failed, Please check your email or password!");
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("Login failed, Please check your email or password!");
    }
  };

  // Redirect user to Pinterest login
  const handlePinterestLogin = async () => {
    try {
      const response = await fetch(
        "https://fashion-moods.wm.r.appspot.com/pinterest/auth"
      );
      const { authUrl } = await response.json();
      window.location.href = authUrl; // Redirect to Pinterest OAuth
    } catch (error) {
      console.error("Error during Pinterest OAuth redirect:", error);
      alert("Failed to initiate Pinterest login.");
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

        {/* <div className="separator d-flex align-items-center my-3">
          <hr className="flex-grow-1" />
          <span className="mx-2">or</span>
          <hr className="flex-grow-1" />
        </div>

        {/* Login with Pinterest Button */}
        {/* <button className="login-btn btn btn-block w-100 mt-3 mb-3">
        <button
          onClick={handlePinterestLogin}
          className="login-btn btn btn-block w-100 mt-3 mb-3"
        >
          <i className="fa-brands fa-pinterest"></i>
          <span>Login with Pinterest</span>
        </button> */}

        <div className="separator d-flex align-items-center my-3">
          <hr className="flex-grow-1" />
          <span className="mx-2">No Account? Create one</span>
          <hr className="flex-grow-1" />
        </div>

        {/* Sign Up Button */}
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
