import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  Trash2,
  Settings2,
  Zap,
  Shield,
  Code2,
  CheckCircle2,
  Clock,
  Layers,
  Cpu,
  RefreshCw,
  Copy,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import {
  db as firestoreDb,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  handleFirestoreError,
  OperationType
} from '../../lib/firebase';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'model' | 'system';
  content: string;
  modelUsed?: string;
  rolePreset?: string;
  timestamp?: string;
}

interface ThreadSummary {
  id: string;
  title: string;
  model: string;
  rolePreset: string;
  updatedAt: string;
}

const MODEL_OPTIONS = [
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    speed: 'Balanced & High Intelligence',
    tag: 'General Tasks',
    badge: 'Standard',
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro Preview',
    speed: 'Deep Reasoning & Architecture',
    tag: 'Complex Engineering',
    badge: 'Pro Tier',
    color: 'from-purple-600 to-pink-600'
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    speed: 'Near-Zero Latency',
    tag: 'Fast Responses',
    badge: 'Ultra Fast',
    color: 'from-emerald-500 to-teal-600'
  }
];

const ROLE_PRESETS = [
  {
    id: 'ARCHITECT',
    name: 'Systems Architect',
    description: 'Microservices, distributed systems, clean code, DDD',
    icon: Layers,
    accent: 'text-blue-400 bg-blue-500/10 border-blue-500/30'
  },
  {
    id: 'CODER',
    name: 'Full-Stack Specialist',
    description: 'React 19, TypeScript, Spring Boot, modern APIs',
    icon: Code2,
    accent: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
  },
  {
    id: 'SECURITY_AUDITOR',
    name: 'Security & OWASP Auditor',
    description: 'Pen-testing, token forgery defense, vulnerability scanning',
    icon: Shield,
    accent: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
  },
  {
    id: 'DATA_ENGINEER',
    name: 'Data & DB Engineer',
    description: 'PostgreSQL schema tuning, indexing, Redis caching',
    icon: Cpu,
    accent: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
  }
];

