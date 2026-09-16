const AUTH_MESSAGES = {
  "auth/email-already-in-use": "An account already exists for that email.",
  "auth/invalid-credential": "The email or password is incorrect.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/requires-recent-login": "Please sign in again before changing this setting.",
  "auth/too-many-requests": "Too many attempts. Please wait and try again.",
  "auth/weak-password": "Use a password with at least 6 characters.",
  "auth/wrong-password": "The current password is incorrect.",
};

export function getAuthErrorMessage(error, fallback) {
  return AUTH_MESSAGES[error?.code] || fallback;
}

export function getApiErrorMessage(error, fallback) {
  return error?.response?.data?.error || fallback;
}
