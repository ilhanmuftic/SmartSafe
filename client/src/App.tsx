import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./lib/auth";
import LoginForm from "./components/LoginForm";
import Dashboard from "./pages/Dashboard";
import VehiclesPage from "./pages/VehiclesPage";
import RequestVehiclePage from "./pages/RequestVehiclePage";
import BookingsPage from "./pages/BookingsPage";
import HistoryPage from "./pages/HistoryPage";
import RequestsPage from "./pages/RequestsPage";
import ReportsPage from "./pages/ReportsPage";
import AccessLogsPage from "./pages/AccessLogsPage";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/" /> : <LoginForm />}
      </Route>
      <Route path="/" exact>
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/vehicles">
        <ProtectedRoute>
          <VehiclesPage />
        </ProtectedRoute>
      </Route>
      <Route path="/request">
        <ProtectedRoute>
          <RequestVehiclePage />
        </ProtectedRoute>
      </Route>
      <Route path="/bookings">
        <ProtectedRoute>
          <BookingsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/history">
        <ProtectedRoute>
          <HistoryPage />
        </ProtectedRoute>
      </Route>
      <Route path="/requests">
        <ProtectedRoute>
          <RequestsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute>
          <ReportsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/logs">
        <ProtectedRoute>
          <AccessLogsPage />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
