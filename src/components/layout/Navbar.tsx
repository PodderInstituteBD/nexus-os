import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Search,
  Plus,
  Wrench,
  ChevronDown,
  CheckCheck,
  LogOut,
  UserCheck,
  Shield,
  Activity,
  Menu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { UserRole } from '../../types';

interface NavbarProps {
  onOpenSearch?: () => void;
  onOpenNewTask?: () => void;
  onOpenNewProject?: () => void;
  onToggleMobileSidebar?: () => void;
  onNavigate?: (view: string) => void;
  currentView?: string;
}

const ROLE_COLORS: Record<UserRole, string> = {
  OWNER: 'bg-purple-100 text-purple-800 border-purple-300',
  ADMIN: 'bg-red-100 text-red-800 border-red-300',
  DEVELOPER: 'bg-blue-100 text-blue-800 border-blue-300',
  DESIGNER: 'bg-pink-100 text-pink-800 border-pink-300',
  MEMBER: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  VIEWER: 'bg-slate-100 text-slate-800 border-slate-300'
};

const DEMO_USERS = [
  { name: 'Alex Vance', email: 'alex.vance@nexus.io', role: 'OWNER' },
  { name: 'Sarah Connor', email: 'sarah.connor@nexus.io', role: 'ADMIN' },
  { name: 'Marcus Chen', email: 'marcus.chen@nexus.io', role: 'DEVELOPER' },
  { name: 'Elena Rostova', email: 'elena.rostova@nexus.io', role: 'DESIGNER' },
  { name: 'David Kim', email: 'david.kim@nexus.io', role: 'MEMBER' }
];

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenNewTask,
  onOpenNewProject,
  onToggleMobileSidebar,
  onNavigate
}) => {
  const handleNav = (targetView: string) => {
    if (typeof onNavigate === 'function') {
      onNavigate(targetView);
    }
  };
  const { user, logout, quickLogin, activeTeam, teams, setActiveTeam } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showTeamMenu, setShowTeamMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const teamMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (teamMenuRef.current && !teamMenuRef.current.contains(e.target as Node)) {
        setShowTeamMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 flex items-center justify-between">
      {/* Left: Mobile Toggle & Team Switcher */}
      <div className="flex items-center space-x-3">
        <button
          id="mobile-menu-toggle"
          onClick={onToggleMobileSidebar}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Team Selector Dropdown */}
        <div className="relative" ref={teamMenuRef}>
          <button
            id="team-switcher-button"
            onClick={() => setShowTeamMenu(!showTeamMenu)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <div className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
              N
            </div>
            <span className="font-semibold">{activeTeam?.name || 'Nexus Core'}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showTeamMenu && (
            <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-3 py-1 text-xs font-semibold uppercase text-slate-400">
                Workspaces
              </div>
              {teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTeam(t);
                    setShowTeamMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-50 ${
                    activeTeam?.id === t.id ? 'bg-slate-50 font-semibold text-blue-600' : 'text-slate-700'
                  }`}
                >
                  <span className="truncate">{t.name}</span>
                  {activeTeam?.id === t.id && (
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: Command Palette Trigger */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <button
          id="global-search-trigger"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-sm transition-colors border border-transparent hover:border-slate-300"
        >
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-slate-400" />
            <span>Search tasks, projects, tools...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-semibold bg-white border border-slate-300 rounded shadow-xs text-slate-500">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2">
        {/* DevLab Quick Tool Launcher */}
        <button
          id="quick-devlab-btn"
          onClick={() => handleNav('devlab')}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          title="Open DevLab Utilities"
        >
          <Wrench className="w-5 h-5" />
        </button>

        {/* Quick New Task Button */}
        <button
          id="quick-add-task-btn"
          onClick={() => onOpenNewTask?.()}
          className="hidden sm:inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            id="notifications-button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 py-3 z-50">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.link) handleNav(n.link.replace('/', ''));
                        setShowNotifications(false);
                      }}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                        !n.read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-semibold text-xs text-slate-900">{n.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 pt-2 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    handleNav('notifications');
                    setShowNotifications(false);
                  }}
                  className="text-xs font-semibold text-slate-700 hover:text-blue-600"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar & Switcher Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            id="user-profile-menu-button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-100 transition-colors relative"
          >
            <div className="relative">
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={user?.fullName || 'User Avatar'}
                className="w-8 h-8 rounded-full border border-slate-200 object-cover"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" title="Firebase Connected" />
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm">{user?.fullName}</div>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-700 border border-emerald-300">
                    Firebase Live
                  </span>
                </div>
                <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                {user?.role && (
                  <span
                    className={`inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                      ROLE_COLORS[user.role]
                    }`}
                  >
                    {user.role}
                  </span>
                )}
              </div>

              {/* Fast Persona Switcher (demonstrates full RBAC without re-logging) */}
              <div className="px-4 py-2 bg-slate-50/70 border-b border-slate-100">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                  <UserCheck className="w-3 h-3 text-slate-400" />
                  <span>Switch Testing Persona</span>
                </div>
                <div className="space-y-1">
                  {DEMO_USERS.map((du) => (
                    <button
                      key={du.email}
                      onClick={() => {
                        quickLogin(du.email);
                        setShowUserMenu(false);
                      }}
                      className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between ${
                        user?.email === du.email
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-200/60'
                      }`}
                    >
                      <span className="truncate">{du.name}</span>
                      <span className="text-[9px] font-mono uppercase bg-white border border-slate-200 px-1 py-0.2 rounded">
                        {du.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    handleNav('settings');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                >
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span>Account & Permissions</span>
                </button>
                <button
                  onClick={() => {
                    handleNav('analytics');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                >
                  <Activity className="w-4 h-4 text-slate-400" />
                  <span>Sprint Analytics</span>
                </button>
                <button
                  id="logout-button"
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center space-x-2 font-medium"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
