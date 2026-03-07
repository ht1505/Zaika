import { ZaikaCard } from "../../components/zaika/ZaikaCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, ShoppingBag, Users, DollarSign } from "lucide-react";

const kpiData = [
  {
    title: "Today's Revenue",
    value: "₹45,280",
    change: "+12.5%",
    trend: "up" as const,
    icon: DollarSign,
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    title: "Total Orders",
    value: "127",
    change: "+8.2%",
    trend: "up" as const,
    icon: ShoppingBag,
    color: "text-bcg-workhorse",
    bgColor: "bg-bcg-workhorse/10",
  },
  {
    title: "Active Customers",
    value: "892",
    change: "+15.3%",
    trend: "up" as const,
    icon: Users,
    color: "text-bcg-hidden-star",
    bgColor: "bg-bcg-hidden-star/10",
  },
  {
    title: "Avg Order Value",
    value: "₹356",
    change: "-2.1%",
    trend: "down" as const,
    icon: TrendingUp,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
];

const channelData = [
  { name: "Voice", orders: 45, fill: "var(--bcg-star)" },
  { name: "Chat", orders: 38, fill: "var(--bcg-hidden-star)" },
  { name: "Manual", orders: 44, fill: "var(--bcg-workhorse)" },
];

const recentOrders = [
  {
    id: "ORD-12345",
    customer: "Rajesh Kumar",
    items: "Butter Chicken, Naan x2",
    total: 610,
    status: "Preparing",
    time: "5 mins ago",
  },
  {
    id: "ORD-12344",
    customer: "Priya Sharma",
    items: "Biryani, Raita",
    total: 480,
    status: "Ready",
    time: "12 mins ago",
  },
  {
    id: "ORD-12343",
    customer: "Amit Patel",
    items: "Paneer Tikka, Dal",
    total: 550,
    status: "Delivered",
    time: "25 mins ago",
  },
  {
    id: "ORD-12342",
    customer: "Sneha Reddy",
    items: "Tandoori Chicken",
    total: 380,
    status: "Delivered",
    time: "45 mins ago",
  },
];

const statusColors = {
  Preparing: "bg-warning/20 text-warning",
  Ready: "bg-success/20 text-success",
  Delivered: "bg-bcg-dog/20 text-bcg-dog",
};

export default function Dashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="mb-2">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <ZaikaCard key={kpi.title} hover>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${kpi.bgColor} flex items-center justify-center`}>
                  <Icon className={kpi.color} size={24} />
                </div>
                <span
                  className={`text-sm font-medium ${
                    kpi.trend === "up" ? "text-success" : "text-error"
                  }`}
                >
                  {kpi.change}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{kpi.title}</p>
              <p className="text-2xl font-mono font-semibold">{kpi.value}</p>
            </ZaikaCard>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Channel Breakdown */}
        <ZaikaCard>
          <h3 className="mb-6">Orders by Channel</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={channelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5E6D3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #F5E6D3",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="orders" radius={[8, 8, 0, 0]}>
                {channelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ZaikaCard>

        {/* Quick Stats */}
        <ZaikaCard>
          <h3 className="mb-6">Today's Highlights</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-cream-dark">
              <div>
                <p className="text-sm text-muted-foreground">Peak Hour</p>
                <p className="font-medium">7:00 PM - 8:00 PM</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-mono font-semibold text-saffron">
                  32
                </p>
                <p className="text-xs text-muted-foreground">orders</p>
              </div>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-cream-dark">
              <div>
                <p className="text-sm text-muted-foreground">Top Item</p>
                <p className="font-medium">Butter Chicken</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-mono font-semibold text-saffron">
                  28
                </p>
                <p className="text-xs text-muted-foreground">sold</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Voice Orders Success Rate
                </p>
                <p className="font-medium">94.5%</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-mono font-semibold text-success">
                  ↑
                </p>
              </div>
            </div>
          </div>
        </ZaikaCard>
      </div>

      {/* Recent Orders */}
      <ZaikaCard>
        <h3 className="mb-6">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-cream-dark">
              <tr className="text-left">
                <th className="pb-3 font-medium text-sm text-muted-foreground">
                  Order ID
                </th>
                <th className="pb-3 font-medium text-sm text-muted-foreground">
                  Customer
                </th>
                <th className="pb-3 font-medium text-sm text-muted-foreground">
                  Items
                </th>
                <th className="pb-3 font-medium text-sm text-muted-foreground">
                  Total
                </th>
                <th className="pb-3 font-medium text-sm text-muted-foreground">
                  Status
                </th>
                <th className="pb-3 font-medium text-sm text-muted-foreground">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-cream-dark last:border-0">
                  <td className="py-4">
                    <span className="font-mono text-sm">{order.id}</span>
                  </td>
                  <td className="py-4">{order.customer}</td>
                  <td className="py-4 text-sm text-muted-foreground">
                    {order.items}
                  </td>
                  <td className="py-4">
                    <span className="font-mono">₹{order.total}</span>
                  </td>
                  <td className="py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statusColors[order.status as keyof typeof statusColors]
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-muted-foreground">
                    {order.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ZaikaCard>
    </div>
  );
}
