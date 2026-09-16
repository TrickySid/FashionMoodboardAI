import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import Footer from "./components/Footer";
import { ToastProvider } from "./components/ToastProvider";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";

const UploadPhoto = lazy(() => import("./components/UploadPhoto"));
const Recommendations = lazy(() => import("./components/Recommendations"));
const AccountSettings = lazy(() => import("./components/AccountSettings"));
const Login = lazy(() => import("./components/Login"));
const SignUp = lazy(() => import("./components/SignUp"));
const PrivacyPolicy = lazy(() => import("./components/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("./components/TermsOfUse"));

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Suspense fallback={<main className="auth-loading" aria-live="polite">Loading page...</main>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<ProtectedRoute><UploadPhoto /></ProtectedRoute>} />
            <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
            <Route path="/account-settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfUse />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
          <Footer />
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
