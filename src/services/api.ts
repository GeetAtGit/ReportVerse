import axios from "axios";
import toast from "react-hot-toast";

// Create an Axios instance with default config
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Check if we're in the browser
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle session expiration
    if (error.response?.status === 401) {
      if (typeof window !== "undefined" && localStorage.getItem("token")) {
        localStorage.removeItem("token");

        // Only show toast if we're in the browser
        toast.error("Your session has expired. Please login again.");

        // Redirect to login
        window.location.href = "/login";
      }
    }

    // Handle server errors
    if (error.response?.status === 500) {
      toast.error("Server error. Please try again later.");
    }

    return Promise.reject(error);
  }
);

// Auth API types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  mentorId?: string; // Optional mentorId for auto-assigning mentees
}

// Auth API functions
export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post("/auth/login", credentials),

  register: (userData: RegisterData, role: "mentor" | "mentee") =>
    api.post(`/auth/register/${role}`, userData),

  getCurrentUser: () => api.get("/auth/me"),
};

// Mentee API functions
export const menteeApi = {
  getProfile: () => api.get("/mentee/profile"),

  updateProfile: (profileData: any) => api.put("/mentee/profile", profileData),

  createProfile: (profileData: any) => api.post("/mentee/profile", profileData),

  // Issues
  getIssues: () => api.get("/mentee/issues"),

  getIssue: (issueId: string) => api.get(`/mentee/issues/${issueId}`),

  createIssue: (issueData: any) => api.post("/mentee/issues", issueData),

  // Academics
  getAcademics: () => api.get("/mentee/academics"),

  updateAcademics: (academicsData: any) => {
    // Convert the data to FormData if there are files to upload
    // For this version, we're just simulating with base64 data
    return api.post("/mentee/academics", academicsData);
  },

  // Achievements
  getAchievements: () => api.get("/mentee/achievements"),

  createAchievement: (achievementData: any) =>
    api.post("/mentee/achievements", achievementData),

  // Dashboard
  getDashboard: () => api.get("/mentee/dashboard"),
};

// Mentor API functions
export const mentorApi = {
  // Dashboard
  getDashboard: () => api.get("/mentor/dashboard"),

  // Mentees
  getMentees: () => api.get("/mentor/mentees"),
  assignMentee: (email: string) =>
    api.post("/mentor/mentees/assign", { email }),

  getMenteeProfile: (menteeId: string) =>
    api.get(`/mentor/mentees/${menteeId}/profile`),

  getMenteeAcademics: (menteeId: string) =>
    api.get(`/mentor/mentees/${menteeId}/academics`),

  getMenteeAchievements: (menteeId: string) =>
    api.get(`/mentor/mentees/${menteeId}/achievements`),

  // Issues
  getIssues: () => api.get("/mentor/issues"),

  getIssue: (issueId: string) => api.get(`/mentor/issues/${issueId}`),

  addComment: (issueId: string, commentData: any) =>
    api.post(`/mentor/issues/${issueId}/comment`, commentData),

  createIssue: (issueData: any) => api.post("/mentor/issues", issueData),

  // Achievements
  getAchievements: (options?: { params?: Record<string, string> }) =>
    api.get("/mentor/achievements", options),
};
