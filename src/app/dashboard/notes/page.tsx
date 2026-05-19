'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getNotes, addNote, updateNote, deleteNote } from '@/lib/firestore';
import type { Note } from '@/types';
import { Plus, Trash2, Edit3, StickyNote, X, Save, Search } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    if (!user) return;
    const data = await getNotes(user.uid);
    setNotes(data);
    setLoading(false);
  };

  const openNew = () => { setEditId(null); setTitle(''); setContent(''); setShowEditor(true); };
  const openEdit = (n: Note) => { setEditId(n.id); setTitle(n.title); setContent(n.content); setShowEditor(true); };

  const handleSave = async () => {
    if (!title.trim() || !user) return;
    setSaving(true);
    try {
      if (editId) { await updateNote(user.uid, editId, { title, content }); toast.success('Updated!'); }
      else { await addNote(user.uid, { title, content }); toast.success('Created!'); }
      setShowEditor(false); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    await deleteNote(user.uid, id); toast.success('Deleted'); load();
  };

  const filtered = notes.filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh' }}><div className="spinner" style={{ width:36,height:36 }} /></div>;

  return (
    <>
      <div className="fade-in">
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12 }}>
        <div><h1 style={{ fontSize:24,fontWeight:800,marginBottom:4 }}>Notes</h1><p style={{ color:'#94a3b8',fontSize:14 }}>Capture your ideas</p></div>
        <button onClick={openNew} className="btn-primary"><Plus size={18} /> New Note</button>
      </div>

      <div style={{ position:'relative',marginBottom:20 }}>
        <Search size={16} style={{ position:'absolute',left:14,top:13,color:'#64748b' }} />
        <input type="text" placeholder="Search notes..." value={search} onChange={e=>setSearch(e.target.value)} className="input-dark" style={{ paddingLeft:38 }} />
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16 }}>
        {filtered.map(n => (
          <div key={n.id} className="glass-card" style={{ padding:20,display:'flex',flexDirection:'column' }}>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:10 }}>
              <h3 style={{ fontSize:16,fontWeight:700,flex:1 }}>{n.title}</h3>
              <div style={{ display:'flex',gap:4 }}>
                <button onClick={()=>openEdit(n)} style={{ background:'none',border:'none',color:'#64748b',cursor:'pointer',padding:4 }}><Edit3 size={14} /></button>
                <button onClick={()=>handleDelete(n.id)} style={{ background:'none',border:'none',color:'#64748b',cursor:'pointer',padding:4 }}><Trash2 size={14} /></button>
              </div>
            </div>
            <p style={{ fontSize:13,color:'#94a3b8',lineHeight:1.6,flex:1,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:4,WebkitBoxOrient:'vertical' as any }}>{n.content||'No content'}</p>
            <p style={{ fontSize:11,color:'#475569',marginTop:12 }}>{format(new Date(n.updatedAt||n.createdAt),'MMM d, yyyy h:mm a')}</p>
          </div>
        ))}
        {filtered.length===0 && <div className="glass-card" style={{ padding:40,textAlign:'center',color:'#475569',gridColumn:'1/-1' }}><StickyNote size={40} style={{ margin:'0 auto 12px',opacity:0.3 }} /><p>No notes found</p></div>}
      </div>

      </div>

      {showEditor && (<>
        <div className="mobile-overlay" onClick={()=>setShowEditor(false)} style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }} />
        <div style={{ position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'90%',maxWidth:560,zIndex:60,background:'linear-gradient(135deg,#131b2e,#0f172a)',border:'1px solid #1e293b',borderRadius:20,padding:28,boxShadow:'0 20px 60px rgba(0,0,0,0.6)' }} className="fade-in">
          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:20 }}>
            <h2 style={{ fontSize:18,fontWeight:700 }}>{editId?'Edit':'New'} Note</h2>
            <button onClick={()=>setShowEditor(false)} style={{ background:'none',border:'none',color:'#64748b',cursor:'pointer' }}><X size={20} /></button>
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
            <div><label style={{ fontSize:13,color:'#94a3b8',marginBottom:6,display:'block' }}>Title</label><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Note title" className="input-dark" /></div>
            <div><label style={{ fontSize:13,color:'#94a3b8',marginBottom:6,display:'block' }}>Content</label><textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Write..." rows={8} className="input-dark" style={{ resize:'vertical',lineHeight:1.7 }} /></div>
            <button onClick={handleSave} disabled={saving||!title.trim()} className="btn-primary" style={{ width:'100%' }}>{saving?<div className="spinner" style={{ width:20,height:20 }} />:<><Save size={18} /> {editId?'Update':'Save'}</>}</button>
          </div>
        </div>
      </>)}
    </>
  );
}
