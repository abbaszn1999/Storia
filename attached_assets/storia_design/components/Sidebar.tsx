import React from 'react';
import { View, NavItem, Workspace } from '../types';
import { AssetsIcon, CalendarIcon, HistoryIcon, HomeIcon, IntegrationsIcon, LogoIcon, SettingsIcon, StoriesIcon, VideoIcon } from './icons';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  isDisabled?: boolean;
  workspaces: Workspace[];
  currentWorkspace: Workspace;
  onSwitchWorkspace: (workspace: Workspace) => void;
}

const mainNavItems: NavItem[] = [
  { view: 'home', label: 'Home', icon: HomeIcon },
  { view: 'content_calendar', label: 'Content Calendar', icon: CalendarIcon },
  { view: 'stories', label: 'Stories', icon: StoriesIcon },
  { view: 'video', label: 'Video', icon: VideoIcon },
  { view: 'history', label: 'History', icon: HistoryIcon },
  { view: 'assets', label: 'Assets', icon: AssetsIcon },
  { view: 'integrations', label: 'Integrations', icon: IntegrationsIcon },
];

const bottomNavItems: NavItem[] = [
    { view: 'settings', label: 'Settings', icon: SettingsIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isDisabled = false, workspaces, currentWorkspace, onSwitchWorkspace }) => {
  return (
    <aside className="flex-shrink-0 w-64 bg-slate-800/50 border-r border-slate-700/50 flex flex-col">
      <div className="h-16 flex items-center px-6 gap-3">
        <LogoIcon className="w-8 h-8"/>
        <span className="font-bold text-xl text-white tracking-tight">Kalema</span>
      </div>
      <div className="px-4 pb-4">
        <WorkspaceSwitcher 
            workspaces={workspaces}
            currentWorkspace={currentWorkspace}
            onSwitchWorkspace={onSwitchWorkspace}
            isDisabled={isDisabled}
        />
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2 border-t border-slate-700/50">
        {mainNavItems.map(item => (
          <NavItemLink key={item.view} item={item} isActive={activeView === item.view} onClick={setActiveView} isDisabled={isDisabled && activeView !== item.view} />
        ))}
      </nav>
      <div className="px-4 py-4">
        {bottomNavItems.map(item => (
             <NavItemLink key={item.view} item={item} isActive={activeView === item.view} onClick={setActiveView} isDisabled={isDisabled} />
        ))}
      </div>
    </aside>
  );
};

interface NavItemLinkProps {
  item: NavItem;
  isActive: boolean;
  onClick: (view: View) => void;
  isDisabled: boolean;
}

const NavItemLink: React.FC<NavItemLinkProps> = ({ item, isActive, onClick, isDisabled }) => {
  const Icon = item.icon;
  return (
    <button
      onClick={() => onClick(item.view)}
      disabled={isDisabled}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
        isActive 
          ? 'bg-white/10 text-white' 
          : isDisabled 
          ? 'text-slate-600 cursor-not-allowed'
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{item.label}</span>
    </button>
  );
};

export default Sidebar;