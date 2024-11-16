import React from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/SignUp.css";

function SignUp() {
  return (
    <div className="signup-page d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 text-center">
        <h1 className="title mb-4">Fashion Moodboard AI</h1>

        {/* Sign Up with Facebook Button */}
        <button className="signup-btn btn btn-block w-100 mb-3">
          <i class="fa-brands fa-pinterest"></i>
          <span>Sign Up with Pinterest</span>
        </button>

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
