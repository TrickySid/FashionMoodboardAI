import { createContext, useContext, useEffect, useState } from "react";
import { onIdTokenChanged } from "firebase/auth";
import { auth } from "../firebaseAuth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setRevision] = useState(0);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshUser = () => {
    if (!auth.currentUser) return;
    setUser(auth.currentUser);
    setRevision((value) => value + 1);
  };

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
