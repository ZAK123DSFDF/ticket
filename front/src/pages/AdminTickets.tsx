import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  List,
  ListItem,
  Select,
  MenuItem,
  FormControl,
  SelectChangeEvent,
} from "@mui/material";
import { useLogout } from "../hooks/useLogout.ts";

// Define the Ticket interface
interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
}

export default function AdminTickets() {
  const queryClient = useQueryClient();

  // Fetch tickets
  const {
    data: tickets,
    isLoading,
    error: fetchError,
  } = useQuery<Ticket[], Error>({
    queryKey: ["tickets"],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tickets`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }
      return response.json();
    },
  });

  // Update ticket status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/tickets/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ status }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update ticket status");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] }); // Refresh the tickets list
    },
    onError: (error: Error) => {
      console.error("Error updating ticket status:", error.message);
    },
  });

  // Handle status change
  const handleStatusChange = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
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
        minHeight: "100vh",
        width: "100vw",
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
          Admin Tickets
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
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography variant="h6">{ticket.title}</Typography>
                  <Typography variant="body1" sx={{ marginBottom: 2 }}>
                    {ticket.description}
                  </Typography>
                </Box>
                <FormControl sx={{ minWidth: 120 }}>
                  <Select
                    value={ticket.status}
                    onChange={(e: SelectChangeEvent) =>
                      handleStatusChange(ticket.id, e.target.value as string)
                    }
                    sx={{
                      backgroundColor:
                        ticket.status === "OPEN"
                          ? "#d32f2f" // Red for OPEN
                          : ticket.status === "IN_PROGRESS"
                            ? "#ed6c02" // Orange for IN_PROGRESS
                            : "#2e7d32", // Green for CLOSED
                      color: "white",
                      "& .MuiSelect-icon": {
                        color: "white", // Dropdown arrow color
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: "none", // Remove the border
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        border: "none", // Remove the border on hover
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        border: "none", // Remove the border on focus
                      },
                      height: "40px", // Make the dropdown vertically less thick
                      fontSize: "0.875rem", // Smaller font size for status text
                    }}
                  >
                    <MenuItem value="OPEN" sx={{ fontSize: "0.875rem" }}>
                      OPEN
                    </MenuItem>
                    <MenuItem value="IN_PROGRESS" sx={{ fontSize: "0.875rem" }}>
                      IN_PROGRESS
                    </MenuItem>
                    <MenuItem value="CLOSED" sx={{ fontSize: "0.875rem" }}>
                      CLOSED
                    </MenuItem>
                  </Select>
                </FormControl>
              </Paper>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
