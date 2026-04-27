import { Navigate, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/api";

/**
 * Wraps protected routes. If no JWT token found in localStorage, redirects to /login.
 * The actual token validity is enforced server-side; the API layer handles 401 auto-logout.
 */
export default function ProtectedRoute() {
  const token = localStorage.getItem("token");
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

/**
 * Role-gated route wrapper. Requires the user to have one of the allowed roles.
 */
export function RoleRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const { data: user, isLoading } = useQuery({ queryKey: ["user"], queryFn: getMe, retry: false });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading access rules...</div>;
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
