import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { SpatialProvider } from './context/SpatialContext';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { NewTaskModal } from './components/modals/NewTaskModal';
import { NewProjectModal } from './components/modals/NewProjectModal';
import { TaskDetailDrawer } from './components/modals/TaskDetailDrawer';

import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { KanbanPage } from './pages/KanbanPage';
import { TasksPage } from './pages/TasksPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { GitHubPage } from './pages/GitHubPage';
import { DevLabPage } from './pages/DevLabPage';
import { FilesPage } from './pages/FilesPage';
import { TeamsPage } from './pages/TeamsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { DiagnosticsPage } from './pages/DiagnosticsPage';
import { LoginPage } from './pages/LoginPage';
import { GeminiChatBot } from './components/chat/GeminiChatBot';
import { AmbientSpatialBackground } from './components/layout/AmbientSpatialBackground';
import { motion, AnimatePresence } from 'motion/react';

import { Project, Task, TeamMember } from './types';
import { apiRequest } from './lib/api';

const pageTransitionVariants = {
  initial: {
    opacity: 0,
    y: 10,
    scale: 0.988,
    rotateX: 2,
    transformPerspective: 1200,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transformPerspective: 1200,
    transition: {
      duration: 0.26,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.992,
    rotateX: -1.5,
    transformPerspective: 1200,
    transition: {
      duration: 0.16,
      ease: [0.4, 0, 1, 1],
    },
  },
};

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, activeTeam } = useAuth();

  // Navigation State
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [githubInitialRepo, setGithubInitialRepo] = useState<string>('expressjs/express');

  // Modals & Drawers
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTaskPresetProjectId, setNewTaskPresetProjectId] = useState<string | undefined>(undefined);

  // Cached projects, tasks, and members for global modals
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    if (isAuthenticated && activeTeam) {
      loadGlobalData();
    }
  }, [isAuthenticated, activeTeam]);

  const loadGlobalData = async () => {
    if (!activeTeam) return;
    try {
      const [projRes, taskRes, memRes] = await Promise.all([
        apiRequest<{ projects: Project[] }>(`/projects?teamId=${activeTeam.id}`),
        apiRequest<{ tasks: Task[] }>(`/tasks?teamId=${activeTeam.id}`),
        apiRequest<{ members: TeamMember[] }>(`/teams/${activeTeam.id}/members`)
      ]);
      setProjects(projRes.projects || []);
      setTasks(taskRes.tasks || []);
      setMembers(memRes.members || []);
    } catch (err) {
      console.error('Error loading global workspace data', err);
    }
  };

  const handleNavigate = (view: string, contextId?: string) => {
    if (contextId) {
      setActiveProjectId(contextId);
      setCurrentView('project-detail');
    } else {
      setCurrentView(view);
    }
  };

  const handleOpenNewTask = (presetProjectId?: string) => {
    setNewTaskPresetProjectId(presetProjectId);
    setIsNewTaskModalOpen(true);
  };

  const handleNavigateToRepo = (repoUrl: string) => {
    const clean = repoUrl.replace('https://github.com/', '');
    setGithubInitialRepo(clean);
    setCurrentView('github');
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center text-slate-400 text-xs">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="font-mono">Booting NEXUS OS Environment...</span>
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardPage
            onNavigate={handleNavigate}
            onOpenNewTask={() => handleOpenNewTask()}
            onOpenNewProject={() => setIsNewProjectModalOpen(true)}
            onSelectTask={(task) => setSelectedTask(task)}
          />
        );
      case 'projects':
        return (
          <ProjectsPage
            onOpenNewProject={() => setIsNewProjectModalOpen(true)}
            onSelectProject={(id) => handleNavigate('project-detail', id)}
          />
        );
      case 'project-detail':
        return activeProjectId ? (
          <ProjectDetailPage
            projectId={activeProjectId}
            onBack={() => setCurrentView('projects')}
            onOpenNewTask={(pId) => handleOpenNewTask(pId)}
            onSelectTask={(task) => setSelectedTask(task)}
            onNavigateToRepo={handleNavigateToRepo}
          />
        ) : null;
      case 'kanban':
        return (
          <KanbanPage
            onSelectTask={(task) => setSelectedTask(task)}
            onOpenNewTask={(pId) => handleOpenNewTask(pId)}
          />
        );
      case 'tasks':
        return (
          <TasksPage
            onSelectTask={(task) => setSelectedTask(task)}
            onOpenNewTask={() => handleOpenNewTask()}
          />
        );
      case 'gemini-chat':
        return (
          <div className="p-4 sm:p-6 h-full min-h-[calc(100vh-5rem)] flex flex-col">
            <GeminiChatBot />
          </div>
        );
      case 'ai-assistant':
        return <AIAssistantPage onTaskCreated={loadGlobalData} />;
      case 'github':
        return <GitHubPage initialRepo={githubInitialRepo} />;
      case 'devlab':
        return <DevLabPage />;
      case 'files':
        return <FilesPage />;
      case 'teams':
        return <TeamsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'diagnostics':
        return <DiagnosticsPage />;
      default:
        return (
          <DashboardPage
            onNavigate={handleNavigate}
            onOpenNewTask={() => handleOpenNewTask()}
            onOpenNewProject={() => setIsNewProjectModalOpen(true)}
            onSelectTask={(task) => setSelectedTask(task)}
          />
        );
    }
  };

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 antialiased overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView === 'project-detail' ? 'projects' : currentView}
        activeItem={currentView === 'project-detail' ? 'projects' : currentView}
        onNavigate={handleNavigate}
        onSelect={handleNavigate}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          currentView={currentView}
          onOpenSearch={() => setIsSearchModalOpen(true)}
          onOpenNewTask={() => handleOpenNewTask()}
          onOpenNewProject={() => setIsNewProjectModalOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          onNavigate={handleNavigate}
        />

        {/* Scrollable View Container with 3D Depth-Aware Page Transitions */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 relative perspective-1000">
          <AmbientSpatialBackground />
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView === 'project-detail' ? `project-detail-${activeProjectId}` : currentView}
              variants={pageTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="min-h-full w-full preserve-3d"
            >
              {renderCurrentView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        projects={projects}
        tasks={tasks}
        onSelectProject={(id) => handleNavigate('project-detail', id)}
        onSelectTask={(task) => setSelectedTask(task)}
        onNavigate={handleNavigate}
      />

      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        projects={projects}
        members={members}
        currentProjectId={newTaskPresetProjectId}
        onTaskCreated={loadGlobalData}
      />

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onProjectCreated={loadGlobalData}
      />

      <TaskDetailDrawer
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        members={members}
        onTaskUpdated={loadGlobalData}
        onTaskDeleted={loadGlobalData}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <SpatialProvider>
          <AppContent />
        </SpatialProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
