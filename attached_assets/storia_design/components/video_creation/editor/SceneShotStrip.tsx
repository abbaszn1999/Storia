import React from 'react';

// Mock types
interface Shot { id: string; url: string; }
interface Scene { id: string; shots: Shot[]; }

interface SceneShotStripProps {
  scenes: Scene[];
  activeShot: Shot;
  onSelectShot: (shot: Shot) => void;
}

export const SceneShotStrip: React.FC<SceneShotStripProps> = ({ scenes, activeShot, onSelectShot }) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2 flex-shrink-0">
      <div className="flex gap-2 overflow-x-auto">
        {scenes.map((scene, sceneIndex) => (
          <React.Fragment key={scene.id}>
            <div className="flex gap-2 items-center">
              {scene.shots.map(shot => (
                <img
                  key={shot.id}
                  src={shot.url}
                  alt={`Shot ${shot.id}`}
                  onClick={() => onSelectShot(shot)}
                  className={`w-24 h-16 object-cover rounded-md cursor-pointer border-2 ${activeShot.id === shot.id ? 'border-blue-500' : 'border-transparent hover:border-slate-500'}`}
                />
              ))}
            </div>
            {sceneIndex < scenes.length - 1 && <div className="w-px bg-slate-700 mx-2 self-stretch"></div>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
