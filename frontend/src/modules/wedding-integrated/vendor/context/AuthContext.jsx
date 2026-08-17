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
        // Deliberately NOT writing the generic 'token'. Both the user app and
        // the vendor portal were storing their credential in that one slot, so
        // whichever signed in last clobbered the other -- which is how a
        // regular user ended up being treated as a vendor. The request
        // interceptor already prefers vendor_token on /wedding/vendor and falls
        // back to it elsewhere under /wedding, so nothing needs the copy.
        setUser(newUser);
        return { success: true, user: newUser };
      }
      return { success: false, error: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || "Signup failed. Please try again.";
      return { success: false, error: message };
    }
  };

  const sendOtp = async (phone) => {
    try {
      const response = await api.post('/wedding/vendor/send-otp', { phone });
      if (response.data.success) {
        return { 
          success: true, 
          message: response.data.message, 
          debugOtp: response.data.debugOtp 
        };
      }
      return { success: false, error: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || "Failed to send OTP. Please try again.";
      return { success: false, error: message };
    }
  };

  const login = async (identifier, credential) => {
    try {
      const payload = typeof identifier === 'object' 
        ? identifier 
        : (String(identifier).includes('@') 
            ? { email: identifier, password: credential } 
            : { phone: identifier, otp: credential });

      const response = await api.post('/wedding/vendor/login', payload);

      if (response.data.success) {
        const { token, user: existingUser } = response.data;
        localStorage.setItem("vendor_token", token);
        localStorage.setItem("vendor_user", JSON.stringify(existingUser));
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
        sendOtp,
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
