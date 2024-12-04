import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Login.css";
import { Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google"; // Import GoogleLogin from react-oauth

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googlePhotos, setGooglePhotos] = useState([]); // State to store Google photos
  const navigate = useNavigate();

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
        navigate("/"); // Redirect to dashboard or home page
      } else {
        alert("Login failed, Please check your email or password!");
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("Login failed, Please check your email or password!");
    }
  };

  /// Handle Google login success
  const handleGoogleLogin = async (response) => {
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

    // Fetch Google Photos once the user is logged in
    await fetchGooglePhotos(credential);

    // Redirect to the /upload page after successful login
    navigate("/upload");
  };

  // Decode JWT token to extract user information
  const decodeJWT = (token) => {
    // Decode the token to extract user information
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const decodedData = JSON.parse(window.atob(base64));
    return decodedData;
  };

  // Fetch Google Photos after login
  const fetchGooglePhotos = async (token) => {
    const apiUrl = "https://photoslibrary.googleapis.com/v1/albums"; // Google Photos API endpoint
    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      setGooglePhotos(data.albums); // Set photos into the state
    } else {
      console.error("Failed to fetch photos:", res);
    }
  };

  // Handle Google login error
  const handleGoogleLoginError = (error) => {
    console.log("Login Failed", error);
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
          <button type="submit" className="btn btn-primary w-100 mb-3">
            Login
          </button>
        </form>

        <div className="separator d-flex align-items-center my-3">
          <hr className="flex-grow-1" />
          <span className="mx-2">or</span>
          <hr className="flex-grow-1" />
        </div>

        {/* Google Login Button */}
        <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={handleGoogleLoginError}
          useOneTap
          scope="https://www.googleapis.com/auth/photoslibrary.readonly"
        >
          <button className="login-btn btn btn-block w-100 mb-3">
            <i className="fa-brands fa-google"></i>
            <span>Login with Google</span>
          </button>
        </GoogleLogin>

        {/* Login with Pinterest Button */}
        <button className="login-btn btn btn-block w-100 mt-3 mb-3">
          <i className="fa-brands fa-pinterest"></i>
          <span>Login with Pinterest</span>
        </button>

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

        {/* Display Google Photos after login */}
        {googlePhotos.length > 0 && (
          <div className="google-photos mt-3">
            <h3>Your Google Photos</h3>
            <div className="photo-gallery">
              {googlePhotos.map((album, index) => (
                <div key={index} className="photo-album">
                  <h5>{album.title}</h5>
                  <ul>
                    {/* Display photo thumbnails from the album */}
                    {album.mediaItems &&
                      album.mediaItems.slice(0, 5).map((item) => (
                        <li key={item.id}>
                          <img
                            src={item.baseUrl + "=w200-h200-c-k"} // Add size parameters
                            alt={item.filename}
                          />
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
