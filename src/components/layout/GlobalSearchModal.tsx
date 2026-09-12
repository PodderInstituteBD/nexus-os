import React, { useState, useEffect, useRef } from 'react';
import { Search, FolderGit2, CheckSquare, Wrench, Bot, ArrowRight, X } from 'lucide-react';
import { Project, Task } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  tasks: Task[];
  onSelectProject: (id: string) => void;
  onSelectTask: (task: Task) => void;
  onNavigate: (view: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  projects,
  tasks,
  onSelectProject,
  onSelectTask,
  onNavigate
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredProjects = q
    ? projects.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    : projects.slice(0, 3);

  const filteredTasks = q
    ? tasks.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
    : tasks.slice(0, 5);

  const tools = [
    { id: 'ai-assistant', title: 'NEXUS AI Studio (Gemini 3.8 Flash)', category: 'Tool', icon: Bot },
    { id: 'github', title: 'GitHub Live Hub', category: 'Tool', icon: FolderGit2 },
    { id: 'devlab', title: 'DevLab: JSON Validator, JWT Decoder & Hashes', category: 'Tool', icon: Wrench },
    { id: 'files', title: 'File Vault: Upload & Python CSV Stats', category: 'Tool', icon: FolderGit2 }
  ].filter((t) => !q || t.title.toLowerCase().includes(q));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-200">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, tasks, tools... (or press Esc to close)"
            className="w-full py-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {/* Projects */}
          {filteredProjects.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                Projects
              </div>
              <div className="space-y-1">
                {filteredProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProject(p.id);
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 flex items-center justify-between text-xs transition-colors group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <FolderGit2 className="w-4 h-4 text-blue-500" />
                      <div>
                        <span className="font-semibold text-slate-900">{p.name}</span>
                        <span className="text-slate-400 ml-2">{p.status}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {filteredTasks.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                Tasks
              </div>
              <div className="space-y-1">
                {filteredTasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onSelectTask(t);
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 flex items-center justify-between text-xs transition-colors group"
                  >
                    <div className="flex items-center space-x-2.5 truncate mr-2">
                      <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">{t.title}</span>
                    </div>
                    <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">
                      {t.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tools & Modules */}
          {tools.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                Tools & Utilities
              </div>
              <div className="space-y-1">
                {tools.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        onNavigate(t.id);
                        onClose();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 flex items-center justify-between text-xs transition-colors group"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className="w-4 h-4 text-purple-500" />
                        <span className="font-semibold text-slate-800">{t.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 group-hover:text-blue-600">Open &rarr;</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Tip: Use ↑ ↓ arrows to navigate</span>
          <span>Esc to exit</span>
        </div>
      </div>
    </div>
  );
};
