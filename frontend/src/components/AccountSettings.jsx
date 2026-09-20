import { useState } from "react";
import Navbar from "./Navbar";
import { auth } from "../firebaseAuth";
import { db, storage } from "../firebaseData";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import "../styles/AccountSettings.css";
import { useToast } from "./ToastProvider";
import { useAuth } from "../auth/AuthContext";
import { getAuthErrorMessage } from "../utils/errors";
import {
  ACCEPTED_IMAGE_TYPES,
  imageExtension,
  validateImageFile,
} from "../utils/imageFiles";
import { isManagedStorageUrl, safeImageUrl } from "../utils/urls";

function AccountSettings() {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();
  const [name, setName] = useState(user.displayName || "");
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(user.photoURL || null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  const deleteStoredPhoto = async (photoUrl) => {
    if (!isManagedStorageUrl(photoUrl)) return;

    try {
      await deleteObject(storageRef(storage, photoUrl));
    } catch (error) {
      console.warn("Old profile photo cleanup failed", { code: error?.code });
    }
  };

  const uploadProfilePhoto = async (file) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      addToast(validationError, "error");
      return;
    }

    setPhotoBusy(true);
    const currentUser = auth.currentUser;
    const oldUrl = currentUser?.photoURL || currentPhotoUrl;
    let newReference;

    try {
      const path = `user-uploads/${user.uid}/profile/avatar-${crypto.randomUUID()}.${imageExtension(file)}`;
      newReference = storageRef(storage, path);
      const snapshot = await uploadBytes(newReference, file, {
        contentType: file.type,
        cacheControl: "private,max-age=3600",
      });
      const url = await getDownloadURL(snapshot.ref);

      await updateProfile(currentUser, { photoURL: url });
      await refreshUser();
      setCurrentPhotoUrl(url);
      await deleteStoredPhoto(oldUrl);
      addToast("Profile photo updated.", "success");
    } catch {
      if (newReference) await deleteObject(newReference).catch(() => {});
      addToast("Profile photo could not be updated. Please try again.", "error");
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleRemovePhoto = async () => {
    const currentUser = auth.currentUser;
    const oldUrl = currentUser?.photoURL || currentPhotoUrl;
    if (!oldUrl) {
      addToast("You are already using the default avatar.", "info");
      return;
    }

    setPhotoBusy(true);
    try {
      await updateProfile(currentUser, { photoURL: "" });
      await refreshUser();
      setCurrentPhotoUrl(null);
      await deleteStoredPhoto(oldUrl);
      addToast("Profile photo removed.", "success");
    } catch (error) {
      addToast(getAuthErrorMessage(error, "Profile photo could not be removed."), "error");
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleSaveChanges = async (event) => {
    event.preventDefault();
    if (saving) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      addToast("Enter a display name.", "error");
      return;
    }

    const changingPassword = Boolean(newPassword || confirmNewPassword || currentPassword);
    if (changingPassword) {
      if (!currentPassword) {
        addToast("Enter your current password to change it.", "error");
        return;
      }
      if (newPassword.length < 6) {
        addToast("Use a new password with at least 6 characters.", "error");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        addToast("New passwords do not match.", "error");
        return;
      }
    }

    setSaving(true);
    try {
      if (changingPassword) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, newPassword);
      }

      await updateProfile(auth.currentUser, { displayName: trimmedName });
      await setDoc(
        doc(db, "users", user.uid),
        { name: trimmedName, email: user.email },
        { merge: true }
      );
      await refreshUser();
      setName(trimmedName);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      addToast(
        changingPassword
          ? "Profile and password updated."
          : "Account settings updated.",
        "success"
      );
    } catch (error) {
      addToast(
        getAuthErrorMessage(error, "Account settings could not be updated."),
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="account-settings-page">
        <div className="settings-card">
          <form onSubmit={handleSaveChanges}>
            <h1 className="title">Account Settings</h1>

            <div className="mb-4">
              <span className="form-label">Display Picture</span>
              <div className="profile-pic-container">
                <img
                  src={safeImageUrl(currentPhotoUrl)}
                  alt="Current profile"
                  width="120"
                  height="120"
                />
                <div className="profile-actions">
                  <label className="upload-btn-outline" htmlFor="profile-photo">
                    {photoBusy ? "Updating..." : "Change Photo"}
                  </label>
                  <input
                    id="profile-photo"
                    className="visually-hidden"
                    type="file"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) uploadProfilePhoto(file);
                    }}
                    accept={ACCEPTED_IMAGE_TYPES.join(",")}
                    disabled={photoBusy}
                  />
                  <button
                    type="button"
                    className="remove-photo-btn"
                    onClick={handleRemovePhoto}
                    disabled={photoBusy || !currentPhotoUrl}
                  >
                    Remove Photo
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="name" className="form-label">Name</label>
              <input
                type="text"
                className="form-control"
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength="100"
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={user.email || ""}
                disabled
              />
            </div>

            <section className="change-password-section" aria-labelledby="change-password-title">
              <h2 id="change-password-title">Change Password</h2>
              <p className="password-note">Leave these fields blank to keep your current password.</p>
              <div className="mb-3">
                <label htmlFor="current-password" className="form-label">Current Password</label>
                <input
                  id="current-password"
                  type="password"
                  className="form-control"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="new-password" className="form-label">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  className="form-control"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  minLength="6"
                  autoComplete="new-password"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="confirm-password" className="form-label">Confirm New Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  className="form-control"
                  value={confirmNewPassword}
                  onChange={(event) => setConfirmNewPassword(event.target.value)}
                  minLength="6"
                  autoComplete="new-password"
                />
              </div>
            </section>

            <button type="submit" className="save-changes-btn" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}

export default AccountSettings;
