import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Public Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CustomerMenuPage from "./pages/CustomerMenuPage";

// Dashboard Pages
import DashboardLayout from "./components/DashboardLayout";
import OrdersKDSPage from "./pages/dashboard/OrdersKDSPage";
import MenuBuilderPage from "./pages/dashboard/MenuBuilderPage";
import TablesPage from "./pages/dashboard/TablesPage";
import SettingsPage from "./pages/dashboard/SettingsPage";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Visitor & Auth Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Customer Mobile Scan-to-Order Menu */}
        <Route path="/m/:qrToken" element={<CustomerMenuPage />} />

        {/* Restaurant Owner Dashboard (Protected Layout) */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard/orders" replace />} />
          <Route path="orders" element={<OrdersKDSPage />} />
          <Route path="menu" element={<MenuBuilderPage />} />
          <Route path="tables" element={<TablesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
