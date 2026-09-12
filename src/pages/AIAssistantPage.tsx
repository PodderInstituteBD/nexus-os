import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  ShieldAlert,
  Code2,
  FileText,
  MessageSquare,
  Send,
  Check,
  Copy,
  AlertCircle,
  Plus
} from 'lucide-react';
import { Project, Task } from '../types';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { GeminiChatBot } from '../components/chat/GeminiChatBot';
import { FloatingContainer } from '../components/layout/FloatingContainer';

interface AIAssistantPageProps {
  onTaskCreated?: () => void;
}

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({ onTaskCreated }) => {
  const { activeTeam } = useAuth();
  const [activeTab, setActiveTab] = useState<'decompose' | 'audit' | 'code' | 'docs' | 'chat'>('decompose');
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  // Task Decomposition State
  const [taskTitle, setTaskTitle] = useState('Implement Redis sliding window rate limiting middleware');
  const [taskDesc, setTaskDesc] = useState('Protect microservices from burst traffic with standard RFC 6585 headers.');
  const [targetProjectId, setTargetProjectId] = useState('');
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [decompResult, setDecompResult] = useState<any>(null);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [taskSavedSuccess, setTaskSavedSuccess] = useState(false);

  // Project Audit State
  const [auditProjectId, setAuditProjectId] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  // Code Explainer State
  const [codeSnippet, setCodeSnippet] = useState(
`// Rate limiting token bucket algorithm
export async function checkRateLimit(redis: any, key: string, limit: number, windowSec: number) {
  const now = Date.now();
  const clearBefore = now - (windowSec * 1000);
  await redis.zremrangebyscore(key, 0, clearBefore);
  const currentRequests = await redis.zcard(key);
  if (currentRequests >= limit) {
    return { allowed: false, remaining: 0 };
  }
  await redis.zadd(key, now, now.toString());
  await redis.expire(key, windowSec);
  return { allowed: true, remaining: limit - currentRequests - 1 };
}`
  );
  const [codeLang, setCodeLang] = useState('typescript');
  const [isExplaining, setIsExplaining] = useState(false);
  const [codeResult, setCodeResult] = useState<any>(null);

  // Docs Generator State
  const [docType, setDocType] = useState('API Specification');
  const [docContext, setDocContext] = useState(
    'REST Endpoints for Task Management in NEXUS OS: /api/v1/tasks, supporting filtering by projectId, status, priority, and subtask mutations.'
  );
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState<string | null>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Hello! I am NEXUS AI, powered by Gemini 3.8 Flash. I can help decompose epics into granular subtasks, audit sprint health, review code for OWASP vulnerabilities, and generate technical specifications. How can I assist your engineering sprint today?'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    checkAiStatus();
    loadProjects();
  }, [activeTeam]);

  const checkAiStatus = async () => {
    try {
      const res = await apiRequest('/ai/status');
      setAiStatus(res);
    } catch {
      setAiStatus({ available: false });
    }
  };

  const loadProjects = async () => {
    if (!activeTeam) return;
    try {
      const res = await apiRequest<{ projects: Project[] }>(`/projects?teamId=${activeTeam.id}`);
      setProjects(res.projects);
      if (res.projects.length > 0) {
        setTargetProjectId(res.projects[0].id);
        setAuditProjectId(res.projects[0].id);
      }
    } catch (err) {
      console.error('Failed to load projects', err);
    }
  };

  const handleDecompose = async () => {
    if (!taskTitle.trim()) return;
    setIsDecomposing(true);
    setGeneralError(null);
    setDecompResult(null);
    setTaskSavedSuccess(false);
    try {
      const res = await apiRequest('/ai/decompose-task', {
        method: 'POST',
        body: JSON.stringify({
          title: taskTitle,
          description: taskDesc,
          projectId: targetProjectId
        })
      });
      setDecompResult(res);
    } catch (err: any) {
      setGeneralError(err.message || 'Decomposition failed.');
    } finally {
      setIsDecomposing(false);
    }
  };

  const handleSaveDecomposedTask = async () => {
    if (!decompResult || !targetProjectId || !activeTeam) return;
    setIsSavingTask(true);
    try {
      await apiRequest('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          projectId: targetProjectId,
          teamId: activeTeam.id,
          title: taskTitle,
          description: `${decompResult.summary}\n\nTechnical Considerations:\n${decompResult.technicalConsiderations?.join('\n')}`,
          priority: decompResult.riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM',
          estimatedHours: decompResult.estimatedTotalHours || 4,
          labels: ['ai-decomposed', 'backend'],
          subtasks: decompResult.subtasks || []
        })
      });
      setTaskSavedSuccess(true);
      onTaskCreated?.();
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to save decomposed task.');
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleRunAudit = async () => {
    if (!auditProjectId) return;
    setIsAuditing(true);
    setGeneralError(null);
    setAuditResult(null);
    try {
      const res = await apiRequest('/ai/analyze-project', {
        method: 'POST',
        body: JSON.stringify({ projectId: auditProjectId })
      });
      setAuditResult(res);
    } catch (err: any) {
      setGeneralError(err.message || 'Project audit failed.');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleExplainCode = async () => {
    if (!codeSnippet.trim()) return;
    setIsExplaining(true);
    setGeneralError(null);
    setCodeResult(null);
    try {
      const res = await apiRequest('/ai/explain-code', {
        method: 'POST',
        body: JSON.stringify({ code: codeSnippet, language: codeLang })
      });
      setCodeResult(res);
    } catch (err: any) {
      setGeneralError(err.message || 'Code analysis failed.');
    } finally {
      setIsExplaining(false);
    }
  };

  const handleGenerateDoc = async () => {
    if (!docContext.trim()) return;
    setIsGeneratingDoc(true);
    setGeneralError(null);
    setGeneratedDoc(null);
    try {
      const res = await apiRequest<{ markdown: string }>('/ai/generate-docs', {
        method: 'POST',
        body: JSON.stringify({
          docType,
          context: docContext,
          title: `${docType} - ${new Date().toLocaleDateString()}`
        })
      });
      setGeneratedDoc(res.markdown);
    } catch (err: any) {
      setGeneralError(err.message || 'Doc generation failed.');
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsChatting(true);
    setGeneralError(null);

    try {
      const res = await apiRequest<{ role: 'assistant'; content: string }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: userMsg,
          conversationHistory: chatMessages
        })
      });
      setChatMessages((prev) => [...prev, res]);
    } catch (err: any) {
      setGeneralError(err.message || 'Chat failed.');
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 relative perspective-1000">
      {/* Header wrapped in FloatingContainer */}
      <FloatingContainer
        id="ai-studio-header-container"
        floatDistance={3}
        floatDuration={5.5}
        hoverElevation={true}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
              <Bot className="w-5 h-5 text-purple-600" />
              <span>NEXUS AI Intelligence Studio</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Powered by Google Gemini 3.8 Flash SDK (@google/genai) on secure backend routes.
            </p>
          </div>

          {/* Live SDK Status Badge */}
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs shadow-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                aiStatus?.available ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span className="font-semibold text-slate-700">
              {aiStatus?.available ? 'Gemini 3.8 Flash Ready' : 'API Key Setup Needed'}
            </span>
          </div>
        </div>
      </FloatingContainer>

      {generalError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Tabs with Ambient Float */}
      <div className="bg-white/95 backdrop-blur-sm p-1.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-1 text-xs font-semibold ambient-float-slow card-depth-3d">
        <button
          onClick={() => setActiveTab('decompose')}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-colors ${
            activeTab === 'decompose' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Task Decomposer</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-colors ${
            activeTab === 'audit' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Sprint Health Audit</span>
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-colors ${
            activeTab === 'code' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Code Review & Security</span>
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-colors ${
            activeTab === 'docs' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Docs & Specs Generator</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-colors ${
            activeTab === 'chat' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Engineering Copilot</span>
        </button>
      </div>

      {/* Tab 1: Task Decomposition */}
      {activeTab === 'decompose' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Decompose Feature into Engineering Subtasks</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Project</label>
              <select
                value={targetProjectId}
                onChange={(e) => setTargetProjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Feature / Task Title</label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Implement OAuth2 Refresh Token Rotation"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Scope & Technical Context</label>
              <textarea
                rows={3}
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                placeholder="Details, acceptance criteria, architectural goals..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>

            <button
              onClick={handleDecompose}
              disabled={isDecomposing || !taskTitle.trim()}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isDecomposing ? 'Decomposing with Gemini...' : 'Decompose Feature'}</span>
            </button>
          </div>

          {/* Results Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Decomposition Breakdown</h3>

            {!decompResult ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs text-center border-2 border-dashed border-slate-200 rounded-xl p-6">
                <Sparkles className="w-8 h-8 text-slate-300 mb-2" />
                <span>Enter a task specification and click "Decompose Feature" to see subtasks, risk assessment, and technical considerations.</span>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-700">Estimated Total: {decompResult.estimatedTotalHours} hours</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      decompResult.riskLevel === 'HIGH'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {decompResult.riskLevel} RISK
                  </span>
                </div>

                <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {decompResult.summary}
                </p>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Actionable Subtasks ({decompResult.subtasks?.length || 0})
                  </h4>
                  <div className="space-y-1.5">
                    {decompResult.subtasks?.map((st: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                      >
                        <span className="font-semibold text-slate-800">{st.title}</span>
                        <span className="font-mono text-[10px] text-slate-500">{st.estimatedHours}h</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save to Project Button */}
                <button
                  onClick={handleSaveDecomposedTask}
                  disabled={isSavingTask || taskSavedSuccess}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-2"
                >
                  {taskSavedSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Saved to Project Tasks!</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>{isSavingTask ? 'Saving...' : 'Add as Task to Project'}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Project Audit */}
      {activeTab === 'audit' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sprint Health & Risk Assessment</h3>
              <p className="text-xs text-slate-500">Gemini evaluates active task distributions, bottlenecks, and velocity.</p>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={auditProjectId}
                onChange={(e) => setAuditProjectId(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-semibold"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleRunAudit}
                disabled={isAuditing}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                {isAuditing ? 'Auditing...' : 'Run Audit'}
              </button>
            </div>
          </div>

          {auditResult && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Sprint Health Grade</span>
                <span className="text-base font-black px-2.5 py-0.5 rounded bg-purple-100 text-purple-800">
                  {auditResult.projectHealthGrade}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-mono">{auditResult.executiveSummary}</p>
              <div>
                <span className="text-xs font-bold text-red-700">Bottlenecks & Blockers:</span>
                <ul className="list-disc list-inside text-xs text-slate-600 mt-1 space-y-1">
                  {auditResult.bottlenecks?.map((b: string, i: number) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Code Review */}
      {activeTab === 'code' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Paste Code for Review</h3>
              <select
                value={codeLang}
                onChange={(e) => setCodeLang(e.target.value)}
                className="px-2 py-1 text-xs rounded border border-slate-300 font-mono"
              >
                <option value="typescript">TypeScript</option>
                <option value="java">Java</option>
                <option value="python">Python</option>
                <option value="sql">SQL</option>
              </select>
            </div>
            <textarea
              rows={14}
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              className="w-full p-3 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-purple-500 bg-slate-900 text-slate-100"
            />
            <button
              onClick={handleExplainCode}
              disabled={isExplaining || !codeSnippet.trim()}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              {isExplaining ? 'Analyzing with Gemini...' : 'Review & Audit Code'}
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Review Findings</h3>
            {!codeResult ? (
              <div className="h-64 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400 text-center p-4">
                Click "Review & Audit Code" to detect security flaws, design patterns, and get refactored implementations.
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in max-h-[500px] overflow-y-auto pr-1">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Summary</span>
                  <p className="text-xs text-slate-700 mt-1">{codeResult.summary}</p>
                </div>

                {codeResult.securityAndVulnerabilities?.length > 0 && (
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center space-x-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Security & Edge Cases</span>
                    </span>
                    <ul className="list-disc list-inside text-xs text-slate-700 mt-1 space-y-1 bg-red-50 p-3 rounded-lg border border-red-200">
                      {codeResult.securityAndVulnerabilities.map((v: string, i: number) => (
                        <li key={i}>{v}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {codeResult.refactoredCode && (
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Hardened Code</span>
                    <pre className="p-3 bg-slate-900 text-emerald-300 text-xs rounded-lg overflow-x-auto mt-1 font-mono">
                      {codeResult.refactoredCode}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Docs Generator */}
      {activeTab === 'docs' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 font-semibold"
            >
              <option value="API Specification">API Specification</option>
              <option value="Architectural Decision Record (ADR)">Architectural Decision Record (ADR)</option>
              <option value="Production Incident Runbook">Production Incident Runbook</option>
              <option value="Repository README">Repository README</option>
            </select>
            <input
              type="text"
              value={docContext}
              onChange={(e) => setDocContext(e.target.value)}
              placeholder="Source context, schema details, or parameters..."
              className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
            <button
              onClick={handleGenerateDoc}
              disabled={isGeneratingDoc}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shrink-0"
            >
              {isGeneratingDoc ? 'Generating...' : 'Generate Markdown'}
            </button>
          </div>

          {generatedDoc && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase">Markdown Preview</span>
                <button
                  onClick={() => navigator.clipboard.writeText(generatedDoc)}
                  className="text-xs text-purple-600 hover:text-purple-800 flex items-center space-x-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Markdown</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-900 text-slate-100 text-xs rounded-xl overflow-x-auto font-mono whitespace-pre-wrap max-h-96">
                {generatedDoc}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Engineering Copilot Chat */}
      {activeTab === 'chat' && (
        <div className="h-[620px]">
          <GeminiChatBot />
        </div>
      )}
    </div>
  );
};
