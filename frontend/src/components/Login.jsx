import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Login.css";

function Login() {
  return (
    <div className="login-page d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 text-center">
        <h1 className="title mb-4">Fashion Moodboard AI</h1>

        {/* Login with Facebook Button */}
        <button className="login-btn btn btn-dark btn-block w-100 mb-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="currentColor"
            class="bi bi-facebook"
            viewBox="0 0 16 16"
          >
            <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951" />
          </svg>
          <span>Login with Facebook</span>
        </button>

        {/* Separator */}
        <div className="d-flex align-items-center my-3">
          <hr className="flex-grow-1" />
          <span className="mx-2" style={{ color: "#888" }}>
            No Account? Create one
          </span>
          <hr className="flex-grow-1" />
        </div>

        {/* Continue as Guest Button */}
        <button
          className="btn btn-outline-dark w-100"
          style={{ fontWeight: "bold" }}
        >
          Sign Up
        </button>

        {/* Separator */}
        <div className="d-flex align-items-center my-3">
          <hr className="flex-grow-1" />
          <span className="mx-2" style={{ color: "#888" }}>
            OR
          </span>
          <hr className="flex-grow-1" />
        </div>

        {/* Continue as Guest Button */}
        <button
          className="btn btn-outline-dark w-100"
          style={{ fontWeight: "bold" }}
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
}

export default Login;
