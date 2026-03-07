import { ZaikaCard } from "../../components/zaika/ZaikaCard";
import { BCGBadge } from "../../components/zaika/BCGBadge";
import { ZaikaButton } from "../../components/zaika/ZaikaButton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, AlertCircle, Lightbulb } from "lucide-react";

const bcgMatrix = [
  {
    category: "Stars",
    items: ["Butter Chicken", "Gulab Jamun"],
    revenue: "₹125,400",
    margin: "68%",
    popularity: "High",
    type: "star" as const,
  },
  {
    category: "Hidden Stars",
    items: ["Rogan Josh", "Chicken Biryani"],
    revenue: "₹45,200",
    margin: "72%",
    popularity: "Low",
    type: "hidden-star" as const,
  },
  {
    category: "Workhorses",
    items: ["Tandoori Chicken", "Samosa"],
    revenue: "₹98,600",
    margin: "52%",
    popularity: "High",
    type: "workhorse" as const,
  },
  {
    category: "Dogs",
    items: ["Garlic Naan", "Raita"],
    revenue: "₹18,400",
    margin: "35%",
    popularity: "Low",
    type: "dog" as const,
  },
];

const categoryRevenue = [
  { name: "Curries", revenue: 145200, fill: "var(--bcg-star)" },
  { name: "Tandoori", revenue: 98600, fill: "var(--bcg-workhorse)" },
  { name: "Biryani", revenue: 78400, fill: "var(--bcg-hidden-star)" },
  { name: "Appetizers", revenue: 56800, fill: "var(--bcg-workhorse)" },
  { name: "Breads", revenue: 28400, fill: "var(--bcg-dog)" },
  { name: "Desserts", revenue: 42100, fill: "var(--bcg-star)" },
];

const recommendations = [
  {
    priority: "high",
    title: "Promote Hidden Stars",
    description:
      "Rogan Josh has 72% margin but low visibility. Feature it in voice prompts.",
    impact: "+₹15,000/month potential",
  },
  {
    priority: "high",
    title: "Bundle Strategy",
    description:
      "Combo Butter Chicken + Naan to boost Dog items while maintaining Star revenue.",
    impact: "+18% avg order value",
  },
  {
    priority: "medium",
    title: "Optimize Pricing",
    description:
      "Tandoori items have 52% margin. Consider 5% price increase.",
    impact: "+₹4,900/month",
  },
  {
    priority: "low",
    title: "Seasonal Special",
    description:
      "Launch limited-time dessert to capitalize on 68% dessert margins.",
    impact: "New revenue stream",
  },
];

const priorityColors = {
  high: "bg-error/10 text-error border-error/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-bcg-workhorse/10 text-bcg-workhorse border-bcg-workhorse/20",
};

export default function RevenueInsights() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="mb-2">Revenue Insights</h2>
        <p className="text-muted-foreground">
          BCG analysis and profitability recommendations
        </p>
      </div>

      {/* BCG Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {bcgMatrix.map((segment) => (
          <ZaikaCard key={segment.category} hover>
            <div className="mb-4">
              <BCGBadge type={segment.type} size="md" />
            </div>
            <h4 className="mb-3">{segment.category}</h4>
            <div className="space-y-2 mb-4">
              {segment.items.map((item) => (
                <p key={item} className="text-sm text-muted-foreground">
                  • {item}
                </p>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-cream-dark">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                <p className="font-mono font-semibold">{segment.revenue}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Margin</p>
                <p className="font-mono font-semibold text-success">
                  {segment.margin}
                </p>
              </div>
            </div>
          </ZaikaCard>
        ))}
      </div>

      {/* Category Revenue Chart */}
      <ZaikaCard className="mb-8">
        <h3 className="mb-6">Revenue by Category</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={categoryRevenue} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#F5E6D3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #F5E6D3",
                borderRadius: "8px",
              }}
              formatter={(value: number) => `₹${value.toLocaleString()}`}
            />
            <Bar dataKey="revenue" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ZaikaCard>

      {/* AI Recommendations */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Lightbulb className="text-saffron" size={24} />
          <h3>AI-Powered Recommendations</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {recommendations.map((rec, index) => (
            <ZaikaCard
              key={index}
              className={`border-2 ${priorityColors[rec.priority]}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {rec.priority === "high" && (
                    <AlertCircle className="text-error" size={20} />
                  )}
                  {rec.priority === "medium" && (
                    <TrendingUp className="text-warning" size={20} />
                  )}
                  {rec.priority === "low" && (
                    <Lightbulb className="text-bcg-workhorse" size={20} />
                  )}
                  <h4 className="text-base">{rec.title}</h4>
                </div>
                <span className="text-xs font-medium uppercase px-2 py-1 rounded">
                  {rec.priority}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {rec.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-success">
                  {rec.impact}
                </span>
                <ZaikaButton variant="ghost" size="sm">
                  Apply
                </ZaikaButton>
              </div>
            </ZaikaCard>
          ))}
        </div>
      </div>
    </div>
  );
}
