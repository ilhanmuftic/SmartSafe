import { useAuth } from "@/lib/auth";
import AdminDashboard from "@/components/AdminDashboard";
import EmployeeDashboard from "@/components/EmployeeDashboard";

export default function Dashboard() {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return null; // This should be handled by the router
  }

  return isAdmin ? <AdminDashboard /> : <EmployeeDashboard />;
}
