'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  MessageSquare,
  Wallet,
  StickyNote,
  CheckSquare,
  Settings,
  LogOut,
  Bot,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/chat', label: 'AI Agent', icon: MessageSquare },
  { href: '/dashboard/expenses', label: 'Expenses', icon: Wallet },
  { href: '/dashboard/notes', label: 'Notes', icon: StickyNote },
  { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && <div className="mobile-overlay" onClick={onClose} />}

      <aside style={{
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        width: 260,
        background: 'linear-gradient(180deg, #0c1220 0%, #0a0e1a 100%)',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        transition: 'transform 0.3s ease',
        transform: mobileOpen ? 'translateX(0)' : undefined,
      }}
        className={`sidebar-container ${mobileOpen ? '' : 'sidebar-hidden-mobile'}`}
      >
        {/* Logo */}
        <div style={{
          padding: '24px 20px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #1e293b',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(37,99,235,0.3)',
            }}>
              <Bot size={22} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>
                <span className="gradient-text">HC Agent</span>
              </h2>
              <p style={{ fontSize: 11, color: '#64748b', marginTop: -2 }}>Personal AI Assistant</p>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="mobile-only-close"
            style={{
              display: 'none', background: 'none', border: 'none',
              color: '#64748b', cursor: 'pointer', padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, padding: '0 16px', marginBottom: 8 }}>
            Menu
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                onClick={onClose}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* User profile */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #1e293b',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px', borderRadius: 12,
            background: 'rgba(15,23,42,0.5)',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: 'white',
            }}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.displayName || user?.email?.split('@')[0] || 'User'}
              </p>
              <p style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email || ''}
              </p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              style={{
                background: 'none', border: 'none', color: '#ef4444',
                cursor: 'pointer', padding: 6, borderRadius: 8,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <style jsx>{`
        @media (max-width: 768px) {
          .sidebar-hidden-mobile {
            transform: translateX(-100%) !important;
          }
          .mobile-only-close {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}
