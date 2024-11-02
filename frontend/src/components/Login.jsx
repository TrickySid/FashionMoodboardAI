import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Login.css";

function Login() {
  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{ backgroundColor: "#f3e8ff" }}
    >
      <div
        className="card p-4 text-center"
        style={{ width: "400px", borderRadius: "15px" }}
      >
        <h1 className="mb-4" style={{ fontWeight: "bold" }}>
          Fashion Moodboard AI
        </h1>

        {/* Login with Facebook Button */}
        <button
          className="btn btn-dark btn-block w-100 mb-3"
          style={{
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <i className="bi bi-facebook me-2"></i> Login with Facebook
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
