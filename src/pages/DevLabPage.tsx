import React, { useState } from 'react';
import {
  Wrench,
  Globe,
  Hash,
  KeyRound,
  FileCode,
  Regex,
  Play,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { FloatingContainer } from '../components/layout/FloatingContainer';

export const DevLabPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'proxy' | 'crypto' | 'jwt' | 'json' | 'regex'>('proxy');

  // SSRF Proxy State
  const [proxyUrl, setProxyUrl] = useState('https://httpbin.org/get');
  const [proxyMethod, setProxyMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [proxyHeaders, setProxyHeaders] = useState('{\n  "Accept": "application/json"\n}');
  const [proxyBody, setProxyBody] = useState('');
  const [proxyResult, setProxyResult] = useState<any>(null);
  const [isProxyLoading, setIsProxyLoading] = useState(false);
  const [proxyError, setProxyError] = useState<string | null>(null);

  // Crypto / Hash State
  const [hashInput, setHashInput] = useState('Hello NEXUS OS');
  const [hashResult, setHashResult] = useState<any>(null);
  const [isHashing, setIsHashing] = useState(false);

  // JWT Decoder State
  const [jwtInput, setJwtInput] = useState(
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsIm5hbWUiOiJBbGV4IENoZW4iLCJyb2xlIjoiRU5HSU5FRVIiLCJpYXQiOjE2ODAwMDAwMDAsImV4cCI6MTcxMTU4NDAwMH0.sampleSignature'
  );
  const [jwtDecoded, setJwtDecoded] = useState<any>(null);

  // JSON Formatter State
  const [rawJson, setRawJson] = useState('{"nexus":"operating system","version":1.0,"features":["api","kanban","gemini"]}');
  const [formattedJson, setFormattedJson] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Regex State
  const [regexPattern, setRegexPattern] = useState('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$');
  const [regexFlags, setRegexFlags] = useState('i');
  const [regexText, setRegexText] = useState('alex.chen@nexus-os.internal\ninvalid-email@\nsarah.tan@cloud.io');
  const [regexMatches, setRegexMatches] = useState<string[]>([]);

  // Execute Proxy Call
  const handleExecuteProxy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProxyLoading(true);
    setProxyError(null);
    setProxyResult(null);

    let parsedHeaders = {};
    try {
      if (proxyHeaders.trim()) {
        parsedHeaders = JSON.parse(proxyHeaders);
      }
    } catch {
      setProxyError('Headers must be valid JSON');
      setIsProxyLoading(false);
      return;
    }

    try {
      const res = await apiRequest('/devlab/proxy', {
        method: 'POST',
        body: JSON.stringify({
          url: proxyUrl,
          method: proxyMethod,
          headers: parsedHeaders,
          body: proxyBody.trim() ? proxyBody : undefined
        })
      });
      setProxyResult(res);
    } catch (err: any) {
      setProxyError(err.message || 'Request failed.');
    } finally {
      setIsProxyLoading(false);
    }
  };

  // Execute Hash Generation
  const handleGenerateHashes = async () => {
    setIsHashing(true);
    try {
      const res = await apiRequest('/devlab/hash', {
        method: 'POST',
        body: JSON.stringify({ text: hashInput })
      });
      setHashResult(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsHashing(false);
    }
  };

  // Decode JWT Locally
  const handleDecodeJwt = () => {
    try {
      const parts = jwtInput.trim().split('.');
      if (parts.length < 2) throw new Error('JWT must have at least 2 dot-separated parts');
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      setJwtDecoded({ header, payload });
    } catch (err: any) {
      setJwtDecoded({ error: err.message });
    }
  };

  // Format JSON
  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(rawJson);
      setFormattedJson(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message);
    }
  };

  // Test Regex
  const handleTestRegex = () => {
    try {
      const re = new RegExp(regexPattern, regexFlags);
      const lines = regexText.split('\n');
      const matches: string[] = [];
      lines.forEach((line) => {
        if (re.test(line)) {
          matches.push(line);
        }
      });
      setRegexMatches(matches);
    } catch (err: any) {
      setRegexMatches([`Regex Error: ${err.message}`]);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 relative perspective-1000">
      {/* Header wrapped in FloatingContainer */}
      <FloatingContainer
        id="devlab-header-container"
        floatDistance={3}
        floatDuration={5.8}
        hoverElevation={true}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
              <Wrench className="w-5 h-5 text-blue-600" />
              <span>DevLab Engineering Sandboxes</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              SSRF-protected outbound HTTP proxy, cryptographic hashing, live JWT decoders, and data tools.
            </p>
          </div>
        </div>
      </FloatingContainer>

      {/* Tabs */}
      <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('proxy')}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-colors ${
            activeTab === 'proxy' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>SSRF-Safe HTTP Proxy</span>
        </button>

        <button
          onClick={() => setActiveTab('crypto')}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-colors ${
            activeTab === 'crypto' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          <span>Crypto & Hashes</span>
        </button>

        <button
          onClick={() => setActiveTab('jwt')}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-colors ${
            activeTab === 'jwt' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>JWT Inspector</span>
        </button>

        <button
          onClick={() => setActiveTab('json')}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-colors ${
            activeTab === 'json' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>JSON Formatter & Validator</span>
        </button>

        <button
          onClick={() => setActiveTab('regex')}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-colors ${
            activeTab === 'regex' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Regex className="w-3.5 h-3.5" />
          <span>Regex Engine</span>
        </button>
      </div>

      {/* Tab 1: SSRF Safe HTTP Proxy */}
      {activeTab === 'proxy' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleExecuteProxy} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Outbound HTTP Request Builder</h3>
            <p className="text-xs text-slate-500">
              Protected against Server-Side Request Forgery (SSRF) — requests to localhost or private IPs (127.0.0.1, 10.x, 192.168.x) are strictly blocked.
            </p>

            <div className="flex items-center space-x-2">
              <select
                value={proxyMethod}
                onChange={(e) => setProxyMethod(e.target.value as any)}
                className="px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>

              <input
                type="url"
                required
                value={proxyUrl}
                onChange={(e) => setProxyUrl(e.target.value)}
                placeholder="https://api.example.com/data"
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Headers (JSON)</label>
              <textarea
                rows={3}
                value={proxyHeaders}
                onChange={(e) => setProxyHeaders(e.target.value)}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {proxyMethod !== 'GET' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Body (String / JSON)</label>
                <textarea
                  rows={3}
                  value={proxyBody}
                  onChange={(e) => setProxyBody(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isProxyLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isProxyLoading ? 'Executing Request...' : 'Send Request via Proxy'}</span>
            </button>
          </form>

          {/* Proxy Response */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col">
            <h3 className="text-sm font-bold text-slate-900">HTTP Response</h3>

            {proxyError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{proxyError}</span>
              </div>
            )}

            {!proxyResult && !proxyError ? (
              <div className="flex-1 min-h-[250px] border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400">
                Awaiting execution...
              </div>
            ) : proxyResult ? (
              <div className="space-y-3 animate-in fade-in flex-1 flex flex-col">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-600">Status:</span>
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold ${
                        proxyResult.status < 400
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {proxyResult.status} {proxyResult.statusText}
                    </span>
                  </div>
                  <span className="font-mono text-slate-500">{proxyResult.durationMs} ms</span>
                </div>

                <div className="flex-1 flex flex-col">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Response Payload
                  </span>
                  <pre className="flex-1 p-3 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-auto max-h-[350px]">
                    {typeof proxyResult.data === 'object'
                      ? JSON.stringify(proxyResult.data, null, 2)
                      : proxyResult.data}
                  </pre>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Tab 2: Crypto & Hashes */}
      {activeTab === 'crypto' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Cryptographic Hash Generator</h3>
            <p className="text-xs text-slate-500">Calculates Node.js crypto digests (SHA-256, SHA-512, MD5, Base64).</p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              placeholder="Enter plaintext to hash..."
              className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
            />
            <button
              onClick={handleGenerateHashes}
              disabled={isHashing || !hashInput}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shrink-0"
            >
              {isHashing ? 'Hashing...' : 'Generate Hashes'}
            </button>
          </div>

          {hashResult && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              {Object.entries(hashResult).map(([algo, value]: [string, any]) => (
                <div key={algo} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{algo}</span>
                    <div className="text-xs font-mono font-bold text-slate-800 break-all">{value}</div>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(value)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 ml-2"
                    title="Copy Hash"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: JWT Inspector */}
      {activeTab === 'jwt' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">JSON Web Token (JWT) Inspector</h3>
            <p className="text-xs text-slate-500">Decodes header and payload claims.</p>
          </div>

          <textarea
            rows={3}
            value={jwtInput}
            onChange={(e) => setJwtInput(e.target.value)}
            className="w-full p-3 text-xs rounded-xl border border-slate-300 font-mono text-purple-700"
          />

          <button
            onClick={handleDecodeJwt}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
          >
            Decode Token
          </button>

          {jwtDecoded && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400">Header</span>
                <pre className="text-xs font-mono mt-1 text-slate-800">
                  {JSON.stringify(jwtDecoded.header, null, 2)}
                </pre>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400">Payload Claims</span>
                <pre className="text-xs font-mono mt-1 text-slate-800">
                  {JSON.stringify(jwtDecoded.payload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: JSON Formatter */}
      {activeTab === 'json' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">JSON Formatter & Validator</h3>
            <p className="text-xs text-slate-500">Beautifies unformatted payloads and reports parser syntax errors.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Raw Input</label>
              <textarea
                rows={10}
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-slate-300 font-mono"
              />
              <button
                onClick={handleFormatJson}
                className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
              >
                Format & Validate
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Formatted Output</label>
              {jsonError ? (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-mono">
                  Syntax Error: {jsonError}
                </div>
              ) : (
                <pre className="w-full p-3 text-xs rounded-xl bg-slate-900 text-emerald-400 font-mono h-64 overflow-auto">
                  {formattedJson || 'Click Format & Validate...'}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Regex Engine */}
      {activeTab === 'regex' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Regular Expression Engine</h3>
            <p className="text-xs text-slate-500">Test patterns against multiline inputs in real-time.</p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-mono text-slate-400 text-sm">/</span>
            <input
              type="text"
              value={regexPattern}
              onChange={(e) => setRegexPattern(e.target.value)}
              placeholder="pattern"
              className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300"
            />
            <span className="font-mono text-slate-400 text-sm">/</span>
            <input
              type="text"
              value={regexFlags}
              onChange={(e) => setRegexFlags(e.target.value)}
              placeholder="flags"
              className="w-16 px-2 py-1.5 text-xs font-mono rounded-lg border border-slate-300"
            />
            <button
              onClick={handleTestRegex}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
            >
              Test Matches
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Test Strings (One per line)</label>
              <textarea
                rows={8}
                value={regexText}
                onChange={(e) => setRegexText(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Matching Lines ({regexMatches.length})</label>
              <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs h-52 overflow-auto space-y-1">
                {regexMatches.length === 0 ? (
                  <span className="text-slate-500 italic">No matches.</span>
                ) : (
                  regexMatches.map((m, i) => <div key={i}>&bull; {m}</div>)
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
