
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Layouts
import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UsersPage from "./pages/UsersPage";
import LicensesPage from "./pages/LicensesPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import SettingsPage from "./pages/SettingsPage";
import WebhooksPage from "./pages/WebhooksPage";
import LogsPage from "./pages/LogsPage";
import LoginDetailsPage from "./pages/LoginDetailsPage";
import AppOpenPage from "./pages/AppOpenPage";
import EmuUsersPage from "./pages/EmuUsersPage";
import ApiDocsPage from "./pages/ApiDocsPage";
import ApplicationsPage from "./pages/ApplicationsPage";
import UserPortalPage from "./pages/UserPortalPage";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
      refetchOnWindowFocus: false,
    },
  },
});

// Create a custom wrapper that logs information about routes
const RouteLogger = ({ children }) => {
  const location = useLocation();
  console.log("Current route:", location.pathname);
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <RouteLogger>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public home page */}
            <Route path="/" element={<Index />} />
            
            {/* Portal routes need EXTRA high priority and flexibility in path matching */}
            <Route path="/portal/:username/:custom_path" element={<UserPortalPage />} />
            <Route path="/portal/:username/:custom_path/*" element={<UserPortalPage />} />
            
            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Dashboard routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="licenses" element={<LicensesPage />} />
              <Route path="subscriptions" element={<SubscriptionsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="webhooks" element={<WebhooksPage />} />
              <Route path="logs" element={<LogsPage />} />
              <Route path="login-details" element={<LoginDetailsPage />} />
              <Route path="app-open" element={<AppOpenPage />} />
              <Route path="emu-users" element={<EmuUsersPage />} />
              <Route path="api-docs" element={<ApiDocsPage />} />
              <Route path="applications" element={<ApplicationsPage />} />
            </Route>
            
            {/* Direct routes to dashboard sections */}
            <Route path="/users" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<UsersPage />} />
            </Route>
            
            <Route path="/licenses" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<LicensesPage />} />
            </Route>
            
            <Route path="/subscriptions" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<SubscriptionsPage />} />
            </Route>
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<SettingsPage />} />
            </Route>
            
            <Route path="/webhooks" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<WebhooksPage />} />
            </Route>
            
            <Route path="/logs" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<LogsPage />} />
            </Route>
            
            <Route path="/login-details" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<LoginDetailsPage />} />
            </Route>
            
            <Route path="/app-open" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AppOpenPage />} />
            </Route>
            
            <Route path="/emu-users" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<EmuUsersPage />} />
            </Route>
            
            <Route path="/api-docs" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<ApiDocsPage />} />
            </Route>
            
            <Route path="/applications" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<ApplicationsPage />} />
            </Route>
            
            {/* Catch all route at the very end */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </RouteLogger>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
