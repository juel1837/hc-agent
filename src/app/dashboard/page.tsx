'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getExpenses, getTasks, getNotes } from '@/lib/firestore';
import { getUserSettings } from '@/lib/firestore';
import type { Expense, Task, Note } from '@/types';
import { CATEGORY_COLORS } from '@/types';
import {
  Wallet, CheckSquare, StickyNote, TrendingUp,
  AlertCircle, Clock, Sparkles, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format, isToday, isTomorrow, parseISO, differenceInHours } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [exp, tsk, nts] = await Promise.all([
        getExpenses(user.uid),
        getTasks(user.uid),
        getNotes(user.uid),
      ]);
      setExpenses(exp);
      setTasks(tsk);
      setNotes(nts);
      generateAlerts(tsk);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = (taskList: Task[]) => {
    const newAlerts: string[] = [];
    const pending = taskList.filter(t => !t.isCompleted);
    const todayTasks = pending.filter(t => {
      try { return isToday(parseISO(t.dueDate)); } catch { return false; }
    });
    const tomorrowTasks = pending.filter(t => {
      try { return isTomorrow(parseISO(t.dueDate)); } catch { return false; }
    });
    const overdue = pending.filter(t => {
      try { return parseISO(t.dueDate) < new Date() && !isToday(parseISO(t.dueDate)); } catch { return false; }
    });

    if (overdue.length > 0) newAlerts.push(`⚠️ You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}!`);
    if (todayTasks.length > 0) newAlerts.push(`📋 ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} due today: ${todayTasks.map(t => t.taskName).join(', ')}`);
    if (tomorrowTasks.length > 0) newAlerts.push(`🔔 ${tomorrowTasks.length} task${tomorrowTasks.length > 1 ? 's' : ''} due tomorrow`);
    if (pending.length === 0 && taskList.length > 0) newAlerts.push('🎉 All tasks completed! Great job!');

    // Time-based reminders
    pending.forEach(t => {
      if (t.dueTime && isToday(parseISO(t.dueDate))) {
        const [h, m] = t.dueTime.split(':').map(Number);
        const dueDateTime = new Date();
        dueDateTime.setHours(h, m, 0, 0);
        const hoursLeft = differenceInHours(dueDateTime, new Date());
        if (hoursLeft > 0 && hoursLeft <= 2) {
          newAlerts.push(`⏰ "${t.taskName}" is due in ${hoursLeft} hour${hoursLeft > 1 ? 's' : ''}!`);
        }
      }
    });

    setAlerts(newAlerts);
  };

  // Calculate stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyExpenses = expenses.filter(e => {
    try {
      const d = parseISO(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    } catch { return false; }
  });
  const totalExpense = monthlyExpenses.reduce((s, e) => s + e.amount, 0);
  const pendingTasks = tasks.filter(t => !t.isCompleted).length;

  // Pie chart data
  const categoryMap: Record<string, number> = {};
  monthlyExpenses.forEach(e => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });
  const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  // Bar chart - last 7 days
  const barData: { day: string; amount: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const dayLabel = format(d, 'EEE');
    const dayTotal = expenses
      .filter(e => e.date === dateStr)
      .reduce((s, e) => s + e.amount, 0);
    barData.push({ day: dayLabel, amount: dayTotal });
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'} 👋
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 15 }}>
          Here&apos;s your overview for {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* AI Alerts */}
      {alerts.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(124,58,237,0.05))',
          border: '1px solid rgba(37,99,235,0.15)',
          borderRadius: 16, padding: '18px 20px', marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Sparkles size={18} color="#3b82f6" />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#3b82f6' }}>AI Notifications</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {alerts.map((a, i) => (
              <p key={i} style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 }}>{a}</p>
            ))}
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16, marginBottom: 28,
      }}>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Monthly Expenses</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={18} color="#f97316" />
            </div>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800 }}>৳{totalExpense.toLocaleString()}</p>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{monthlyExpenses.length} transactions</p>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Pending Tasks</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckSquare size={18} color="#3b82f6" />
            </div>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800 }}>{pendingTasks}</p>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>of {tasks.length} total tasks</p>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Total Notes</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <StickyNote size={18} color="#7c3aed" />
            </div>
          </div>
          <p style={{ fontSize: 28, fontWeight: 800 }}>{notes.length}</p>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>notes saved</p>
        </div>

        <Link href="/dashboard/chat" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="stat-card pulse-glow" style={{ cursor: 'pointer', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>AI Agent</span>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(124,58,237,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={18} color="#3b82f6" />
              </div>
            </div>
            <p style={{ fontSize: 16, fontWeight: 700 }}>Chat Now</p>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              Ask anything <ArrowRight size={12} />
            </p>
          </div>
        </Link>
      </div>

      {/* Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: 20, marginBottom: 28,
      }}>
        {/* Pie Chart */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Expense by Category</h3>
          {pieData.length > 0 ? (
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[entry.name] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#131b2e', border: '1px solid #1e293b', borderRadius: 10, fontSize: 13 }}
                    formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
              <p>No expense data yet</p>
            </div>
          )}
          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {pieData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: CATEGORY_COLORS[d.name] || '#64748b' }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Last 7 Days Spending</h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#131b2e', border: '1px solid #1e293b', borderRadius: 10, fontSize: 13 }}
                  formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, 'Spent']}
                />
                <Bar dataKey="amount" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 20,
      }}>
        {/* Recent Expenses */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent Expenses</h3>
            <Link href="/dashboard/expenses" style={{ fontSize: 13, color: '#3b82f6', textDecoration: 'none' }}>View All</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {expenses.slice(0, 5).map((e) => (
              <div key={e.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', borderRadius: 10, background: 'rgba(15,23,42,0.5)',
              }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>{e.title}</p>
                  <p style={{ fontSize: 11, color: '#64748b' }}>{e.category} · {e.date}</p>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#f97316' }}>৳{e.amount}</span>
              </div>
            ))}
            {expenses.length === 0 && (
              <p style={{ color: '#475569', fontSize: 14, textAlign: 'center', padding: 20 }}>No expenses yet</p>
            )}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Pending Tasks</h3>
            <Link href="/dashboard/tasks" style={{ fontSize: 13, color: '#3b82f6', textDecoration: 'none' }}>View All</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tasks.filter(t => !t.isCompleted).slice(0, 5).map((t) => (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10, background: 'rgba(15,23,42,0.5)',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: parseISO(t.dueDate) < new Date() ? '#ef4444' : '#3b82f6',
                  boxShadow: parseISO(t.dueDate) < new Date() ? '0 0 8px rgba(239,68,68,0.4)' : 'none',
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>{t.taskName}</p>
                  <p style={{ fontSize: 11, color: '#64748b' }}>Due: {t.dueDate}{t.dueTime ? ` at ${t.dueTime}` : ''}</p>
                </div>
              </div>
            ))}
            {tasks.filter(t => !t.isCompleted).length === 0 && (
              <p style={{ color: '#475569', fontSize: 14, textAlign: 'center', padding: 20 }}>No pending tasks</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
