import React from 'react';

interface Shot { id: string; url: string; }

interface ShotCanvasProps {
  activeShot: Shot;
}

export const ShotCanvas: React.FC<ShotCanvasProps> = ({ activeShot }) => {
  return (
    <div className="flex-grow bg-slate-800/50 border border-slate-700/50 rounded-lg flex items-center justify-center p-4">
      <img src={activeShot.url} alt={`Active shot ${activeShot.id}`} className="max-w-full max-h-full object-contain rounded-md" />
    </div>
  );
};
