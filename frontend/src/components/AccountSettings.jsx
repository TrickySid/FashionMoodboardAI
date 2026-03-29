import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/AccountSettings.css";

function AccountSettings() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // Route guard: redirect to login if not authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
      } else {
        setIsLoggedIn(true);
      }
    });
    // Note: onAuthStateChanged is imported from firebase/auth, ensure it's available
    return unsubscribe;
  }, [navigate]);
  

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  //   const [currentPassword, setCurrentPassword] = useState("");
  //   const [newPassword, setNewPassword] = useState("");
  const [profilePic, setProfilePic] = useState(null);

  const handleSaveChanges = (e) => {
    e.preventDefault();
    // Logic to save changes (e.g., API call) goes here
    // console.log("Changes saved:", { name, email, newPassword, profilePic });
    alert("Account settings updated successfully!");
  };

  return (
    <>
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <div className="account-settings-page">
        <div className="settings-card">
          <form onSubmit={handleSaveChanges}>
            <h4 className="title">Account Settings</h4>
            
            {/* Profile Picture */}
            <div className="mb-4">
              <label className="form-label">Profile Picture</label>
              <div className="profile-pic-container">
                <img
                  src={
                    profilePic
                      ? URL.createObjectURL(profilePic)
                      : "/assets/default-avatar.jpg"
                  }
                  alt="Profile"
                  onError={(e) => {
                     e.target.src = "https://ui-avatars.com/api/?name=User&background=222&color=dcff00"; // fallback if missing
                  }}
                />
                <label className="upload-btn-outline">
                  Change Photo
                  <input
                    type="file"
                    onChange={(e) => setProfilePic(e.target.files[0])}
                    accept="image/*"
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="form-label">Name</label>
              <input
                type="text"
                className="form-control"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            {/* Save Changes Button */}
            <button
              type="submit"
              className="save-changes-btn"
            >
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default AccountSettings;

