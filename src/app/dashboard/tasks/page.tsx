'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getTasks, addTask, toggleTask, deleteTask } from '@/lib/firestore';
import type { Task } from '@/types';
import { Plus, Trash2, CheckSquare, Square, X, Clock } from 'lucide-react';
import { format, parseISO, isToday, isPast } from 'date-fns';
import toast from 'react-hot-toast';

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueTime, setDueTime] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [adding, setAdding] = useState(false);

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    if (!user) return;
    const data = await getTasks(user.uid);
    setTasks(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!taskName.trim() || !user) return;
    setAdding(true);
    try {
      await addTask(user.uid, { taskName: taskName.trim(), dueDate, dueTime: dueTime || undefined });
      toast.success('Task added!');
      setTaskName(''); setDueDate(format(new Date(), 'yyyy-MM-dd')); setDueTime('');
      setShowAdd(false); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setAdding(false); }
  };

  const handleToggle = async (t: Task) => {
    if (!user) return;
    await toggleTask(user.uid, t.id, !t.isCompleted);
    toast.success(t.isCompleted ? 'Marked pending' : 'Completed!');
    load();
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    await deleteTask(user.uid, id);
    toast.success('Deleted'); load();
  };

  const filtered = tasks.filter(t => {
    if (filter === 'pending') return !t.isCompleted;
    if (filter === 'completed') return t.isCompleted;
    return true;
  });

  const pending = tasks.filter(t => !t.isCompleted).length;
  const completed = tasks.filter(t => t.isCompleted).length;

  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh' }}><div className="spinner" style={{ width:36,height:36 }} /></div>;

  return (
    <>
      <div className="fade-in">
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12 }}>
        <div><h1 style={{ fontSize:24,fontWeight:800,marginBottom:4 }}>Tasks</h1><p style={{ color:'#94a3b8',fontSize:14 }}>Manage your to-do list</p></div>
        <button onClick={()=>setShowAdd(true)} className="btn-primary"><Plus size={18} /> Add Task</button>
      </div>

      {/* Stats */}
      <div style={{ display:'flex',gap:12,marginBottom:20,flexWrap:'wrap' }}>
        <div className="glass-card" style={{ padding:'14px 20px',flex:1,minWidth:140,textAlign:'center' }}>
          <p style={{ fontSize:24,fontWeight:800,color:'#3b82f6' }}>{pending}</p>
          <p style={{ fontSize:12,color:'#64748b' }}>Pending</p>
        </div>
        <div className="glass-card" style={{ padding:'14px 20px',flex:1,minWidth:140,textAlign:'center' }}>
          <p style={{ fontSize:24,fontWeight:800,color:'#22c55e' }}>{completed}</p>
          <p style={{ fontSize:12,color:'#64748b' }}>Completed</p>
        </div>
        <div className="glass-card" style={{ padding:'14px 20px',flex:1,minWidth:140,textAlign:'center' }}>
          <p style={{ fontSize:24,fontWeight:800 }}>{tasks.length}</p>
          <p style={{ fontSize:12,color:'#64748b' }}>Total</p>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display:'flex',gap:8,marginBottom:20 }}>
        {(['all','pending','completed'] as const).map(f => (
          <button key={f} onClick={()=>setFilter(f)} style={{
            padding:'8px 18px',borderRadius:10,fontSize:13,fontWeight:500,cursor:'pointer',border:'1px solid',transition:'all 0.2s',textTransform:'capitalize',
            background: filter===f ? 'rgba(37,99,235,0.15)' : 'transparent',
            borderColor: filter===f ? 'rgba(37,99,235,0.3)' : '#1e293b',
            color: filter===f ? '#3b82f6' : '#94a3b8',
          }}>{f}</button>
        ))}
      </div>

      {/* Task List */}
      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
        {filtered.map(t => {
          const overdue = !t.isCompleted && isPast(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate));
          const today = isToday(parseISO(t.dueDate));
          return (
            <div key={t.id} className="glass-card" style={{ padding:'14px 18px',display:'flex',alignItems:'center',gap:14,borderRadius:14,opacity:t.isCompleted?0.6:1 }}>
              <button onClick={()=>handleToggle(t)} style={{ background:'none',border:'none',cursor:'pointer',color: t.isCompleted?'#22c55e':'#475569',display:'flex' }}>
                {t.isCompleted ? <CheckSquare size={22} /> : <Square size={22} />}
              </button>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:14,fontWeight:600,textDecoration:t.isCompleted?'line-through':'none',color:t.isCompleted?'#64748b':'#f1f5f9' }}>{t.taskName}</p>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginTop:4 }}>
                  <Clock size={12} color={overdue?'#ef4444':today?'#f97316':'#64748b'} />
                  <span style={{ fontSize:12,color:overdue?'#ef4444':today?'#f97316':'#64748b' }}>
                    {overdue?'Overdue: ':today?'Today: ':''}{t.dueDate}{t.dueTime?` at ${t.dueTime}`:''}
                  </span>
                </div>
              </div>
              <button onClick={()=>handleDelete(t.id)} className="btn-danger" style={{ padding:8,borderRadius:8 }}><Trash2 size={16} /></button>
            </div>
          );
        })}
        {filtered.length===0 && <div className="glass-card" style={{ padding:40,textAlign:'center',color:'#475569' }}><CheckSquare size={40} style={{ margin:'0 auto 12px',opacity:0.3 }} /><p>No tasks found</p></div>}
      </div>

      </div>

      {/* Add Modal */}
      {showAdd && (<>
        <div className="mobile-overlay" onClick={()=>setShowAdd(false)} style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }} />
        <div style={{ position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'90%',maxWidth:440,zIndex:60,background:'linear-gradient(135deg,#131b2e,#0f172a)',border:'1px solid #1e293b',borderRadius:20,padding:28,boxShadow:'0 20px 60px rgba(0,0,0,0.6)' }} className="fade-in">
          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:20 }}>
            <h2 style={{ fontSize:18,fontWeight:700 }}>Add Task</h2>
            <button onClick={()=>setShowAdd(false)} style={{ background:'none',border:'none',color:'#64748b',cursor:'pointer' }}><X size={20} /></button>
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
            <div><label style={{ fontSize:13,color:'#94a3b8',marginBottom:6,display:'block' }}>Task Name</label><input value={taskName} onChange={e=>setTaskName(e.target.value)} placeholder="e.g. Client Meeting" className="input-dark" /></div>
            <div><label style={{ fontSize:13,color:'#94a3b8',marginBottom:6,display:'block' }}>Due Date</label><input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} className="input-dark" /></div>
            <div><label style={{ fontSize:13,color:'#94a3b8',marginBottom:6,display:'block' }}>Due Time (optional)</label><input type="time" value={dueTime} onChange={e=>setDueTime(e.target.value)} className="input-dark" /></div>
            <button onClick={handleAdd} disabled={adding||!taskName.trim()} className="btn-primary" style={{ width:'100%',marginTop:8 }}>{adding?<div className="spinner" style={{ width:20,height:20 }} />:<><Plus size={18} /> Add Task</>}</button>
          </div>
        </div>
      </>)}
    </>
  );
}
