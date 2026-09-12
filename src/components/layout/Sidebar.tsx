import React, { useRef } from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  Kanban,
  CheckSquare,
  Users,
  BarChart3,
  Bot,
  Github,
  Wrench,
  FileSpreadsheet,
  Settings,
  X,
  Server,
  Sparkles,
  LucideIcon
} from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, LayoutGroup } from 'motion/react';
import { useAuth } from '../../context/AuthContext';

interface NavItemData {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

interface SidebarNavItemProps {
  item: NavItemData;
  isActive: boolean;
  onNav: (id: string) => void;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({ item, isActive, onNav }) => {
  const Icon = item.icon;
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Normalized mouse coordinates from center (-0.5 to 0.5)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Responsive spring physics configuration
  const springConfig = { damping: 16, stiffness: 260, mass: 0.1 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Subtle 3D translations and tilts
  const translateX = useTransform(smoothX, [-0.5, 0.5], [-3, 3]);
  const translateY = useTransform(smoothY, [-0.5, 0.5], [-2, 2]);
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-5, 5]);

  // Differential parallax offset for foreground icon & badge (creates deeper Z-layer feeling)
  const fgX = useTransform(smoothX, [-0.5, 0.5], [-2, 2]);
  const fgY = useTransform(smoothY, [-0.5, 0.5], [-1.5, 1.5]);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const xNorm = (e.clientX - rect.left) / rect.width - 0.5;
    const yNorm = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xNorm);
    mouseY.set(yNorm);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.button
      ref={buttonRef}
      id={`nav-${item.id}`}
      onClick={() => onNav(item.id)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        x: translateX,
        y: translateY,
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{
        scale: 1.018,
        transition: { duration: 0.15 },
      }}
      whileTap={{ scale: 0.98 }}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium relative cursor-pointer group select-none transition-colors ${
        isActive
          ? 'text-white font-semibold'
          : 'text-slate-400 hover:text-slate-100'
      }`}
    >
      {/* Framer Motion layoutId Active Sliding Indicator with 3D Depth */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-indicator"
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 shadow-md shadow-blue-600/35 border-t border-blue-400/40 border-b border-blue-700/50"
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 30,
            mass: 0.8,
          }}
        >
          {/* Subtle tactile spatial specular highlight */}
          <div className="absolute inset-x-2 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          {/* Lateral depth glow */}
          <div className="absolute inset-0 rounded-lg bg-blue-500/10 blur-xs -z-10" />
        </motion.div>
      )}

      {/* Subtle depth illumination layer on hover (when inactive) */}
      {!isActive && (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 bg-slate-800/50 transition-opacity duration-200"
        />
      )}

      <div className="flex items-center space-x-2.5 relative z-10">
        <motion.div
          style={{ x: fgX, y: fgY }}
          className="flex items-center justify-center shrink-0"
        >
          <Icon
            className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
              isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
            }`}
          />
        </motion.div>
        <span className="relative z-10 tracking-tight">{item.label}</span>
      </div>

      {item.badge && (
        <motion.span
          style={{ x: fgX, y: fgY }}
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md relative z-10 transition-colors ${
            isActive
              ? 'bg-blue-700/90 text-blue-100 border border-blue-400/40 shadow-xs'
              : 'bg-slate-800 text-slate-300 border border-slate-700/60 group-hover:border-slate-600'
          }`}
        >
          {item.badge}
        </motion.span>
      )}
    </motion.button>
  );
};

interface SidebarProps {
  currentView?: string;
  activeItem?: string;
  onNavigate?: (view: string) => void;
  onSelect?: (view: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  activeItem,
  onNavigate,
  onSelect,
  isOpen = false,
  onClose
}) => {
  const { user } = useAuth();
  const activeView = currentView || activeItem || 'dashboard';

  const handleNav = (targetView: string) => {
    if (typeof onNavigate === 'function') {
      onNavigate(targetView);
    } else if (typeof onSelect === 'function') {
      onSelect(targetView);
    }
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const navSections = [
    {
      title: 'WORKSPACE',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'projects', label: 'Projects', icon: FolderGit2 },
        { id: 'kanban', label: 'Kanban Board', icon: Kanban },
        { id: 'tasks', label: 'Tasks', icon: CheckSquare }
      ]
    },
    {
      title: 'ENGINEERING & TOOLS',
      items: [
        { id: 'gemini-chat', label: 'Gemini 3D Copilot', icon: Sparkles, badge: 'Live AI' },
        { id: 'ai-assistant', label: 'NEXUS AI Studio', icon: Bot, badge: 'Flash' },
        { id: 'github', label: 'GitHub Live Hub', icon: Github },
        { id: 'devlab', label: 'DevLab Utilities', icon: Wrench, badge: '10 Tools' },
        { id: 'files', label: 'File Vault & CSV', icon: FileSpreadsheet }
      ]
    },
    {
      title: 'ORGANIZATION',
      items: [
        { id: 'teams', label: 'Team & Access', icon: Users },
        { id: 'analytics', label: 'Sprint Analytics', icon: BarChart3 }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Settings & Security', icon: Settings },
        { id: 'diagnostics', label: 'API Health & Specs', icon: Server }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => handleNav('dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-base shadow-md shadow-blue-500/20">
              N
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-wider text-white">NEXUS OS</span>
              <span className="text-[10px] font-mono uppercase text-blue-400 font-semibold">
                Unified Platform
              </span>
            </div>
          </div>

          <button
            onClick={() => onClose?.()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections with coordinated LayoutGroup */}
        <LayoutGroup id="nexus-sidebar-navigation">
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 perspective-1000">
            {navSections.map((section) => (
              <div key={section.title} className="preserve-3d">
                <div className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-2">
                  {section.title}
                </div>
                <div className="space-y-1 preserve-3d">
                  {section.items.map((item) => (
                    <SidebarNavItem
                      key={item.id}
                      item={item}
                      isActive={activeView === item.id}
                      onNav={handleNav}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </LayoutGroup>

        {/* Bottom Current User Card */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center space-x-3 px-2 py-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={user?.fullName || 'User'}
              className="w-8 h-8 rounded-full border border-slate-700 object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{user?.fullName}</div>
              <div className="text-[10px] text-slate-400 truncate">{user?.role}</div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" title="Gateway Connected" />
          </div>
        </div>
      </aside>
    </>
  );
};
