import React from 'react';
interface StepProps { onNext: () => void; onBack: () => void; }
export const Step7_Audio: React.FC<StepProps> = ({ onNext, onBack }) => (
  <div className="max-w-3xl mx-auto space-y-8">
    <header className="text-center">
      <h1 className="text-4xl font-bold text-white tracking-tight">Audio</h1>
      <p className="mt-2 text-lg text-slate-400">Add voiceovers, sound effects, and music.</p>
    </header>
    <div className="space-y-6 text-left">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Voiceover</label>
        <select className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white">
          <option>Select a voice from your assets...</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Background Music</label>
        <select className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white">
          <option>Cinematic Epic</option>
        </select>
      </div>
    </div>
    <div className="flex justify-center gap-4">
      <button onClick={onBack} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">Back</button>
      <button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">Next</button>
    </div>
  </div>
);
