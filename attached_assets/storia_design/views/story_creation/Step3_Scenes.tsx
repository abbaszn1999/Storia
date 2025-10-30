import React from 'react';

interface Step3Props {
  onNext: () => void;
  onBack: () => void;
}

const mockScenes = [
    { id: 1, narration: "Tired of endless bugs and confusing code?", visual: "A programmer is staring at a screen full of errors. The frustration is visible." },
    { id: 2, narration: "Meet Kalema, your AI video creation partner.", visual: "The programmer discovers Kalema. Their eyes light up." },
    { id: 3, narration: "Create stunning videos from simple text prompts. No experience needed.", visual: "Quick cuts of amazing videos being created effortlessly with Kalema." },
    { id: 4, narration: "Go from idea to viral sensation in minutes. Try Kalema today.", visual: "The programmer, now relaxed and happy, shares their new video. It's getting lots of likes." },
];

export const Step3_Scenes: React.FC<Step3Props> = ({ onNext, onBack }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white tracking-tight">Review Your Scenes</h1>
        <p className="mt-2 text-lg text-slate-400">The script has been broken down into scenes. Edit the narration or visual descriptions for the AI.</p>
      </div>
      <div className="space-y-4">
        {mockScenes.map(scene => (
            <div key={scene.id} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                <h3 className="font-bold text-white mb-2">Scene {scene.id}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Narration</label>
                        <textarea rows={3} defaultValue={scene.narration} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Visual Description</label>
                        <textarea rows={3} defaultValue={scene.visual} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                    </div>
                </div>
            </div>
        ))}
      </div>
      <div className="mt-8 flex justify-center gap-4">
        <button onClick={onBack} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">Back</button>
        <button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">Next: Shots</button>
      </div>
    </div>
  );
};
