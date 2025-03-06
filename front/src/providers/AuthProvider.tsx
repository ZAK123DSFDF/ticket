import { createContext, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

// Define user type
export interface User {
  authenticated: boolean;
  user: {
    userId: string;
    email: string;
    role: "ADMIN" | "USER";
    iat: number;
    exp: number;
  };
}

// Define AuthContext type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}
const API_URL = import.meta.env.VITE_API_URL;
// Create AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Fetch user data
const fetchUser = async (): Promise<User | null> => {
  const response = await fetch(`${API_URL}/auth-status`, {
    credentials: "include",
  });
  if (!response.ok) return null;
  return response.json();
};

// AuthProvider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch user role using TanStack Query
  const { data: user = null, isLoading: loading } = useQuery<User | null>({
    queryKey: ["user"],
    queryFn: fetchUser,
  });

  const setUser = (user: User | null) => {
    queryClient.setQueryData(["user"], user);
  };

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/auth/logout", { method: "POST" });
    },
    onSuccess: () => {
      setUser(null); // Clear user cache
      navigate("/login");
    },
  });

  return (
    <AuthContext.Provider
      value={{ user, loading, setUser, logout: logoutMutation.mutate }}
    >
      {children}
    </AuthContext.Provider>
  );
};
