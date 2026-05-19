'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getChatSessions, createChatSession, deleteChatSession,
  getChatMessages, addChatMessage, getUserSettings,
} from '@/lib/firestore';
import { sendChatMessage } from '@/lib/gemini';
import type { ChatSession, ChatMessage } from '@/types';
import { PROMPT_TEMPLATES } from '@/types';
import ReactMarkdown from 'react-markdown';
import {
  Send, Plus, Trash2, Image as ImageIcon, Bot,
  MessageSquare, Loader2, Sparkles, X, ChevronLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [apiKey, setApiKeyState] = useState('');
  const [systemPrompt, setSystemPromptState] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    loadSessions();
    loadSettings();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSessions = async () => {
    if (!user) return;
    const s = await getChatSessions(user.uid);
    setSessions(s);
  };

  const loadSettings = async () => {
    if (!user) return;
    const settings = await getUserSettings(user.uid);
    if (settings) {
      setApiKeyState(settings.apiKey || '');
      setSystemPromptState(settings.systemPrompt || '');
    }
  };

  const loadMessages = async (chatId: string) => {
    if (!user) return;
    const msgs = await getChatMessages(user.uid, chatId);
    setMessages(msgs);
  };

  const selectChat = (chatId: string) => {
    setActiveChat(chatId);
    loadMessages(chatId);
    setShowMobileSidebar(false);
  };

  const createNewChat = async () => {
    if (!user) return;
    const id = await createChatSession(user.uid, 'New Chat');
    await loadSessions();
    selectChat(id);
  };

  const deleteChat = async (chatId: string) => {
    if (!user) return;
    await deleteChatSession(user.uid, chatId);
    if (activeChat === chatId) {
      setActiveChat(null);
      setMessages([]);
    }
    loadSessions();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      const base64 = result.split(',')[1];
      setImageBase64(base64);
      setImageMime(file.type);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    setImageMime(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if (!input.trim() && !imageBase64) return;
    if (!apiKey) {
      toast.error('Please set your Gemini API key in Settings');
      return;
    }
    if (!user) return;

    let chatId = activeChat;
    if (!chatId) {
      chatId = await createChatSession(user.uid, input.slice(0, 40) || 'Image Analysis');
      setActiveChat(chatId);
      await loadSessions();
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      imageUrl: imagePreview || undefined,
      createdAt: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    await addChatMessage(user.uid, chatId, userMsg);

    const currentInput = input;
    const currentImageBase64 = imageBase64;
    const currentImageMime = imageMime;
    setInput('');
    removeImage();
    setSending(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const reply = await sendChatMessage(
        apiKey, systemPrompt, history,
        currentInput, user.uid,
        currentImageBase64 || undefined,
        currentImageMime || undefined,
      );

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        createdAt: Date.now(),
      };

      setMessages(prev => [...prev, aiMsg]);
      await addChatMessage(user.uid, chatId, aiMsg);

      // Update session title from first user message
      if (messages.length === 0 && currentInput) {
        const { updateChatSession } = await import('@/lib/firestore');
        await updateChatSession(user.uid, chatId, { title: currentInput.slice(0, 50) });
        loadSessions();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to get response');
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Error: ${err.message || 'Failed to get response from AI'}`,
        createdAt: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const applyTemplate = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 48px)', gap: 0, margin: '-24px -32px', position: 'relative' }}>
      {/* Chat History Sidebar */}
      {showMobileSidebar && <div className="mobile-overlay" onClick={() => setShowMobileSidebar(false)} style={{ zIndex: 45 }} />}
      <div style={{
        width: 280, minWidth: 280,
        background: 'linear-gradient(180deg, #0c1220, #0a0e1a)',
        borderRight: '1px solid #1e293b',
        display: 'flex', flexDirection: 'column',
        transition: 'transform 0.3s ease',
        zIndex: 46,
      }}
        className={`chat-sidebar ${showMobileSidebar ? 'chat-sidebar-open' : ''}`}
      >
        <div style={{ padding: 16 }}>
          <button onClick={createNewChat} className="btn-primary" style={{ width: '100%', padding: 12, fontSize: 13 }}>
            <Plus size={18} /> New Chat
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px' }}>
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => selectChat(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                marginBottom: 4,
                background: activeChat === s.id ? 'rgba(37,99,235,0.1)' : 'transparent',
                border: activeChat === s.id ? '1px solid rgba(37,99,235,0.15)' : '1px solid transparent',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { if (activeChat !== s.id) e.currentTarget.style.background = 'rgba(15,23,42,0.5)'; }}
              onMouseLeave={(e) => { if (activeChat !== s.id) e.currentTarget.style.background = 'transparent'; }}
            >
              <MessageSquare size={16} color="#64748b" />
              <span style={{ flex: 1, fontSize: 13, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.title}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteChat(s.id); }}
                style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <p style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: 20 }}>No chat history</p>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Chat Header */}
        <div style={{
          padding: '14px 24px', borderBottom: '1px solid #1e293b',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <button
            onClick={() => setShowMobileSidebar(true)}
            className="chat-mobile-toggle"
            style={{ display: 'none', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <ChevronLeft size={22} />
          </button>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={18} color="white" />
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>HC Agent</h3>
            <p style={{ fontSize: 11, color: '#64748b' }}>Powered by Gemini 2.5 Flash</p>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.length === 0 && !activeChat && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(124,58,237,0.1))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 30px rgba(37,99,235,0.15)',
              }}>
                <Sparkles size={32} color="#3b82f6" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>How can I help you today?</h2>
                <p style={{ color: '#64748b', fontSize: 14, maxWidth: 400 }}>
                  I can manage your expenses, notes & tasks. Upload receipts, analyze budgets, or just chat!
                </p>
              </div>
              {/* Prompt Templates */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 600, marginTop: 8 }}>
                {PROMPT_TEMPLATES.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => applyTemplate(t.prompt)}
                    style={{
                      background: 'rgba(19,27,46,0.8)',
                      border: '1px solid #1e293b',
                      borderRadius: 12, padding: '10px 16px',
                      color: '#94a3b8', fontSize: 13,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(37,99,235,0.3)';
                      e.currentTarget.style.color = '#e2e8f0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#1e293b';
                      e.currentTarget.style.color = '#94a3b8';
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={msg.id || i} className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
              {msg.imageUrl && (
                <img
                  src={msg.imageUrl}
                  alt="Uploaded"
                  style={{ maxWidth: 300, maxHeight: 200, borderRadius: 10, marginBottom: 8 }}
                />
              )}
              {msg.role === 'assistant' ? (
                <div className="markdown-content">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p style={{ fontSize: 14, lineHeight: 1.6 }}>{msg.content}</p>
              )}
            </div>
          ))}

          {sending && (
            <div className="chat-bubble-ai" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Loader2 size={18} className="spinner" style={{ border: 'none', borderTop: 'none' }} />
              <span style={{ fontSize: 14, color: '#94a3b8' }}>Thinking...</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', animation: 'pulse-glow 1s ease-in-out infinite' }} />
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', animation: 'pulse-glow 1s ease-in-out 0.2s infinite' }} />
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', animation: 'pulse-glow 1s ease-in-out 0.4s infinite' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div style={{ padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <img src={imagePreview} alt="Preview" style={{ height: 60, borderRadius: 8, border: '1px solid #1e293b' }} />
              <button
                onClick={removeImage}
                style={{
                  position: 'absolute', top: -6, right: -6,
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#ef4444', border: 'none', color: 'white',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #1e293b' }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 10,
            background: '#0f172a', border: '1px solid #1e293b',
            borderRadius: 16, padding: '8px 12px',
            transition: 'border-color 0.2s',
          }}>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'none', border: 'none', color: '#64748b',
                cursor: 'pointer', padding: 8, borderRadius: 8,
              }}
              title="Upload image"
            >
              <ImageIcon size={20} />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything or give a command..."
              rows={1}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                color: '#f1f5f9', fontSize: 14, resize: 'none',
                outline: 'none', maxHeight: 120, lineHeight: '1.5',
                fontFamily: 'Inter, sans-serif',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
            <button
              onClick={handleSend}
              disabled={sending || (!input.trim() && !imageBase64)}
              className="btn-primary"
              style={{ padding: '8px 12px', borderRadius: 10, minWidth: 'auto' }}
            >
              <Send size={18} />
            </button>
          </div>
          <p style={{ fontSize: 11, color: '#475569', textAlign: 'center', marginTop: 8 }}>
            HC Agent can read & write your data. Press Enter to send, Shift+Enter for new line.
          </p>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .chat-sidebar {
            position: fixed !important;
            left: 0;
            top: 0;
            bottom: 0;
            z-index: 46;
            transform: translateX(-100%);
          }
          .chat-sidebar-open {
            transform: translateX(0) !important;
          }
          .chat-mobile-toggle {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
