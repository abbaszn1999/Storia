import React from 'react';

interface Step4Props {
  onNext: () => void;
  onBack: () => void;
}

const mockShots = [
    { scene: 1, url: 'https://picsum.photos/seed/shot1/400/300' },
    { scene: 2, url: 'https://picsum.photos/seed/shot2/400/300' },
    { scene: 3, url: 'https://picsum.photos/seed/shot3/400/300' },
    { scene: 4, url: 'https://picsum.photos/seed/shot4/400/300' },
];

export const Step4_ShotEditor: React.FC<Step4Props> = ({ onNext, onBack }) => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white tracking-tight">Edit Your Shots</h1>
        <p className="mt-2 text-lg text-slate-400">Refine the AI-generated visuals for each scene or generate new ones.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {mockShots.map(shot => (
          <div key={shot.scene} className="relative group bg-slate-800 rounded-lg overflow-hidden">
            <img src={shot.url} alt={`Shot for scene ${shot.scene}`} className="w-full h-full object-cover aspect-[4/3]"/>
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="bg-white/20 backdrop-blur-sm text-white font-semibold py-2 px-4 rounded-lg">Regenerate</button>
            </div>
            <div className="absolute bottom-0 left-0 bg-black/50 text-white text-sm px-2 py-1">Scene {shot.scene}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 flex justify-center gap-4">
        <button onClick={onBack} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">Back</button>
        <button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">Next: Audio</button>
      </div>
    </div>
  );
};
