import { TrendingUp, ShoppingBag, Users, BarChart2, MessageSquare, Mic } from 'lucide-react';

interface OverviewProps {
  data: {
    total_orders: number;
    unique_customers: number;
    total_revenue: number;
    avg_order_value: number;
    revenue_7d: number;
    revenue_30d: number;
    chat_orders: number;
    voice_orders: number;
    cart_orders: number;
  };
}

export default function Overview({ data }: OverviewProps) {
  const stats = [
    {
      label: 'Total Revenue',
      value: `₹${Number(data.total_revenue).toLocaleString('en-IN')}`,
      sub: `₹${Number(data.revenue_30d).toLocaleString('en-IN')} last 30d`,
      icon: <TrendingUp size={20} />,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Total Orders',
      value: Number(data.total_orders).toLocaleString(),
      sub: `${data.chat_orders} chat · ${data.voice_orders} voice`,
      icon: <ShoppingBag size={20} />,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Avg Order Value',
      value: `₹${Number(data.avg_order_value).toFixed(0)}`,
      sub: 'per transaction',
      icon: <BarChart2 size={20} />,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Unique Customers',
      value: Number(data.unique_customers).toLocaleString(),
      sub: 'all time',
      icon: <Users size={20} />,
      color: 'bg-orange-50 text-saffron',
    },
  ];

  const totalOrders = Number(data.total_orders) || 1;
  const channels = [
    { label: 'Chat Orders', count: Number(data.chat_orders), icon: <MessageSquare size={14} />, color: 'bg-purple-400' },
    { label: 'Voice Orders', count: Number(data.voice_orders), icon: <Mic size={14} />, color: 'bg-blue-400' },
    { label: 'Cart Orders', count: Number(data.cart_orders), icon: <ShoppingBag size={14} />, color: 'bg-gray-300' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            <p className="font-display text-2xl font-bold text-charcoal">{stat.value}</p>
            <p className="font-body text-sm font-medium text-gray-600 mt-0.5">{stat.label}</p>
            <p className="font-body text-xs text-gray-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Channel breakdown */}
      <div className="card p-5">
        <h3 className="font-display font-bold text-charcoal mb-4">Order Channels</h3>
        <div className="space-y-3">
          {channels.map((ch, i) => (
            <div key={i}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2 font-body text-sm text-gray-600">
                  {ch.icon}
                  {ch.label}
                </div>
                <span className="font-body text-sm font-semibold text-charcoal">
                  {ch.count} ({Math.round((ch.count / totalOrders) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${ch.color} transition-all duration-700`}
                  style={{ width: `${(ch.count / totalOrders) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
