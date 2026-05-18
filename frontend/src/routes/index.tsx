import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

import MainLayout from "../components/layout/MainLayout";

// Pages Section
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import AdminRbac from "../pages/Admin/Rbac";
import AdminUsers from "../pages/Admin/Users";

const PrivateRoute = () => {
  const token = localStorage.getItem("access_token");
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

const PermissionRoute = ({ permission }: { permission: string }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user?.permissions?.includes(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          {/* Redirect default dashboard */}
          <Route path="/" element={<Navigate to="/admin/users" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route element={<PermissionRoute permission="rbac.manage" />}>
            <Route path="admin/users" element={<AdminUsers />} />
            <Route path="admin/rbac" element={<AdminRbac />} />
          </Route>

        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
