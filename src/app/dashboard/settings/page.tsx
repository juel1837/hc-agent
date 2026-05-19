'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserSettings, saveUserSettings } from '@/lib/firestore';
import { Settings, Key, MessageSquare, Save, Eye, EyeOff, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    if (!user) return;
    try {
      const s = await getUserSettings(user.uid);
      if (s) { setApiKey(s.apiKey||''); setSystemPrompt(s.systemPrompt||''); setDisplayName(s.displayName||''); }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveUserSettings(user.uid, { apiKey, systemPrompt, displayName });
      toast.success('Settings saved!');
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh' }}><div className="spinner" style={{ width:36,height:36 }} /></div>;

  return (
    <div className="fade-in" style={{ maxWidth:640 }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:24,fontWeight:800,marginBottom:4 }}>Settings</h1>
        <p style={{ color:'#94a3b8',fontSize:14 }}>Configure your AI agent and preferences</p>
      </div>

      <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
        {/* Display Name */}
        <div className="glass-card" style={{ padding:24 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
            <User size={20} color="#3b82f6" />
            <h3 style={{ fontSize:16,fontWeight:700 }}>Profile</h3>
          </div>
          <label style={{ fontSize:13,color:'#94a3b8',marginBottom:6,display:'block' }}>Display Name</label>
          <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your name" className="input-dark" />
        </div>

        {/* API Key */}
        <div className="glass-card" style={{ padding:24 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
            <Key size={20} color="#f97316" />
            <h3 style={{ fontSize:16,fontWeight:700 }}>Gemini API Key</h3>
          </div>
          <label style={{ fontSize:13,color:'#94a3b8',marginBottom:6,display:'block' }}>API Key</label>
          <div style={{ position:'relative' }}>
            <input type={showKey?'text':'password'} value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="AIza..." className="input-dark" style={{ paddingRight:42 }} />
            <button onClick={()=>setShowKey(!showKey)} style={{ position:'absolute',right:12,top:12,background:'none',border:'none',color:'#64748b',cursor:'pointer' }}>
              {showKey?<EyeOff size={18} />:<Eye size={18} />}
            </button>
          </div>
          <p style={{ fontSize:12,color:'#475569',marginTop:8 }}>
            Get your free API key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style={{ color:'#3b82f6' }}>Google AI Studio</a>
          </p>
        </div>

        {/* System Prompt */}
        <div className="glass-card" style={{ padding:24 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
            <MessageSquare size={20} color="#7c3aed" />
            <h3 style={{ fontSize:16,fontWeight:700 }}>System Prompt</h3>
          </div>
          <label style={{ fontSize:13,color:'#94a3b8',marginBottom:6,display:'block' }}>Custom AI Persona</label>
          <textarea value={systemPrompt} onChange={e=>setSystemPrompt(e.target.value)} placeholder="You are HC Agent, a helpful personal AI assistant..." rows={6} className="input-dark" style={{ resize:'vertical',lineHeight:1.7 }} />
          <p style={{ fontSize:12,color:'#475569',marginTop:8 }}>Leave empty to use default persona. This defines how the AI behaves.</p>
        </div>

        {/* Account Info */}
        <div className="glass-card" style={{ padding:24 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
            <Settings size={20} color="#06b6d4" />
            <h3 style={{ fontSize:16,fontWeight:700 }}>Account</h3>
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            <div style={{ display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #1e293b' }}>
              <span style={{ fontSize:13,color:'#94a3b8' }}>Email</span>
              <span style={{ fontSize:13 }}>{user?.email}</span>
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',padding:'8px 0' }}>
              <span style={{ fontSize:13,color:'#94a3b8' }}>UID</span>
              <span style={{ fontSize:13,color:'#475569' }}>{user?.uid?.slice(0,16)}...</span>
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ width:'100%',padding:14 }}>
          {saving?<div className="spinner" style={{ width:20,height:20 }} />:<><Save size={18} /> Save Settings</>}
        </button>
      </div>
    </div>
  );
}
