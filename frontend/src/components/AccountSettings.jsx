import { useState } from "react";
import Navbar from "./Navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/AccountSettings.css";

function AccountSettings() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);

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
      <div style={{ paddingTop: "100px", backgroundColor: "#0d0d0d" }}>
        <div className="account-settings-page justify-content-center align-items-start vh-100">
          <div className="container">
            <form className="settings-form" onSubmit={handleSaveChanges}>
              <h4 className="title mb-3">Account Settings</h4>
              {/* Profile Picture */}
              <div className="mb-3">
                <label className="form-label">Profile Picture</label>
                <div className="d-flex align-items-center">
                  <img
                    src={
                      profilePic
                        ? URL.createObjectURL(profilePic)
                        : "/assets/default-avatar.jpg"
                    }
                    alt="Profile"
                    className="rounded-circle me-3"
                    width="60"
                    height="60"
                  />
                  <input
                    type="file"
                    className="form-control"
                    onChange={(e) => setProfilePic(e.target.files[0])}
                    accept="image/*"
                  />
                </div>
              </div>

              {/* Name */}
              <div className="mb-3">
                <label htmlFor="name" className="form-label">
                  Name
                </label>
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
              <div className="mb-4">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>

              {/* Current Password */}
              {/* <div className="mb-3">
                <label htmlFor="currentPassword" className="form-label">
                  Current Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                />
              </div> */}

              {/* New Password */}
              {/* <div className="mb-4">
                <label htmlFor="newPassword" className="form-label">
                  New Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter a new password"
                />
              </div> */}

              {/* Save Changes Button */}
              <button
                type="submit"
                className="save-changes-btn btn btn-primary w-100"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default AccountSettings;
