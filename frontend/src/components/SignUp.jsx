import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/SignUp.css";
import { GoogleLogin } from "@react-oauth/google";

function SignUp({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch(
        "https://fashion-moods.wm.r.appspot.com/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      if (response.ok) {
        alert("Sign up successful!");
        navigate("/login"); // Redirect to login page
      } else {
        alert("Sign up failed!");
      }
    } catch (error) {
      console.error("Error during sign up:", error);
      alert("Sign up failed!");
    }
  };

  /// Handle Google login success
  const handleGoogleSignUp = (response) => {
    console.log("Google login response:", response);

    // Extract the credential token from the response
    const credential = response.credential; // This is the JWT token

    // Optionally, you can decode the token to get the user's profile
    const decodedToken = decodeJWT(credential);
    console.log("Decoded Token:", decodedToken);

    // Create user data object
    const userData = {
      name: decodedToken.name,
      email: decodedToken.email,
      profileImage: decodedToken.picture,
    };

    // Pass the user data to the parent component
    onLogin(userData);

    // Redirect to the /upload page after successful login
    navigate("/");
  };

  // Decode JWT token to extract user information
  const decodeJWT = (token) => {
    // Decode the token to extract user information
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const decodedData = JSON.parse(window.atob(base64));
    return decodedData;
  };

  // Handle Google login error
  const handleGoogleSignUpError = (error) => {
    console.log("Login Failed", error);
  };

  return (
    <div className="signup-page d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 text-center">
        <h1 className="title mb-4">Fashion Moodboard AI</h1>

        {/* Sign Up Form */}
        <form className="signup-form" onSubmit={handleSubmit}>
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
          <div className="form-group mb-3">
            <input
              type="password"
              className="form-control"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100 mb-3">
            Sign Up
          </button>
        </form>

        {/* Separator */}
        <div className="separator d-flex align-items-center my-3">
          <hr className="flex-grow-1" />
          <span className="mx-2">or</span>
          <hr className="flex-grow-1" />
        </div>

        {/* Google Login Button */}
        <GoogleLogin
          onSuccess={handleGoogleSignUp}
          onError={handleGoogleSignUpError}
          useOneTap
        >
          <button className="signup-btn btn btn-block w-100 mb-3">
            <i className="fa-brands fa-google"></i>
            <span>Sign Up with Google</span>
          </button>
        </GoogleLogin>

        {/* Separator */}
        <div className="separator d-flex align-items-center my-3">
          <hr className="flex-grow-1" />
          <span className="mx-2">Already have an account?</span>
          <hr className="flex-grow-1" />
        </div>

        {/* Login Button */}
        <Link to="/login">
          <button className="login-btn btn btn-outline-dark w-100 mb-2">
            Login
          </button>
        </Link>
      </div>
    </div>
  );
}

export default SignUp;
