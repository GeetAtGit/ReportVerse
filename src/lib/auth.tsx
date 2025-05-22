"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/services/api";
import toast from "react-hot-toast";

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any, role: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check if user is authenticated when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // Set the auth token for API calls
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          // Get current user
          const { data } = await api.get("/auth/me");

          // Ensure we have the correct data structure
          if (!data || !data.data) {
            throw new Error("Invalid user data received");
          }

          setUser(data.data);

          // Redirect from auth pages if already logged in
          if (pathname?.includes("/login") || pathname?.includes("/register")) {
            if (data.data.role === "mentor") {
              router.push("/mentor/dashboard");
            } else {
              router.push("/mentee/dashboard");
            }
          }
        } catch (error) {
          console.error("Auth check error:", error);
          localStorage.removeItem("token");
          delete api.defaults.headers.common["Authorization"];
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router, pathname]);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });

      // Verify we get a token and store it
      if (!data.token) {
        throw new Error("No token received from server");
      }

      localStorage.setItem("token", data.token);
      api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

      try {
        // Get user details
        const userResponse = await api.get("/auth/me");

        // Check if we have the expected data structure
        if (!userResponse.data || !userResponse.data.data) {
          throw new Error("Invalid user data received");
        }

        setUser(userResponse.data.data);
        toast.success("Login successful");

        // Redirect based on role
        if (userResponse.data.data.role === "mentor") {
          router.push("/mentor/dashboard");
        } else {
          router.push("/mentee/dashboard");
        }
      } catch (error) {
        // Handle errors from the /me endpoint
        console.error("Error fetching user details:", error);
        localStorage.removeItem("token");
        delete api.defaults.headers.common["Authorization"];
        toast.error("Failed to get user information");
        throw error;
      }
    } catch (error: any) {
      // Handle login errors
      console.error("Login error:", error);
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
      setUser(null);

      // Display appropriate error message
      const errorMessage =
        error.response?.data?.error ||
        "Login failed. Please check your credentials.";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: any, role: string) => {
    setIsLoading(true);
    try {
      const { data } = await api.post(`/auth/register/${role}`, userData);

      // Verify we get a token and store it
      if (!data.token) {
        throw new Error("No token received from server");
      }

      toast.success("Registration successful");

      // Auto login after registration
      localStorage.setItem("token", data.token);
      api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

      try {
        // Get user details
        const userResponse = await api.get("/auth/me");

        // Check if we have the expected data structure
        if (!userResponse.data || !userResponse.data.data) {
          throw new Error("Invalid user data received");
        }

        setUser(userResponse.data.data);

        // Redirect based on role
        if (role === "mentor") {
          router.push("/mentor/dashboard");
        } else {
          router.push("/mentee/dashboard");
        }
      } catch (error) {
        // Handle errors from the /me endpoint
        console.error("Error fetching user details:", error);
        localStorage.removeItem("token");
        delete api.defaults.headers.common["Authorization"];
        toast.error("Failed to get user information");
        throw error;
      }
    } catch (error: any) {
      // Handle registration errors
      console.error("Registration error:", error);
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];

      // Display appropriate error message
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Registration failed. Please try again.";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    router.push("/login");
    toast.success("Logged out successfully");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
