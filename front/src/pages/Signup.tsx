import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  Box,
  Button,
  TextField,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { useState } from "react";
import { useAuth, User } from "../providers/AuthProvider";

const API_URL = import.meta.env.VITE_API_URL;

export default function Signup() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [role, setRole] = useState<string>("USER");

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const signupMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      role: string;
    }) => {
      const response = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Signup failed"); // Use `errorData.error`
      }

      return response.json();
    },
    onSuccess: (data: any) => {
      const userData: User = {
        authenticated: true,
        user: data.user,
      };
      setUser(userData);
      if (userData.user.role === "ADMIN") {
        navigate("/admin-tickets");
      } else {
        navigate("/user-tickets");
      }
    },
    onError: (error: Error) => {
      setServerError(error.message); // Set the server error message
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);

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

    if (!role) {
      setRoleError("Please select a role");
      valid = false;
    } else {
      setRoleError(null);
    }

    if (valid) {
      signupMutation.mutate({ email, password, role });
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
        margin: "auto",
        mt: 4,
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
      <FormControl required error={!!roleError}>
        <InputLabel>Role</InputLabel>
        <Select
          value={role}
          onChange={(e) => setRole(e.target.value as string)}
          label="Role"
          name="role"
        >
          <MenuItem value="ADMIN">ADMIN</MenuItem>
          <MenuItem value="USER">USER</MenuItem>
        </Select>
        {roleError && <Alert severity="error">{roleError}</Alert>}
      </FormControl>
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          type="submit"
          disabled={signupMutation.isPending}
        >
          {signupMutation.isPending ? "Signing up..." : "Submit"}
        </Button>
      </Box>
    </Box>
  );
}
