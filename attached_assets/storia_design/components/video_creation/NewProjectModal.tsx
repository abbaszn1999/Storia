import React, { useState } from 'react';
import { XMarkIcon } from '../icons';

interface NewProjectModalProps {
  onClose: () => void;
  onStart: (title: string) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose, onStart }) => {
  const [title, setTitle] = useState('');

  const handleStart = () => {
    if (title.trim()) {
      onStart(title.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="font-bold text-white text-lg">Start a New Video Project</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <XMarkIcon className="w-7 h-7" />
          </button>
        </header>
        <div className="p-8">
          <label htmlFor="project-title" className="block text-sm font-medium text-slate-300 mb-2">Project Title</label>
          <input
            id="project-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Summer Vlog Adventure"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <footer className="flex justify-end p-6 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm font-semibold text-slate-300 hover:text-white mr-4">Cancel</button>
          <button onClick={handleStart} disabled={!title.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors">Start Creating</button>
        </footer>
      </div>
    </div>
  );
};
