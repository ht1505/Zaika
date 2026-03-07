import { useState } from "react";
import { ZaikaCard } from "../../components/zaika/ZaikaCard";
import { Clock, User, DollarSign } from "lucide-react";
import { motion } from "motion/react";

type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "delivered";

interface Order {
  id: string;
  customer: string;
  items: string;
  total: number;
  time: string;
  duration: number; // minutes since order
  status: OrderStatus;
}

const initialOrders: Order[] = [
  {
    id: "ORD-12350",
    customer: "Anjali Mehta",
    items: "Paneer Tikka, Naan x2",
    total: 480,
    time: "7:45 PM",
    duration: 2,
    status: "pending",
  },
  {
    id: "ORD-12349",
    customer: "Vikram Singh",
    items: "Butter Chicken, Rice",
    total: 550,
    time: "7:42 PM",
    duration: 5,
    status: "confirmed",
  },
  {
    id: "ORD-12348",
    customer: "Priya Nair",
    items: "Tandoori Platter",
    total: 680,
    time: "7:38 PM",
    duration: 9,
    status: "confirmed",
  },
  {
    id: "ORD-12347",
    customer: "Rahul Kapoor",
    items: "Biryani, Raita",
    total: 450,
    time: "7:30 PM",
    duration: 17,
    status: "preparing",
  },
  {
    id: "ORD-12346",
    customer: "Sneha Desai",
    items: "Dal Makhani, Roti x4",
    total: 420,
    time: "7:25 PM",
    duration: 22,
    status: "preparing",
  },
  {
    id: "ORD-12345",
    customer: "Arjun Reddy",
    items: "Chicken Curry, Naan",
    total: 510,
    time: "7:15 PM",
    duration: 32,
    status: "ready",
  },
  {
    id: "ORD-12344",
    customer: "Kavya Iyer",
    items: "Samosa x4, Chutney",
    total: 180,
    time: "7:00 PM",
    duration: 47,
    status: "delivered",
  },
];

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  delivered: "Delivered",
};

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  const columns: OrderStatus[] = [
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "delivered",
  ];

  const getOrdersByStatus = (status: OrderStatus) => {
    return orders.filter((order) => order.status === status);
  };

  const getUrgencyColor = (duration: number) => {
    if (duration < 10) return "border-l-success";
    if (duration < 20) return "border-l-warning";
    return "border-l-error";
  };

  const getUrgencyBg = (duration: number) => {
    if (duration < 10) return "bg-success/5";
    if (duration < 20) return "bg-warning/5";
    return "bg-error/5";
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="mb-2">Order Management</h2>
        <p className="text-muted-foreground">
          Real-time order tracking with urgency indicators
        </p>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((status) => {
          const statusOrders = getOrdersByStatus(status);
          return (
            <div key={status} className="flex-shrink-0 w-80">
              {/* Column Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-base">{statusLabels[status]}</h4>
                  <span className="w-6 h-6 rounded-full bg-saffron text-white text-xs flex items-center justify-center">
                    {statusOrders.length}
                  </span>
                </div>
                <div className="h-1 bg-cream-dark rounded-full">
                  <div
                    className={`h-full bg-saffron rounded-full transition-all duration-300`}
                    style={{
                      width:
                        statusOrders.length > 0
                          ? `${Math.min((statusOrders.length / 5) * 100, 100)}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

              {/* Order Cards */}
              <div className="space-y-3 min-h-[400px]">
                {statusOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <ZaikaCard
                      className={`border-l-4 ${getUrgencyColor(
                        order.duration
                      )} ${getUrgencyBg(order.duration)} cursor-grab active:cursor-grabbing`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="font-mono text-sm font-medium">
                          {order.id}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock size={12} />
                          <span>{order.duration}m</span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-muted-foreground" />
                          <span className="text-sm">{order.customer}</span>
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">
                          {order.items}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-cream-dark">
                        <div className="flex items-center gap-2">
                          <DollarSign size={14} className="text-saffron" />
                          <span className="font-mono font-medium text-saffron">
                            ₹{order.total}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {order.time}
                        </span>
                      </div>
                    </ZaikaCard>
                  </motion.div>
                ))}

                {statusOrders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No orders
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <ZaikaCard className="mt-6 bg-turmeric/10">
        <h4 className="mb-3">Urgency Indicators</h4>
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-1 h-8 bg-success rounded" />
            <span>Green: &lt;10 min (On Time)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-8 bg-warning rounded" />
            <span>Amber: 10-20 min (Watch)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-8 bg-error rounded" />
            <span>Red: &gt;20 min (Urgent)</span>
          </div>
        </div>
      </ZaikaCard>
    </div>
  );
}
