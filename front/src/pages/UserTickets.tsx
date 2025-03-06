import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

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
          credentials: "include", // Include credentials if needed
        },
      );
      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }
      return response.json();
    },
  });

  // Create a new ticket
  const mutation = useMutation<Ticket, Error, NewTicket>({
    mutationFn: async (newTicket) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include credentials if needed
        body: JSON.stringify(newTicket),
      });
      if (!response.ok) {
        throw new Error("Failed to create ticket");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userTickets"] }); // Refresh the tickets list
      setTitle(""); // Reset form fields
      setDescription("");
    },
    onError: (error) => {
      console.error("Error creating ticket:", error.message);
      alert("Failed to create ticket. Please try again."); // Notify the user
    },
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ title, description });
  };

  // Loading and error states
  if (isLoading) {
    return <div>Loading tickets...</div>;
  }

  if (fetchError) {
    return <div>Error fetching tickets: {fetchError.message}</div>;
  }

  return (
    <div>
      <h1>User Tickets</h1>

      {/* Create Ticket Form */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          required
          disabled={mutation.isPending}
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          required
          disabled={mutation.isPending}
        />
        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating..." : "Create Ticket"}
        </button>
        {mutation.isError && (
          <p style={{ color: "red" }}>Error: {mutation.error.message}</p>
        )}
      </form>

      {/* Tickets List */}
      <ul>
        {tickets?.map((ticket) => (
          <li key={ticket.id}>
            <h3>{ticket.title}</h3>
            <p>{ticket.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
