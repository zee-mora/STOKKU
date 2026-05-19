import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

import MainLayout from "../components/layout/MainLayout";

// Pages Section
import Login from "../pages/Login";
import AdminRbac from "../pages/Admin/Rbac";
import AdminUsers from "../pages/Admin/Users";
import RequestBarang from "../pages/Staff/Request-Barang";
import RequestDetailPage from "../pages/Staff/Request-Barang/Detail";
import Barang from "../pages/Admin/barang";
import DashboardStaff from "../pages/Staff/Dashboard";
import DashboardAdmin from "../pages/Admin/Dashboard";
import Unauthorized from "../pages/Unauthorized";
import Approval from "../pages/Admin/Approval";

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
    return <Unauthorized />;
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

          <Route element={<PermissionRoute permission="rbac.view" />}>
            <Route path="admin/rbac" element={<AdminRbac />} />
          </Route>

          <Route element={<PermissionRoute permission="users.view" />}>
            <Route path="admin/users" element={<AdminUsers />} />
          </Route>

          <Route element={<PermissionRoute permission="request-barang.view" />}>
            <Route path="staff/request-barang" element={<RequestBarang />} />
            <Route path="staff/request/:id" element={<RequestDetailPage />} />
          </Route>

          <Route element={<PermissionRoute permission="dashboard-staff.view" />}>
            <Route path="staff/dashboard" element={<DashboardStaff />} />
          </Route>

          <Route element={<PermissionRoute permission="barang.view" />}>
            <Route path="admin/barang" element={<Barang />} />
          </Route>

          <Route element={<PermissionRoute permission="approval.view" />}>
            <Route path="admin/approval" element={<Approval />} />
          </Route>

          <Route element={<PermissionRoute permission="dashboard-admin.view" />}>
            <Route path="admin/dashboard" element={<DashboardAdmin />} />
          </Route>

        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
