'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { Menu } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <main style={{
        flex: 1,
        marginLeft: 260,
        padding: '24px 32px',
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        transition: 'margin 0.3s ease',
      }}
        className="main-content"
      >
        {/* Mobile header */}
        <div className="mobile-header" style={{
          display: 'none',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
        }}>
          <button
            onClick={() => setMobileOpen(true)}
            style={{
              background: 'rgba(19,27,46,0.8)',
              border: '1px solid #1e293b',
              borderRadius: 10,
              padding: 8,
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <Menu size={22} />
          </button>
          <h2 className="gradient-text" style={{ fontSize: 18, fontWeight: 800 }}>HC Agent</h2>
        </div>

        {children}
      </main>

      <style jsx>{`
        @media (max-width: 768px) {
          .main-content {
            margin-left: 0 !important;
            padding: 16px !important;
          }
          .mobile-header {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
