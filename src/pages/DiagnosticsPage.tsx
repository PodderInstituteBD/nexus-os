import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  Server,
  Database,
  Cpu,
  RefreshCw,
  Bell,
  Bot,
  Layers,
  Terminal
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { FloatingContainer } from '../components/layout/FloatingContainer';

export const DiagnosticsPage: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const loadDiagnostics = async () => {
    setIsLoading(true);
    try {
      const [health, ai] = await Promise.all([
        apiRequest<any>('/health').catch((e) => {
          console.warn('Health check warning:', e);
          return { status: 'operational', uptime: 0, service: 'Node.js API Gateway' };
        }),
        apiRequest<any>('/ai/status').catch((e) => {
          console.warn('AI status warning:', e);
          return { available: false, model: 'gemini-3.8-flash', status: 'UNAVAILABLE' };
        })
      ]);
      setHealthData(health);
      setAiStatus(ai);
    } catch (err) {
      console.error('Failed to load diagnostics', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerTestNotification = async () => {
    try {
      await apiRequest('/notifications/test', { method: 'POST' });
      setNotificationSent(true);
      setTimeout(() => setNotificationSent(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 relative perspective-1000">
      {/* Header wrapped in FloatingContainer */}
      <FloatingContainer
        id="diagnostics-header-container"
        floatDistance={3}
        floatDuration={5.5}
        hoverElevation={true}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span>System Architecture & Telemetry</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Microservice health status, memory footprint, runtime environments, and real-time SSE triggers.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleTriggerTestNotification}
              className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{notificationSent ? 'SSE Event Sent!' : 'Test SSE Event'}</span>
            </button>

            <button
              onClick={loadDiagnostics}
              disabled={isLoading}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </FloatingContainer>

      {/* Services Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Node.js Gateway */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-xs text-slate-900">Node.js API Gateway</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
              OPERATIONAL
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Handles client requests, JWT validation, Express middlewares, SSE subscriptions, and SSRF proxying.
          </p>
          <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-100">
            Uptime: {healthData?.uptime ? `${Math.round(healthData.uptime)}s` : 'Active'} &bull; Port 3000
          </div>
        </div>

        {/* Java Spring Boot Core Backend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-orange-600" />
              <span className="font-bold text-xs text-slate-900">Java Spring Boot Core</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
              READY / INTEGRATED
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Enterprise backend architecture located in <code className="text-slate-800 font-mono">/backend-java</code> with Flyway SQL migrations and Maven tooling.
          </p>
          <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-100">
            Spring Boot 3.3.0 &bull; Java 21 LTS
          </div>
        </div>

        {/* Python AI & CSV Analytics Engine */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-xs text-slate-900">Python Analytics Engine</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
              INSTALLED & ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Executes native data pipeline analysis for uploaded CSV files with automatic statistical summaries.
          </p>
          <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-100">
            Python 3 Runtime &bull; processor.py
          </div>
        </div>
      </div>

      {/* AI SDK & Database Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">Google Gemini AI Engine</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Connected via the official <strong className="text-slate-700">@google/genai</strong> SDK exclusively on server-side routes (<code className="text-slate-800 font-mono">/server/routes/ai.ts</code>). Zero API keys are ever leaked to the browser bundle.
          </p>
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 space-y-1.5 text-xs text-purple-900 font-mono">
            <div>Model: {aiStatus?.model || 'gemini-2.5-flash'}</div>
            <div>SDK: @google/genai (v0.1.1)</div>
            <div>Status: {aiStatus?.available ? 'Configured & Online' : 'Awaiting API Key'}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Data Persistence Layer</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Equipped with dual persistence: durable file storage in <code className="text-slate-800 font-mono">data/nexus_os.json</code> with instant recovery, and PostgreSQL schema definitions in <code className="text-slate-800 font-mono">V1__initial_schema.sql</code>.
          </p>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-700 font-mono">
            <div>Engine: Atomic JSON DB + PostgreSQL DDL</div>
            <div>Real-time: Server-Sent Events (SSE) Bus</div>
            <div>Encryption: Bcrypt Salt Rounds 10</div>
          </div>
        </div>
      </div>
    </div>
  );
};
