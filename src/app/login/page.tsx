'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Bot, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, signup, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill all fields');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      if (isSignup) {
        await signup(email, password);
        toast.success('Account created successfully!');
      } else {
        await login(email, password);
        toast.success('Welcome back!');
      }
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.code === 'auth/user-not-found' ? 'No account found'
        : err.code === 'auth/wrong-password' ? 'Incorrect password'
        : err.code === 'auth/email-already-in-use' ? 'Email already in use'
        : err.code === 'auth/invalid-email' ? 'Invalid email'
        : err.message || 'Authentication failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Welcome!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      zIndex: 1,
    }}>
      {/* Decorative orbs */}
      <div style={{
        position: 'absolute', top: '15%', left: '10%', width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', right: '10%', width: 250, height: 250,
        background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div className="fade-in" style={{
        width: '100%', maxWidth: 440,
        background: 'linear-gradient(135deg, rgba(19,27,46,0.9), rgba(10,14,26,0.95))',
        border: '1px solid #1e293b',
        borderRadius: 24, padding: 40,
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(37,99,235,0.05)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(37,99,235,0.3)',
          }}>
            <Bot size={32} color="white" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
            <span className="gradient-text">HC Agent</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            {isSignup ? 'Create your account' : 'Welcome back, sign in to continue'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: 16, position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: 14, top: 14, color: '#64748b' }} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-dark"
              style={{ paddingLeft: 42 }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24, position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: 14, top: 14, color: '#64748b' }} />
            <input
              type={showPwd ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-dark"
              style={{ paddingLeft: 42, paddingRight: 42 }}
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              style={{ position: 'absolute', right: 14, top: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Submit */}
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: 14 }}>
            {loading ? <div className="spinner" style={{ width: 20, height: 20 }} /> : (
              <>
                <Sparkles size={18} />
                {isSignup ? 'Create Account' : 'Sign In'}
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0',
          color: '#475569', fontSize: 13,
        }}>
          <div style={{ flex: 1, height: 1, background: '#1e293b' }} />
          <span>or</span>
          <div style={{ flex: 1, height: 1, background: '#1e293b' }} />
        </div>

        {/* Google Sign In */}
        <button onClick={handleGoogle} disabled={loading} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: 14 }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Toggle */}
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#94a3b8' }}>
          {isSignup ? 'Already have an account?' : "Don't have an account?"}
          {' '}
          <button
            onClick={() => setIsSignup(!isSignup)}
            style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 600 }}
          >
            {isSignup ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
