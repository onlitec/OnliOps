import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "@/store";
import Login from "@/pages/Login";
import Dashboard from "@/components/dashboard/Dashboard";
import DeviceList from "@/pages/DeviceList";
import VlanManager from "@/pages/VlanManager";
import Topology from "@/pages/Topology";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { checkAuth } from "@/store/slices/authSlice";
import RegisterForm from "@/components/auth/RegisterForm";
import Profile from "@/pages/Profile";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MainLayout from "@/components/MainLayout";
import CategoryManager from "@/pages/CategoryManager";
import Settings from "@/pages/Settings";
import UserManagement from "@/pages/settings/UserManagement";
import ProjectManagement from "@/pages/settings/ProjectManagement";
import SecuritySettings from "@/pages/settings/SecuritySettings";
import BackupRestore from "@/pages/settings/BackupRestore";
import SystemLogs from "@/pages/settings/SystemLogs";
import NotificationSettings from "@/pages/settings/NotificationSettings";
import AppearanceSettings from "@/pages/settings/AppearanceSettings";
import ClientList from "@/pages/ClientList";
import GlobalDashboard from "@/pages/GlobalDashboard";
import Monitoring from "@/pages/Monitoring";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "@/store/slices/authSlice";

function AppInner() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated)

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterForm />} />

      {/* Protected Routes with MainLayout */}
      <Route path="" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<GlobalDashboard />} />
        <Route path="monitoring" element={<Monitoring />} />
        <Route path="clients" element={<ClientList />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="devices/:category" element={<DeviceList />} />
        <Route path="vlans" element={<VlanManager />} />
        <Route path="topology" element={<Topology />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="settings/categories" element={<CategoryManager />} />
        <Route path="settings/users" element={<UserManagement />} />
        <Route path="settings/projects" element={<ProjectManagement />} />
        <Route path="settings/security" element={<SecuritySettings />} />
        <Route path="settings/backup" element={<BackupRestore />} />
        <Route path="settings/logs" element={<SystemLogs />} />
        <Route path="settings/notifications" element={<NotificationSettings />} />
        <Route path="settings/appearance" element={<AppearanceSettings />} />

        {/* Redirects/Fallbacks */}
        <Route path="inventory" element={<Navigate to="/dashboard" replace />} />
        <Route path="simulations/*" element={<Navigate to="/dashboard" replace />} />
      </Route>

      <Route path="*" element={<div className="text-center text-xl mt-10">404 - Page Not Found</div>} />
    </Routes>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppInner />
    </Provider>
  );
}
