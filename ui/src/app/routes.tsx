import { createBrowserRouter } from "react-router";
import DesignSystem from "./screens/DesignSystem";

// Customer Portal Screens
import CustomerLogin from "./screens/customer/Login";
import CustomerHome from "./screens/customer/Home";
import ItemDetail from "./screens/customer/ItemDetail";
import ChatOrder from "./screens/customer/ChatOrder";
import VoiceOrder from "./screens/customer/VoiceOrder";
import OrderConfirmation from "./screens/customer/OrderConfirmation";
import Profile from "./screens/customer/Profile";

// Admin Portal Screens
import AdminLogin from "./screens/admin/Login";
import Dashboard from "./screens/admin/Dashboard";
import RevenueInsights from "./screens/admin/RevenueInsights";
import MenuAnalysis from "./screens/admin/MenuAnalysis";
import BCGVisual from "./screens/admin/BCGVisual";
import OrderManagement from "./screens/admin/OrderManagement";
import PricingConfig from "./screens/admin/PricingConfig";
import VoiceBotConfig from "./screens/admin/VoiceBotConfig";

// Layout wrapper
import CustomerLayout from "./layouts/CustomerLayout";
import AdminLayout from "./layouts/AdminLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: DesignSystem,
  },
  {
    path: "/customer/login",
    Component: CustomerLogin,
  },
  {
    path: "/customer",
    Component: CustomerLayout,
    children: [
      { index: true, Component: CustomerHome },
      { path: "item/:id", Component: ItemDetail },
      { path: "chat", Component: ChatOrder },
      { path: "voice", Component: VoiceOrder },
      { path: "order-confirmation/:orderId", Component: OrderConfirmation },
      { path: "profile", Component: Profile },
    ],
  },
  {
    path: "/admin/login",
    Component: AdminLogin,
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "revenue", Component: RevenueInsights },
      { path: "menu", Component: MenuAnalysis },
      { path: "bcg", Component: BCGVisual },
      { path: "orders", Component: OrderManagement },
      { path: "pricing", Component: PricingConfig },
      { path: "voice-config", Component: VoiceBotConfig },
    ],
  },
]);
