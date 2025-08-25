import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Activity,
  GitBranch,
  AlertTriangle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Database,
  Cloud,
  BarChart3,
  Shield,
  Users,
  Clock,
  Search,
  Command,
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  children?: SidebarItem[];
}

interface SidebarProps {
  selectedItem?: string;
  onItemSelect?: (itemId: string) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

const sidebarItems: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
  { id: 'metrics', label: 'Metrics', icon: <Activity size={20} />, badge: 3 },
  { id: 'pipelines', label: 'Pipelines', icon: <GitBranch size={20} /> },
  { id: 'alerts', label: 'Alerts', icon: <AlertTriangle size={20} />, badge: 5 },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
  { id: 'infrastructure', label: 'Infrastructure', icon: <Cloud size={20} /> },
  { id: 'database', label: 'Database', icon: <Database size={20} /> },
  { id: 'security', label: 'Security', icon: <Shield size={20} /> },
  { id: 'team', label: 'Team', icon: <Users size={20} /> },
  { id: 'logs', label: 'Logs', icon: <Terminal size={20} /> },
  { id: 'uptime', label: 'Uptime', icon: <Clock size={20} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
];

export const Sidebar: React.FC<SidebarProps> = ({
  selectedItem = 'dashboard',
  onItemSelect,
  collapsed: controlledCollapsed,
  onCollapsedChange,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  const collapsed = controlledCollapsed ?? internalCollapsed;
  const setCollapsed = onCollapsedChange ?? setInternalCollapsed;
  
  const handleItemClick = (itemId: string) => {
    onItemSelect?.(itemId);
  };
  
  const handleCommandPalette = () => {
    setSearchOpen(!searchOpen);
    // Trigger command palette with Cmd+K
  };
  
  return (
    <>
      <motion.aside
        initial={{ width: 280 }}
        animate={{ width: collapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={clsx(
          'relative flex flex-col h-screen',
          'bg-dark-200/50 backdrop-blur-xl border-r border-white/10'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center space-x-2"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-info to-purple-600 rounded-lg" />
                <span className="font-semibold text-lg">DevOps Dash</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        
        {/* Search / Command Palette */}
        <div className="p-4">
          <button
            onClick={handleCommandPalette}
            className={clsx(
              'w-full flex items-center space-x-2 p-2 rounded-lg',
              'bg-white/5 hover:bg-white/10 transition-colors',
              'border border-white/10'
            )}
          >
            {collapsed ? (
              <Command size={20} className="mx-auto" />
            ) : (
              <>
                <Search size={16} />
                <span className="text-sm text-gray-400 flex-1 text-left">
                  Search...
                </span>
                <kbd className="text-xs bg-white/10 px-1.5 py-0.5 rounded">
                  ⌘K
                </kbd>
              </>
            )}
          </button>
        </div>
        
        {/* Navigation Items */}
        <nav className="flex-1 px-4 pb-4 overflow-y-auto custom-scrollbar">
          <ul className="space-y-1">
            {sidebarItems.map((item) => (
              <SidebarNavItem
                key={item.id}
                item={item}
                isSelected={selectedItem === item.id}
                isCollapsed={collapsed}
                onClick={() => handleItemClick(item.id)}
              />
            ))}
          </ul>
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className={clsx(
            'flex items-center space-x-3',
            collapsed && 'justify-center'
          )}>
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full" />
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1"
                >
                  <div className="text-sm font-medium">System Status</div>
                  <div className="text-xs text-green-400">All Systems Operational</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>
      
      {/* Command Palette Modal */}
      <AnimatePresence>
        {searchOpen && (
          <CommandPalette onClose={() => setSearchOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

interface SidebarNavItemProps {
  item: SidebarItem;
  isSelected: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  item,
  isSelected,
  isCollapsed,
  onClick,
}) => {
  return (
    <li>
      <button
        onClick={onClick}
        className={clsx(
          'w-full flex items-center space-x-3 px-3 py-2 rounded-lg',
          'transition-all duration-200',
          isSelected
            ? 'bg-info/20 text-info border border-info/30'
            : 'hover:bg-white/5 text-gray-400 hover:text-white',
          isCollapsed && 'justify-center'
        )}
      >
        <span className={clsx(isSelected && 'text-info')}>
          {item.icon}
        </span>
        
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 text-left text-sm"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
        
        {item.badge && !isCollapsed && (
          <span className={clsx(
            'px-2 py-0.5 text-xs rounded-full',
            isSelected
              ? 'bg-info text-black'
              : 'bg-white/10 text-white'
          )}>
            {item.badge}
          </span>
        )}
      </button>
    </li>
  );
};

interface CommandPaletteProps {
  onClose: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl bg-dark-200 rounded-xl border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent outline-none text-white placeholder-gray-400"
              autoFocus
            />
            <kbd className="text-xs bg-white/10 px-2 py-1 rounded">ESC</kbd>
          </div>
        </div>
        <div className="p-4">
          <div className="text-sm text-gray-400">Quick Actions</div>
          {/* Command palette items would go here */}
        </div>
      </motion.div>
    </motion.div>
  );
};