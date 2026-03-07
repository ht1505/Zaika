import { Lightbulb, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

interface Recommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact?: string;
  items?: string[];
}

interface RevenueInsightsProps {
  recommendations: Recommendation[];
  bcgMatrix: {
    item_class: string;
    item_count: number;
    avg_margin: number;
    class_revenue: number;
    class_profit: number;
  }[];
}

const PRIORITY_STYLES = {
  high:   'bg-red-50 border-red-100 text-red-700',
  medium: 'bg-amber-50 border-amber-100 text-amber-700',
  low:    'bg-blue-50 border-blue-100 text-blue-700',
};

const CLASS_INFO: Record<string, { label: string; emoji: string; color: string }> = {
  star:        { label: 'Star',        emoji: '⭐', color: 'bg-amber-50 border-amber-200' },
  hidden_star: { label: 'Hidden Star', emoji: '💎', color: 'bg-purple-50 border-purple-200' },
  workhorse:   { label: 'Workhorse',   emoji: '💪', color: 'bg-blue-50 border-blue-200' },
  dog:         { label: 'Dog',         emoji: '🐶', color: 'bg-gray-50 border-gray-200' },
};

export default function RevenueInsights({ recommendations, bcgMatrix }: RevenueInsightsProps) {
  return (
    <div className="space-y-6">
      {/* BCG Matrix Summary */}
      <div className="card p-5">
        <h3 className="font-display font-bold text-charcoal mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-saffron" />
          BCG Matrix Overview
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {bcgMatrix.map((cls) => {
            const info = CLASS_INFO[cls.item_class];
            if (!info) return null;
            return (
              <div key={cls.item_class} className={clsx('border rounded-xl p-4', info.color)}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{info.emoji}</span>
                  <span className="font-body font-semibold text-sm text-charcoal">{info.label}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-body">
                    <span className="text-gray-500">Items</span>
                    <span className="font-semibold text-charcoal">{cls.item_count}</span>
                  </div>
                  <div className="flex justify-between text-xs font-body">
                    <span className="text-gray-500">Avg Margin</span>
                    <span className="font-semibold text-charcoal">{Number(cls.avg_margin).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-xs font-body">
                    <span className="text-gray-500">Revenue</span>
                    <span className="font-semibold text-saffron">₹{Number(cls.class_revenue || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-charcoal flex items-center gap-2">
          <Lightbulb size={18} className="text-amber-500" />
          AI Recommendations
        </h3>
        {recommendations.length === 0 ? (
          <div className="card p-6 text-center text-gray-400 font-body text-sm">
            No recommendations at this time. Add more orders to generate insights.
          </div>
        ) : (
          recommendations.map((rec, i) => (
            <div key={i} className={clsx('border rounded-xl p-4', PRIORITY_STYLES[rec.priority])}>
              <div className="flex items-start gap-3">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-body font-semibold text-sm">{rec.title}</h4>
                    <span className="text-xs uppercase tracking-wide opacity-70 font-body">{rec.priority}</span>
                  </div>
                  <p className="font-body text-sm opacity-80 leading-relaxed">{rec.description}</p>
                  {rec.items && rec.items.length > 0 && (
                    <p className="text-xs font-body mt-1.5 opacity-70">Items: {rec.items.join(', ')}</p>
                  )}
                  {rec.impact && (
                    <div className="mt-2 flex items-center gap-1 text-xs font-body font-semibold">
                      <ArrowRight size={12} />
                      {rec.impact}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
