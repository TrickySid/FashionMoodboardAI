import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/SignUp.css";

function SignUp() {
  return (
    <div className="signup-page d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 text-center">
        <h1 className="title mb-4">Fashion Moodboard AI</h1>

        {/* Sign Up with Facebook Button */}
        <button className="signup-btn btn btn-block w-100 mb-3">
          <i class="bi bi-facebook" />
          <span>Sign Up with Facebook</span>
        </button>

        {/* Separator */}
        <div className="separator d-flex align-items-center my-3">
          <hr className="flex-grow-1" />
          <span className="mx-2">Already have an account?</span>
          <hr className="flex-grow-1" />
        </div>

        {/* Login Button */}
        <a href="/login">
          <button className="login-btn btn btn-outline-dark w-100">
            Login
          </button>
        </a>

        {/* Separator */}
        <div className="separator d-flex align-items-center my-3">
          <hr className="flex-grow-1" />
          <span className="mx-2">or</span>
          <hr className="flex-grow-1" />
        </div>

        {/* Continue as Guest Button */}
        <a href="/upload">
          <button className="guest-btn btn">Continue as Guest</button>
        </a>
      </div>
    </div>
  );
}

export default SignUp;
