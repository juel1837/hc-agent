'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getExpenses, addExpense, deleteExpense, getUserSettings } from '@/lib/firestore';
import { autoCategorizeSingle } from '@/lib/gemini';
import type { Expense } from '@/types';
import { EXPENSE_CATEGORIES, CATEGORY_COLORS } from '@/types';
import { Plus, Trash2, Search, Filter, Wallet, Sparkles, X } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterCat, setFilterCat] = useState('All');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [autoCat, setAutoCat] = useState(false);

  useEffect(() => {
    if (user) loadExpenses();
  }, [user]);

  const loadExpenses = async () => {
    if (!user) return;
    try {
      const data = await getExpenses(user.uid);
      setExpenses(data);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoCategory = async () => {
    if (!title.trim() || !user) return;
    setAutoCat(true);
    try {
      const settings = await getUserSettings(user.uid);
      if (settings?.apiKey) {
        const cat = await autoCategorizeSingle(settings.apiKey, title);
        setCategory(cat);
        toast.success(`Auto-categorized as "${cat}"`);
      } else {
        toast.error('Set API key in Settings for auto-categorization');
      }
    } finally {
      setAutoCat(false);
    }
  };

  const handleAdd = async () => {
    if (!title.trim() || !amount || !user) return;
    setAdding(true);
    try {
      await addExpense(user.uid, { title: title.trim(), amount: parseFloat(amount), category, date });
      toast.success('Expense added!');
      setTitle(''); setAmount(''); setCategory('Other'); setDate(format(new Date(), 'yyyy-MM-dd'));
      setShowAdd(false);
      loadExpenses();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    await deleteExpense(user.uid, id);
    toast.success('Deleted');
    loadExpenses();
  };

  const filtered = expenses
    .filter(e => filterCat === 'All' || e.category === filterCat)
    .filter(e => !search || e.title.toLowerCase().includes(search.toLowerCase()));

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>;
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Expenses</h1>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Track and manage your spending</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={18} /> Add Expense
        </button>
      </div>

      {/* Total Banner */}
      <div className="glass-card" style={{ padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Wallet size={22} color="#f97316" />
          <span style={{ fontSize: 15, color: '#94a3b8' }}>Total:</span>
        </div>
        <span style={{ fontSize: 24, fontWeight: 800, color: '#f97316' }}>৳{total.toLocaleString()}</span>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: 13, color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-dark"
            style={{ paddingLeft: 38 }}
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="input-dark"
          style={{ width: 'auto', minWidth: 140, cursor: 'pointer' }}
        >
          <option value="All">All Categories</option>
          {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Expense List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((e) => (
          <div key={e.id} className="glass-card" style={{
            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, borderRadius: 14,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `${CATEGORY_COLORS[e.category] || '#64748b'}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>
              {e.category === 'Food' ? '🍕' : e.category === 'Transport' ? '🚗' : e.category === 'Shopping' ? '🛒' : e.category === 'Entertainment' ? '🎮' : e.category === 'Health' ? '🏥' : e.category === 'Education' ? '📚' : e.category === 'Bills' ? '📄' : e.category === 'Rent' ? '🏠' : e.category === 'Groceries' ? '🥦' : e.category === 'Travel' ? '✈️' : e.category === 'Gift' ? '🎁' : '📦'}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600 }}>{e.title}</p>
              <p style={{ fontSize: 12, color: '#64748b' }}>
                <span style={{ color: CATEGORY_COLORS[e.category] || '#64748b', fontWeight: 500 }}>{e.category}</span> · {e.date}
              </p>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#f97316', marginRight: 8 }}>৳{e.amount.toLocaleString()}</span>
            <button onClick={() => handleDelete(e.id)} className="btn-danger" style={{ padding: 8, borderRadius: 8 }}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: '#475569' }}>
            <Wallet size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>No expenses found</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <>
          <div className="mobile-overlay" onClick={() => setShowAdd(false)} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '90%', maxWidth: 440, zIndex: 60,
            background: 'linear-gradient(135deg, #131b2e, #0f172a)',
            border: '1px solid #1e293b', borderRadius: 20, padding: 28,
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }} className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Add Expense</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Title</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Kacchi Bhai" className="input-dark" style={{ flex: 1 }} />
                  <button onClick={handleAutoCategory} disabled={autoCat || !title.trim()} className="btn-secondary" style={{ padding: '8px 12px' }} title="AI Auto Categorize">
                    {autoCat ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <Sparkles size={16} color="#3b82f6" />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Amount (৳)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="350" className="input-dark" />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-dark" style={{ cursor: 'pointer' }}>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6, display: 'block' }}>Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-dark" />
              </div>
              <button onClick={handleAdd} disabled={adding || !title.trim() || !amount} className="btn-primary" style={{ width: '100%', marginTop: 8 }}>
                {adding ? <div className="spinner" style={{ width: 20, height: 20 }} /> : <><Plus size={18} /> Add Expense</>}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
