import { Navigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider.tsx";

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredRole?: "ADMIN" | "USER";
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  if (!user || !user?.authenticated) return <Navigate to="/login" replace />;

  if (requiredRole && user?.user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
