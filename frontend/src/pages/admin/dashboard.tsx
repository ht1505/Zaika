import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/shared/Header';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [botOnline, setBotOnline] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) router.replace('/login');
    if (user?.role !== 'admin') router.replace('/customer/dashboard');
  }, [user]);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('http://localhost:8002/health');
        setBotOnline(res.ok);
      } catch {
        setBotOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  return (
    <>
      <Head><title>Zaika – Owner Dashboard</title></Head>
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
        <Header />

        {/* Status bar */}
        <div className="border-b px-6 py-2 flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <span className="text-xs font-mono font-semibold uppercase tracking-widest"
            style={{ color: 'var(--text-faint)' }}>
            Owner Intelligence Dashboard
          </span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              botOnline === null ? 'bg-yellow-400 animate-pulse' :
              botOnline ? 'bg-green-400' : 'bg-red-400'
            }`} />
            <span className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>
              {botOnline === null ? 'Checking...' :
               botOnline ? 'Analytics Bot Online' : 'Bot Offline — run owner_analytics.py'}
            </span>
          </div>
        </div>

        {/* Offline warning */}
        {botOnline === false && (
          <div className="border-b px-6 py-3 bg-red-950/40 border-red-900/50">
            <p className="text-red-400 text-sm font-mono text-center">
              ⚠️ Owner analytics backend is not running. Start with:{' '}
              <code className="bg-red-950/60 px-2 py-0.5 rounded text-red-300">
                cd analytics && python owner_analytics.py
              </code>
            </p>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 relative">
          {botOnline ? (
            <iframe
              src="http://localhost:8002"
              className="w-full h-full border-0"
              style={{ minHeight: 'calc(100vh - 100px)' }}
              title="Zaika Owner Dashboard"
              allow="microphone"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-32 gap-6">
              <div className="text-6xl">📊</div>
              <div className="text-center">
                <h2 className="text-xl font-bold mb-2"
                  style={{ fontFamily: "'Fraunces', serif", color: 'var(--text-primary)' }}>
                  Owner Analytics Not Running
                </h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                  Start the analytics server to view your business intelligence dashboard.
                </p>
                <div className="border rounded-xl p-4 text-left max-w-md mx-auto"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                  <p className="text-xs font-mono mb-2" style={{ color: 'var(--text-faint)' }}>
                    Run in a new terminal:
                  </p>
                  <code className="text-green-400 font-mono text-sm block leading-relaxed">
                    cd analytics<br />
                    python owner_analytics.py
                  </code>
                  <p className="text-xs font-mono mt-2" style={{ color: 'var(--text-faint)' }}>
                    → Starts on http://localhost:8002
                  </p>
                </div>
                <button
                  onClick={() => setBotOnline(null)}
                  className="mt-5 px-5 py-2.5 bg-saffron text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors">
                  Retry Connection
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}