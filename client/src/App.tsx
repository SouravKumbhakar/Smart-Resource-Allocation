import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute, { RoleRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Needs from "./pages/Needs";
import NeedDetail from "./pages/NeedDetail";
import Volunteers from "./pages/Volunteers";
import Assignments from "./pages/Assignments";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import SuperAdmin from "./pages/SuperAdmin";
import NotFound from "./pages/NotFound";
import ProfileComplete from "./pages/ProfileComplete";
import AssignmentDetail from "./pages/AssignmentDetail";
import LandingPage from "./pages/LandingPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 401 (auth errors are handled by the API layer)
        if (error?.message?.includes('401')) return false;
        return failureCount < 2;
      },
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile/complete" element={<ProfileComplete />} />
          <Route path="/" element={<LandingPage />} />

          {/* Protected routes — requires JWT token */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/needs" element={<Needs />} />
              <Route path="/needs/:id" element={<NeedDetail />} />
              <Route path="/volunteers" element={<Volunteers />} />
              <Route path="/assignments" element={<Assignments />} />
              <Route path="/assignments/:id" element={<AssignmentDetail />} />
              <Route path="/profile" element={<Profile />} />
              
              {/* Super Admin routes */}
              <Route element={<RoleRoute allowedRoles={['super_admin']} />}>
                <Route path="/admin" element={<SuperAdmin />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
