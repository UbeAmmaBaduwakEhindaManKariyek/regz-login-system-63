
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu,
  Users,
  Key,
  Tag,
  FileText,
  Webhook,
  Settings,
  Database,
  Home,
  LogOut,
  FileWarning,
  FileCode,
  Grid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, isMobile = false }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <Home className="w-5 h-5" /> },
    { name: 'Applications', path: '/applications', icon: <Grid className="w-5 h-5" /> },
    { name: 'Users', path: '/users', icon: <Users className="w-5 h-5" /> },
    { name: 'Licenses', path: '/licenses', icon: <Key className="w-5 h-5" /> },
    { name: 'Subscriptions', path: '/subscriptions', icon: <Tag className="w-5 h-5" /> },
    { name: 'App Open', path: '/app-open', icon: <FileText className="w-5 h-5" /> },
    { name: 'Login Details', path: '/login-details', icon: <FileWarning className="w-5 h-5" /> },
    { name: 'Logs', path: '/logs', icon: <Database className="w-5 h-5" /> },
    { name: 'API Docs', path: '/api-docs', icon: <FileCode className="w-5 h-5" /> },
    { name: 'Webhooks', path: '/webhooks', icon: <Webhook className="w-5 h-5" /> },
    { name: 'Emu Users', path: '/emu-users', icon: <Users className="w-5 h-5" /> },
    { name: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5" /> }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <span className="text-xl font-bold">Regz Login System</span>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 py-4">
        <ul className="space-y-2 px-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={cn(
                  "flex items-center p-3 text-gray-300 rounded-md hover:bg-blue-600 transition-colors",
                  location.pathname === item.path && "bg-blue-700"
                )}
                onClick={isMobile ? toggleSidebar : undefined}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 border-t border-gray-800">
        <button 
          className="flex items-center p-3 text-gray-300 rounded-md hover:bg-red-600 transition-colors w-full"
          onClick={logout}
        >
          <span className="mr-3"><LogOut className="w-5 h-5" /></span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  // If this is for mobile, return just the content
  if (isMobile) {
    return sidebarContent;
  }

  // Otherwise return the desktop sidebar
  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-[#101010] text-white transition-all duration-300 z-30 hidden md:block",
      isOpen ? "w-64" : "w-0"
    )}>
      {isOpen && sidebarContent}
    </aside>
  );
};

export default Sidebar;
