import { Navigate, Route, Routes, BrowserRouter } from "react-router-dom"

import { AdminLayout } from "@/features/admin/layout/admin-layout"
import { ModulePlaceholderPage } from "@/features/admin/pages/module-placeholder"
import { RequireAuth } from "@/features/auth/components/require-auth"
import { LoginPage } from "@/features/auth/pages/login-page"
import { UsersPage } from "@/features/users/pages/users-page"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate replace to="/admin/users" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate replace to="users" />} />
            <Route path="users" element={<UsersPage />} />
            <Route
              path="sensors"
              element={
                <ModulePlaceholderPage
                  title="传感器监控"
                  description="实时观测设备指标、状态与异常趋势。"
                />
              }
            />
            <Route
              path="services"
              element={
                <ModulePlaceholderPage
                  title="服务管理"
                  description="统一查看系统服务、可用性与运维处理状态。"
                />
              }
            />
          </Route>
        </Route>
        <Route path="*" element={<Navigate replace to="/admin/users" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
