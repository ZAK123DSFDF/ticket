import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../providers/AuthProvider";

export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setUser } = useAuth();

  return async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
      setUser({
        authenticated: false,
        user: { userId: "", email: "", role: "USER", iat: 0, exp: 0 },
      });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
};
