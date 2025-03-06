import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  const { data, error, isLoading } = useQuery<Ticket[], Error>({
    queryKey: ["tickets"],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tickets`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
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
        throw new Error("Network response was not ok");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] }); // Invalidate the "tickets" query to refetch data
    },
    onError: (error: Error) => {
      console.error("Error updating ticket status:", error.message);
      // Optionally, you can add a toast or alert to notify the user of the error
    },
  });

  // Handle status change
  const handleStatusChange = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  // Loading and error states
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error fetching tickets: {error.message}</div>;

  return (
    <div>
      <h1>Admin Tickets</h1>
      <ul>
        {data?.map((ticket) => (
          <li key={ticket.id}>
            <h2>{ticket.title}</h2>
            <p>{ticket.description}</p>
            <p>Status: {ticket.status}</p>
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
            >
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </li>
        ))}
      </ul>
    </div>
  );
}
