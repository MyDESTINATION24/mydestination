import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../../../../services/apiService";
import toast from "react-hot-toast";
import { clearAllAuth } from "@/shared/auth/clearAllAuth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session from localStorage
  useEffect(() => {
    try {
      const activeUser = localStorage.getItem("vendor_user");
      const token = localStorage.getItem("vendor_token");
      if (activeUser && token) {
        setUser(JSON.parse(activeUser));
      }
    } catch (e) {
      console.error("Failed to restore session", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = async (userData) => {
    try {
      const response = await api.post('/wedding/vendor/register', userData);

      if (response.data.success) {
        const { token, user: newUser } = response.data;
        localStorage.setItem("vendor_token", token);
        localStorage.setItem("vendor_user", JSON.stringify(newUser));
        // Also set global token for apiService interceptor if needed
        localStorage.setItem("token", token);
        setUser(newUser);
        return { success: true, user: newUser };
      }
      return { success: false, error: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || "Signup failed. Please try again.";
      return { success: false, error: message };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/wedding/vendor/login', { email, password });

      if (response.data.success) {
        const { token, user: existingUser } = response.data;
        localStorage.setItem("vendor_token", token);
        localStorage.setItem("vendor_user", JSON.stringify(existingUser));
        localStorage.setItem("token", token);
        setUser(existingUser);
        return { success: true, user: existingUser };
      }
      return { success: false, error: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed. Please try again.";
      return { success: false, error: message };
    }
  };

  const logout = () => {
    clearAllAuth();
    setUser(null);
    toast.success("Successfully logged out");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        signup,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
