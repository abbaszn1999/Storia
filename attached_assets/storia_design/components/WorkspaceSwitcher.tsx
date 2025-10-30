import React, { useState, useRef, useEffect } from 'react';
import { Workspace } from '../types';
import { WorkspaceIcon, ChevronUpDownIcon, PlusIcon, CheckIcon } from './icons';

interface WorkspaceSwitcherProps {
    workspaces: Workspace[];
    currentWorkspace: Workspace;
    onSwitchWorkspace: (workspace: Workspace) => void;
    isDisabled?: boolean;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({ workspaces, currentWorkspace, onSwitchWorkspace, isDisabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (workspace: Workspace) => {
        onSwitchWorkspace(workspace);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(prev => !prev)}
                disabled={isDisabled}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700/80 disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors"
            >
                <div className="flex items-center gap-3">
                    <WorkspaceIcon className={`w-5 h-5 ${isDisabled ? 'text-slate-600' : 'text-slate-300'}`} />
                    <span className={`font-semibold text-sm ${isDisabled ? 'text-slate-600' : 'text-white'}`}>{currentWorkspace.name}</span>
                </div>
                <ChevronUpDownIcon className={`w-5 h-5 ${isDisabled ? 'text-slate-600' : 'text-slate-400'}`} />
            </button>

            {isOpen && !isDisabled && (
                <div className="absolute top-full right-0 mt-2 w-full bg-slate-800 rounded-lg shadow-2xl border border-slate-700/50 z-50 overflow-hidden p-2">
                    <p className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase">Workspaces</p>
                    {workspaces.map(ws => (
                        <button
                            key={ws.id}
                            onClick={() => handleSelect(ws)}
                            className="w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white"
                        >
                            <span>{ws.name}</span>
                            {currentWorkspace.id === ws.id && <CheckIcon className="w-4 h-4 text-blue-400" />}
                        </button>
                    ))}
                    <div className="h-px bg-slate-700/50 my-2"></div>
                    <button className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white">
                        <PlusIcon className="w-5 h-5 text-slate-400" />
                        <span>Create new workspace</span>
                    </button>
                </div>
            )}
        </div>
    );
};