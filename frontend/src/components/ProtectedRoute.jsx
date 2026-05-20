import { Navigate } from "react-router-dom";
import { isAuthenticated, hasRole } from "../utils/auth";

export default function ProtectedRoute({ children, requiredRole }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (requiredRole !== undefined && !hasRole(requiredRole)) {
    return <Navigate to="/403" replace />;
  }
  return children;
}