export const GeminiChatBot: React.FC = () => {
  const { user, firebaseUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Welcome to NEXUS Spatial Intelligence. I am your multi-turn Gemini autonomous copilot, with Firestore persistent threads and role specialization. How can I assist your engineering sprint today?',
      modelUsed: 'gemini-3.5-flash',
      rolePreset: 'ARCHITECT',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash');
  const [selectedRole, setSelectedRole] = useState<string>('ARCHITECT');
  const [currentThreadId, setCurrentThreadId] = useState<string>('default-sprint-copilot');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [customRoleInstruction, setCustomRoleInstruction] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of thread on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Real-time Firestore synchronization for messages when user is signed into Firebase
  useEffect(() => {
    if (!firebaseUser || !currentThreadId) return;

    try {
      const messagesRef = collection(
        firestoreDb,
        'users',
        firebaseUser.uid,
        'chatThreads',
        currentThreadId,
        'messages'
      );
      const q = query(messagesRef, orderBy('createdAt', 'asc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const loaded: ChatMessage[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              role: data.role,
              content: data.content,
              modelUsed: data.modelUsed,
              rolePreset: data.rolePreset,
              timestamp: data.createdAt ? new Date(data.createdAt).toLocaleTimeString() : undefined
            };
          });
          setMessages(loaded);
        }
      }, (err) => {
        console.warn('Firestore snapshot notice:', err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Could not bind real-time Firestore chat stream:', e);
    }
  }, [firebaseUser, currentThreadId]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isGenerating) return;

    const userText = inputText.trim();
    setInputText('');
    const userMsg: ChatMessage = {
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString()
    };

    // Optimistic UI state
    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);

    // Persist user message to Firestore if connected
    if (firebaseUser && currentThreadId) {
      try {
        const threadDocRef = doc(firestoreDb, 'users', firebaseUser.uid, 'chatThreads', currentThreadId);
        await setDoc(threadDocRef, {
          id: currentThreadId,
          userId: firebaseUser.uid,
          title: userText.slice(0, 40) + '...',
          model: selectedModel,
          rolePreset: selectedRole,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        const messagesColRef = collection(firestoreDb, 'users', firebaseUser.uid, 'chatThreads', currentThreadId, 'messages');
        await addDoc(messagesColRef, {
          threadId: currentThreadId,
          userId: firebaseUser.uid,
          role: 'user',
          content: userText,
          createdAt: new Date().toISOString()
        });
      } catch (fErr) {
        console.warn('Firestore optimistic write bypassed:', fErr);
      }
    }

    try {
      // Backend multi-turn Gemini invocation
      const res = await apiRequest<{
        role: 'assistant';
        content: string;
        modelUsed: string;
        rolePreset: string;
        timestamp: string;
      }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: userText,
          conversationHistory: messages.slice(-12),
          modelPreference: selectedModel,
          rolePreset: selectedRole,
          customSystemInstruction: customRoleInstruction || undefined
        })
      });

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: res.content,
        modelUsed: res.modelUsed || selectedModel,
        rolePreset: res.rolePreset || selectedRole,
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Save assistant message to Firestore
      if (firebaseUser && currentThreadId) {
        try {
          const messagesColRef = collection(firestoreDb, 'users', firebaseUser.uid, 'chatThreads', currentThreadId, 'messages');
          await addDoc(messagesColRef, {
            threadId: currentThreadId,
            userId: firebaseUser.uid,
            role: 'model',
            content: res.content,
            modelUsed: res.modelUsed || selectedModel,
            rolePreset: res.rolePreset || selectedRole,
            createdAt: new Date().toISOString()
          });
        } catch (fErr) {
          console.warn('Firestore assistant write warning:', fErr);
        }
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: `AI Error: ${err.message || 'Failed to communicate with Gemini API. Ensure GEMINI_API_KEY is configured.'}`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearThread = async () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Thread cleared. Fresh conversation context initialized.',
        modelUsed: selectedModel,
        rolePreset: selectedRole,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  const currentRoleObj = ROLE_PRESETS.find((r) => r.id === selectedRole) || ROLE_PRESETS[0];
  const RoleIcon = currentRoleObj.icon;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden relative ambient-grid-bg perspective-1000 ambient-float-gentle">
      {/* 3D Depth Glow Atmosphere with Slow Floating Motion */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10 ambient-float-slow ambient-pulse-glow" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10 ambient-float-reverse" />

      {/* Top 3D Control Bar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/90 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25 border border-white/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-black text-white tracking-wide">GEMINI MULTI-TURN STUDIO</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Real-Time Depth</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Firestore Cloud Persisted &bull; Dynamic Role Personas
            </p>
          </div>
        </div>

        {/* Model & Role Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Model Selector Pill */}
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 shadow-inner">
            {MODEL_OPTIONS.map((m) => {
              const active = selectedModel === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  title={`${m.name} - ${m.tag} (${m.speed})`}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all duration-200 cursor-pointer flex items-center space-x-1.5 ${
                    active
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Zap className={`w-3 h-3 ${active ? 'text-amber-300' : 'text-slate-500'}`} />
                  <span>{m.name.replace('Gemini ', '')}</span>
                </button>
              );
            })}
          </div>

          {/* Role Persona Badge Dropdown Toggle */}
          <button
            onClick={() => setIsConfigOpen((prev) => !prev)}
            className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold flex items-center space-x-2 text-slate-200 cursor-pointer shadow-xs transition-colors"
          >
            <RoleIcon className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-mono">{currentRoleObj.name}</span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isConfigOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Clear Thread */}
          <button
            onClick={handleClearThread}
            title="Reset conversation context"
            className="p-2 bg-slate-900/80 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 border border-slate-700/80 rounded-xl text-slate-400 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable Role Persona Configuration Drawer */}
      <AnimatePresence>
        {isConfigOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="bg-slate-900/95 border-b border-slate-800 p-4 space-y-3 z-10"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                <Settings2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Specialized System Persona & Roles</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Dictates Gemini system instructions & reasoning style
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {ROLE_PRESETS.map((rp) => {
                const isSel = selectedRole === rp.id;
                const Icon = rp.icon;
                return (
                  <div
                    key={rp.id}
                    onClick={() => setSelectedRole(rp.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                      isSel
                        ? 'bg-purple-950/40 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <Icon className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold">{rp.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-snug">{rp.description}</p>
                  </div>
                );
              })}
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Custom System Override (Optional):
              </label>
              <input
                type="text"
                value={customRoleInstruction}
                onChange={(e) => setCustomRoleInstruction(e.target.value)}
                placeholder="e.g. You are analyzing production Kubernetes cluster latency anomalies and zero-trust IAM tokens..."
                className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700/80 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Stream Container with 3D Depth Motion */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 preserve-3d">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const isSystem = msg.role === 'system';

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}
              >
                <div
                  className={`max-w-3xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed relative card-depth-3d ${
                    isUser
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs shadow-lg shadow-blue-600/20'
                      : isSystem
                      ? 'bg-rose-950/60 border border-rose-800 text-rose-200 rounded-bl-xs'
                      : 'glass-panel text-slate-100 rounded-bl-xs border border-slate-800 shadow-xl'
                  }`}
                >
                  {/* Meta tag headers for Assistant messages */}
                  {!isUser && !isSystem && (
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-[10px] font-mono text-slate-400">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-purple-400 flex items-center space-x-1">
                          <Bot className="w-3 h-3" />
                          <span>NEXUS COGNITIVE</span>
                        </span>
                        <span>&bull;</span>
                        <span className="px-1.5 py-0.5 rounded-sm bg-slate-800 text-slate-300 font-semibold">
                          {msg.modelUsed || selectedModel}
                        </span>
                        <span>&bull;</span>
                        <span className="text-slate-400">{msg.rolePreset || selectedRole}</span>
                      </div>

                      <button
                        onClick={() => copyToClipboard(msg.content, index)}
                        className="opacity-60 hover:opacity-100 transition-opacity flex items-center space-x-1 text-slate-300 cursor-pointer"
                        title="Copy message"
                      >
                        {copiedIndex === index ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Message Body */}
                  <div className="whitespace-pre-wrap font-sans text-slate-100 selection:bg-purple-500 selection:text-white">
                    {msg.content}
                  </div>

                  {/* Timestamp Footer */}
                  {msg.timestamp && (
                    <div className="mt-2 text-[9px] font-mono text-right opacity-50 flex items-center justify-end space-x-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{msg.timestamp}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Live Typing / Thinking Animation */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="glass-panel p-3.5 rounded-2xl rounded-bl-xs border border-purple-500/30 flex items-center space-x-3 text-xs text-purple-300 shadow-lg shadow-purple-500/10">
              <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
              <span className="font-mono">
                {selectedModel === 'gemini-3.1-pro-preview'
                  ? 'Gemini 3.1 Pro is performing multi-layer architectural reasoning...'
                  : selectedModel === 'gemini-3.1-flash-lite'
                  ? 'Gemini 3.1 Flash Lite synthesizing real-time response...'
                  : 'Gemini 3.5 Flash streaming response...'}
              </span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Message Input Form */}
      <div className="glass-panel p-3 sm:p-4 border-t border-slate-800/90 z-10">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask ${currentRoleObj.name} with ${selectedModel} (e.g. Design a high-throughput event buffer)...`}
              disabled={isGenerating}
              className="w-full pl-4 pr-10 py-3 text-xs sm:text-sm bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-inner font-sans"
            />
            <div className="absolute right-3 top-3 text-[10px] font-mono text-slate-500">
              Enter ↵
            </div>
          </div>

          <button
            type="submit"
            disabled={isGenerating || !inputText.trim()}
            className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/30 transition-all duration-200 flex items-center space-x-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Dispatch</span>
          </button>
        </form>

        <div className="flex items-center justify-between mt-2 px-1 text-[10px] font-mono text-slate-500">
          <span>Model: <strong className="text-slate-300">{selectedModel}</strong></span>
          <span>Role: <strong className="text-purple-400">{selectedRole}</strong></span>
          <span>Persistence: <strong className="text-emerald-400">Firestore Live</strong></span>
        </div>
      </div>
    </div>
  );
};
