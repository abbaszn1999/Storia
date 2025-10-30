import React from 'react';
import { Creation } from '../types';
import { PlusIcon } from './icons';

interface CreationCardProps {
  creation: Creation;
  onClick: (view: Creation['view']) => void;
}

// Fix: Implement the CreationCard component.
export const CreationCard: React.FC<CreationCardProps> = ({ creation, onClick }) => {
  const Icon = creation.icon;

  return (
    <div 
      onClick={() => onClick(creation.view)}
      className="group relative bg-slate-800/50 p-6 rounded-lg border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800/80 cursor-pointer transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600 group-hover:bg-blue-600/30 group-hover:border-blue-500 transition-colors">
          <Icon className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" />
        </div>
        <div className="bg-slate-700/50 p-2 rounded-full opacity-0 group-hover:opacity-100 group-hover:bg-blue-600 transition-all duration-300 -translate-x-2 translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0">
          <PlusIcon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="mt-4">
        <h3 className="font-bold text-lg text-white">{creation.title}</h3>
        <p className="text-sm text-slate-400 mt-1">{creation.description}</p>
      </div>
    </div>
  );
};
