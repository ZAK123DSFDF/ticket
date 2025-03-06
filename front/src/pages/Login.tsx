import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Box, Button, TextField, Alert } from "@mui/material";
import { useState } from "react";
import { useAuth, User } from "../providers/AuthProvider";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const queryClient = useQueryClient();
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null); // Show API error

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      return response.json();
    },
    onSuccess: (data: any) => {
      const userData: User = {
        authenticated: true,
        user: data.user,
      };
      setUser(userData);
      queryClient.invalidateQueries({ queryKey: ["user"] });
      if (userData.user.role === "ADMIN") {
        navigate("/admin-tickets");
      } else {
        navigate("/user-tickets");
      }
    },
    onError: (error: Error) => {
      setServerError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null); // Reset server error on new submission

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    let valid = true;

    if (!email || !validateEmail(email)) {
      setEmailError("Please enter a valid email");
      valid = false;
    } else {
      setEmailError(null);
    }

    if (!password) {
      setPasswordError("Please enter a valid password");
      valid = false;
    } else {
      setPasswordError(null);
    }

    if (valid) {
      loginMutation.mutate({ email, password });
    }
  };

  return (
    <Box
      component="form"
      sx={{
        width: "100%",
        maxWidth: 360,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
      onSubmit={handleSubmit}
    >
      {serverError && <Alert severity="error">{serverError}</Alert>}
      <TextField
        required
        error={!!emailError}
        helperText={emailError}
        label="Email"
        name="email"
        placeholder="Enter your email"
        type="email"
      />
      <TextField
        required
        error={!!passwordError}
        helperText={passwordError}
        label="Password"
        name="password"
        placeholder="Enter your password"
        type="password"
      />
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          type="submit"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "Logging in..." : "Submit"}
        </Button>
      </Box>
    </Box>
  );
}
