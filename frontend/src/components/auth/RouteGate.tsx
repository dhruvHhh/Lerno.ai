import { Navigate, Outlet, useLocation } from "react-router";

import useAuth from "@/hooks/useAuth";

// App pages need a signed-in user; the sign-in pages send signed-in users on to the app.
export default function RouteGate({ signedIn }: { signedIn: boolean }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  if (loading) return null;
  if (signedIn && !user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!signedIn && user) return <Navigate to={from ?? "/new"} replace />;
  return <Outlet />;
}
