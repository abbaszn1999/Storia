import React from 'react';
import { ContinuityWarning } from './ContinuityWarning';

interface Shot { id: string; url: string; }

interface InspectorPanelProps {
  activeShot: Shot;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ activeShot }) => {
  return (
    <aside className="w-80 bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
      <h3 className="font-bold text-white text-lg">Shot Inspector</h3>
      <ContinuityWarning />
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Prompt</label>
        <textarea rows={5} defaultValue="A hero discovers a map, cinematic, dramatic lighting, 4k" className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
      </div>
      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors">Regenerate</button>
    </aside>
  );
};
