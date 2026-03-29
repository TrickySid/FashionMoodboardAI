import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { auth, db, storage } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/AccountSettings.css";
import { useToast } from "./ToastProvider";

function AccountSettings() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(null);

  // Route guard: redirect to login if not authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
      } else {
        setIsLoggedIn(true);
        setEmail(user.email || "");
        setName(user.displayName || "");
        setCurrentPhotoUrl(user.photoURL || null);
      }
    });
    // Note: onAuthStateChanged is imported from firebase/auth, ensure it's available
    return unsubscribe;
  }, [navigate]);
  

  const { addToast } = useToast();
  
  const deleteOldPhoto = async (photoUrl) => {
    if (!photoUrl) return;
    try {
      // Only delete if it's a Firebase Storage URL (not the default avatar)
      if (photoUrl.includes('firebasestorage')) {
        const oldRef = storageRef(storage, photoUrl);
        await deleteObject(oldRef);
      }
    } catch (err) {
      console.error("Failed to delete old photo:", err);
    }
  };

  const uploadProfilePhoto = async (file) => {
    if (!auth.currentUser) return;
    try {
      // Capture the old URL before uploading
      const oldUrl = auth.currentUser.photoURL;
      
      const storagePath = storageRef(storage, `user-uploads/${auth.currentUser.uid}/profile-${Date.now()}`);
      const snapshot = await uploadBytes(storagePath, file);
      const url = await getDownloadURL(snapshot.ref);
      
      await updateProfile(auth.currentUser, { photoURL: url });
      
      // Delete old photo after successful upload to avoid data loss on failure
      if (oldUrl && oldUrl.includes('firebasestorage')) {
        await deleteOldPhoto(oldUrl);
      }
      
      setCurrentPhotoUrl(url);
      addToast("Profile photo updated", "success");
    } catch (err) {
      addToast("Failed to update photo: " + err.message, "error");
    }
  };

  const handleRemovePhoto = async () => {
    if (!auth.currentUser) return;
    
    // Check if there is even a photo to remove
    const photoUrl = auth.currentUser.photoURL;
    if (!photoUrl || photoUrl === "/assets/default-avatar.jpg") {
      addToast("Already using default avatar", "info");
      return;
    }

    try {
      // 1. Delete from Storage if it's a dynamic upload
      if (photoUrl.includes('firebasestorage')) {
        await deleteOldPhoto(photoUrl);
      }

      // 2. Clear from Firebase Auth
      await updateProfile(auth.currentUser, { photoURL: "/assets/default-avatar.jpg" });
      
      // 3. Update local state
      setCurrentPhotoUrl("/assets/default-avatar.jpg");
      addToast("Profile photo removed", "success");
    } catch (err) {
      addToast("Failed to remove photo: " + err.message, "error");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    try {
      // Update display name in Firebase Auth if provided
      const trimmedName = name?.trim();
      if (trimmedName) {
        await updateProfile(auth.currentUser, { displayName: trimmedName });
      }
      // Persist to Firestore if available
      if (auth.currentUser?.uid) {
        await setDoc(doc(db, "users", auth.currentUser.uid), {
          name: trimmedName ?? name,
          email: auth.currentUser.email,
        }, { merge: true });
      }
      // Password change flow
      if (newPassword && newPassword.trim().length > 0) {
        if (newPassword !== (confirmNewPassword || "")) {
          addToast("New passwords do not match", "error");
          return;
        }
        if (!currentPassword) {
          addToast("Please enter your current password to change password", "error");
          return;
        }
        try {
          const user = auth.currentUser;
          const credential = EmailAuthProvider.credential(user.email, currentPassword);
          await reauthenticateWithCredential(user, credential);
          await updatePassword(user, newPassword);
          addToast("Password updated successfully", "success");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmNewPassword("");
        } catch (err) {
          addToast("Password update failed: " + err.message, "error");
        }
    } else {
      addToast("Account settings updated successfully!", "success");
    }
    } catch (error) {
      addToast("Account settings update failed: " + error.message, "error");
    }
  };

  return (
    <>
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <div className="account-settings-page">
        <div className="settings-card">
          <form onSubmit={handleSaveChanges}>
            <h4 className="title">Account Settings</h4>
            
            {/* Display Picture */}
            <div className="mb-4">
              <label className="form-label">Display Picture</label>
              <div className="profile-pic-container">
                <img src={currentPhotoUrl || "/assets/default-avatar.jpg"} alt="Profile" />
                <div className="profile-actions">
                  <label className="upload-btn-outline">
                    Change Photo
                    <input
                      type="file"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          await uploadProfilePhoto(file);
                        }
                      }}
                      accept="image/*"
                      style={{ display: "none" }}
                    />
                  </label>
                  <button type="button" className="remove-photo-btn" onClick={handleRemovePhoto}>
                    Remove Photo
                  </button>
                </div>
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
                disabled
                placeholder="Enter your email"
              />
            </div>

            {/* Password Change */}
            <div className="change-password-section">
              <h6>Change Password</h6>
              <div className="mb-3">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
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

