import { Outlet, Link, useLocation } from "react-router";
import { Logo } from "../components/zaika/Logo";
import {
  LayoutDashboard,
  TrendingUp,
  UtensilsCrossed,
  GitBranch,
  ClipboardList,
  DollarSign,
  Mic,
  LogOut,
} from "lucide-react";

export default function AdminLayout() {
  const location = useLocation();

  const navItems = [
    { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/admin/revenue", icon: TrendingUp, label: "Revenue Insights" },
    { path: "/admin/menu", icon: UtensilsCrossed, label: "Menu Analysis" },
    { path: "/admin/bcg", icon: GitBranch, label: "BCG Visual" },
    { path: "/admin/orders", icon: ClipboardList, label: "Orders" },
    { path: "/admin/pricing", icon: DollarSign, label: "Pricing Config" },
    { path: "/admin/voice-config", icon: Mic, label: "Voice Bot Config" },
  ];

  return (
    <div className="flex min-h-screen bg-cream">
      {/* Sidebar */}
      <aside className="w-64 bg-forest text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-heading font-semibold text-white">
              Zaika
            </span>
            <span className="text-sm bg-saffron px-2 py-0.5 rounded">Admin</span>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/admin" && location.pathname.startsWith(item.path));

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-saffron text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link
            to="/admin/login"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
