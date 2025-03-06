import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminTickets from "./pages/AdminTickets";
import UserTickets from "./pages/UserTickets";
import Login from "./pages/Login";
import { useAuth } from "./providers/AuthProvider.tsx";
import Signup from "./pages/Signup.tsx";

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  return (
    <Routes>
      {/* Redirect Home Based on Role */}
      <Route
        path="/"
        element={
          user ? (
            user?.user?.role === "ADMIN" ? (
              <Navigate to="/admin-tickets" />
            ) : (
              <Navigate to="/user-tickets" />
            )
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      {/* Admin Tickets - Only Admins */}
      <Route
        path="/admin-tickets"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminTickets />
          </ProtectedRoute>
        }
      />

      {/* User Tickets - Only Normal Users */}
      <Route
        path="/user-tickets"
        element={
          <ProtectedRoute requiredRole="USER">
            <UserTickets />
          </ProtectedRoute>
        }
      />

      {/* Login Page */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  );
};

export default App;
