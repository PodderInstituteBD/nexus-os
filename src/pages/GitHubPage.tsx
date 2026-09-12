import React, { useState, useEffect } from 'react';
import {
  Github,
  GitCommit,
  GitPullRequest,
  Star,
  GitFork,
  AlertCircle,
  ExternalLink,
  Users,
  Search,
  RefreshCw
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { FloatingContainer } from '../components/layout/FloatingContainer';

interface GitHubPageProps {
  initialRepo?: string;
}

export const GitHubPage: React.FC<GitHubPageProps> = ({ initialRepo = 'expressjs/express' }) => {
  const [repoInput, setRepoInput] = useState(initialRepo);
  const [currentRepo, setCurrentRepo] = useState(initialRepo);
  const [repoData, setRepoData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'commits' | 'prs' | 'contributors'>('commits');

  useEffect(() => {
    loadRepo(currentRepo);
  }, [currentRepo]);

  const loadRepo = async (repoName: string) => {
    const cleanRepo = repoName.replace('https://github.com/', '').trim();
    if (!cleanRepo.includes('/')) {
      setError('Please provide format owner/repository (e.g. expressjs/express)');
      return;
    }
    const [owner, repo] = cleanRepo.split('/');
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiRequest(`/github/repo?owner=${owner}&repo=${repo}`);
      setRepoData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch repository data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoInput.trim()) {
      setCurrentRepo(repoInput.trim());
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 relative perspective-1000">
      {/* Header wrapped in FloatingContainer */}
      <FloatingContainer
        id="github-header-container"
        floatDistance={3}
        floatDuration={5.7}
        hoverElevation={true}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
              <Github className="w-5 h-5 text-slate-900" />
              <span>GitHub Live Engineering Hub</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time commit telemetry, active pull requests, and contributor activity with cached fallback.
            </p>
          </div>

          {/* Repository Search Bar with Subtle Depth */}
          <form onSubmit={handleSearch} className="flex items-center space-x-2 card-depth-3d">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="owner/repo (e.g. facebook/react)"
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono w-64 bg-white/95"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Fetch</span>
            </button>
          </form>
        </div>
      </FloatingContainer>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {repoData && repoData.meta && (
        <>
          {/* Repo Overview Card with Ambient Float */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 ambient-float-slow card-depth-3d">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {repoData.meta.full_name}
                  </span>
                  <a
                    href={repoData.meta.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  {repoData.cached && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      Cached Data
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                  {repoData.meta.description || 'No repository description.'}
                </p>
              </div>

              {/* Stats badges */}
              <div className="flex items-center space-x-3 text-xs font-semibold text-slate-700">
                <div className="flex items-center space-x-1 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{repoData.meta.stargazers_count?.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <GitFork className="w-3.5 h-3.5 text-slate-500" />
                  <span>{repoData.meta.forks_count?.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
                  <span>{repoData.meta.open_issues_count?.toLocaleString()} issues</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center space-x-4 text-xs text-slate-500">
              <span>Language: <strong>{repoData.meta.language || 'Multiple'}</strong></span>
              <span>Default Branch: <strong className="font-mono">{repoData.meta.default_branch}</strong></span>
              <span>License: <strong>{repoData.meta.license?.spdx_id || 'MIT'}</strong></span>
            </div>
          </div>

          {/* Repository Activity Tabs */}
          <div className="border-b border-slate-200 flex space-x-6 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('commits')}
              className={`pb-3 border-b-2 flex items-center space-x-1.5 transition-colors ${
                activeTab === 'commits'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>Recent Commits ({repoData.commits?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('prs')}
              className={`pb-3 border-b-2 flex items-center space-x-1.5 transition-colors ${
                activeTab === 'prs'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <GitPullRequest className="w-3.5 h-3.5" />
              <span>Active Pull Requests ({repoData.pullRequests?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('contributors')}
              className={`pb-3 border-b-2 flex items-center space-x-1.5 transition-colors ${
                activeTab === 'contributors'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Top Contributors ({repoData.contributors?.length || 0})</span>
            </button>
          </div>

          {/* Commits List */}
          {activeTab === 'commits' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {repoData.commits?.map((c: any) => (
                <div key={c.sha} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-semibold text-blue-600">{c.sha.slice(0, 7)}</span>
                      <span className="text-xs font-semibold text-slate-900 line-clamp-1">{c.message}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                      <span>{c.author}</span>
                      <span>&bull;</span>
                      <span>{new Date(c.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-400 hover:text-slate-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Pull Requests */}
          {activeTab === 'prs' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {repoData.pullRequests?.map((pr: any) => (
                <div key={pr.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-emerald-600">#{pr.number}</span>
                      <span className="text-xs font-semibold text-slate-900">{pr.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                      <span>by {pr.author}</span>
                      <span>&bull;</span>
                      <span>{new Date(pr.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <a
                    href={pr.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-400 hover:text-slate-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Contributors */}
          {activeTab === 'contributors' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {repoData.contributors?.map((contrib: any) => (
                <div
                  key={contrib.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3"
                >
                  <img
                    src={contrib.avatarUrl}
                    alt={contrib.login}
                    className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                  />
                  <div>
                    <a
                      href={contrib.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-xs text-slate-900 hover:underline flex items-center space-x-1"
                    >
                      <span>{contrib.login}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                    <span className="text-[11px] text-slate-500">{contrib.contributions} commits</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
