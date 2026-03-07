import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/shared/Header';
import RevenueInsights from '../../components/admin/RevenueInsights';
import MenuAnalysis from '../../components/admin/MenuAnalysis';
import { revenueApi } from '../../lib/api';
import { mockRevenueInsights } from '../../data/mockData';

export default function InsightsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    if (user.role !== 'admin') { router.replace('/customer/dashboard'); return; }
    fetchInsights();
  }, [user]);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await revenueApi.getInsights();
      setInsights(res.data);
    } catch {
      setInsights(mockRevenueInsights);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Head><title>Zaika Admin — Revenue Insights</title></Head>
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-charcoal">Revenue Insights</h1>
            <p className="font-body text-sm text-gray-500 mt-1">
              BCG matrix analysis, AI recommendations, and menu performance
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-24 shimmer" />)}
            </div>
          ) : insights ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueInsights
                recommendations={insights.recommendations || []}
                bcgMatrix={insights.bcg_matrix || []}
              />
              <div className="space-y-6">
                <div className="card p-5">
                  <h3 className="font-display font-bold text-charcoal mb-4">Category Performance</h3>
                  {(insights.category_breakdown || []).map((cat: any) => (
                    <div key={cat.category} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="font-body font-semibold text-sm text-charcoal">{cat.category}</p>
                        <p className="font-body text-xs text-gray-400">{cat.item_count} items · {Number(cat.avg_margin).toFixed(1)}% avg margin</p>
                      </div>
                      <div className="text-right">
                        <p className="font-body font-bold text-sm text-saffron">
                          ₹{Number(cat.total_revenue || 0).toLocaleString('en-IN')}
                        </p>
                        <p className="font-body text-xs text-gray-400">{cat.total_orders || 0} orders</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {!loading && insights?.top_items && (
            <div>
              <h2 className="font-display text-xl font-bold text-charcoal mb-4">Full Menu Analysis</h2>
              <MenuAnalysis items={insights.top_items} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
