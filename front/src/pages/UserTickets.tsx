import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  List,
  ListItem,
} from "@mui/material";
import { useLogout } from "../hooks/useLogout.ts";

// Define types
interface Ticket {
  id: string;
  title: string;
  description: string;
}

interface NewTicket {
  title: string;
  description: string;
}

export default function UserTickets() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Fetch user tickets
  const {
    data: tickets,
    isLoading,
    error: fetchError,
  } = useQuery<Ticket[], Error>({
    queryKey: ["userTickets"],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/userTickets`,
        {
          credentials: "include",
        },
      );
      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }
      return response.json();
    },
  });

  // Create a new ticket
  const createTicketMutation = useMutation<Ticket, Error, NewTicket>({
    mutationFn: async (newTicket) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newTicket),
      });
      if (!response.ok) {
        throw new Error("Failed to create ticket");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userTickets"] });
      setTitle("");
      setDescription("");
    },
    onError: (error) => {
      console.error("Error creating ticket:", error.message);
    },
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTicketMutation.mutate({ title, description });
  };

  // Handle logout
  const handleLogout = useLogout();

  // Loading and error states
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (fetchError) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Alert severity="error">
          Error fetching tickets: {fetchError.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 4,
        backgroundColor: "#f4f4f4",
        width: "100vw",
        minHeight: "100vh",
      }}
    >
      {/* Logout Button */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 800,
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 2,
        }}
      >
        <Button variant="contained" color="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </Box>

      {/* Create Ticket Form */}
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          width: "100%",
          maxWidth: 800,
          marginBottom: 4,
          backgroundColor: "white",
        }}
      >
        <Typography variant="h4" gutterBottom>
          Create New Ticket
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter ticket title"
            required
            disabled={createTicketMutation.isPending}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter ticket description"
            required
            disabled={createTicketMutation.isPending}
            margin="normal"
            multiline
            rows={4}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={createTicketMutation.isPending}
            sx={{ marginTop: 2 }}
          >
            {createTicketMutation.isPending ? (
              <CircularProgress size={24} />
            ) : (
              "Create Ticket"
            )}
          </Button>
          {createTicketMutation.isError && (
            <Alert severity="error" sx={{ marginTop: 2 }}>
              Error: {createTicketMutation.error.message}
            </Alert>
          )}
        </form>
      </Paper>

      {/* Tickets List */}
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          width: "100%",
          maxWidth: 800,
          backgroundColor: "white",
        }}
      >
        <Typography variant="h4" gutterBottom>
          Your Tickets
        </Typography>
        <List>
          {tickets?.map((ticket) => (
            <ListItem key={ticket.id} sx={{ padding: 0, marginBottom: 2 }}>
              <Paper
                elevation={2}
                sx={{
                  padding: 3,
                  width: "100%",
                  backgroundColor: "#f9f9f9",
                }}
              >
                <Typography variant="h6">{ticket.title}</Typography>
                <Typography variant="body1">{ticket.description}</Typography>
              </Paper>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
