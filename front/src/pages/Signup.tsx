import { Link, useNavigate } from "react-router-dom";
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
  Paper,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useAuth, User } from "../providers/AuthProvider";

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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Signup failed");
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
      setServerError(error.message);
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
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw", // Ensure the Box takes up the full viewport width
        backgroundColor: "#f4f4f4",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          width: "100%",
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          boxShadow: 3,
          borderRadius: 2,
          backgroundColor: "white",
        }}
      >
        <Box component="form" onSubmit={handleSubmit}>
          {serverError && <Alert severity="error">{serverError}</Alert>}
          <TextField
            required
            fullWidth
            error={!!emailError}
            helperText={emailError}
            label="Email"
            name="email"
            placeholder="Enter your email"
            type="email"
            margin="normal"
          />
          <TextField
            required
            fullWidth
            error={!!passwordError}
            helperText={passwordError}
            label="Password"
            name="password"
            placeholder="Enter your password"
            type="password"
            margin="normal"
          />
          <FormControl fullWidth required error={!!roleError} margin="normal">
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
          <Button
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            disabled={signupMutation.isPending}
            sx={{ marginTop: 2 }}
          >
            {signupMutation.isPending ? "Signing up..." : "Submit"}
          </Button>
        </Box>
        <Typography variant="body2" align="center" sx={{ marginTop: 2 }}>
          <Link to="/login" style={{ color: "blue" }}>
            Login
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
