import React from 'react';
interface StepProps { onNext: () => void; onBack: () => void; }
export const Step4_CastWorld: React.FC<StepProps> = ({ onNext, onBack }) => (
  <div className="max-w-4xl mx-auto space-y-8">
    <header className="text-center">
      <h1 className="text-4xl font-bold text-white tracking-tight">Cast & World</h1>
      <p className="mt-2 text-lg text-slate-400">Define your characters and the world they inhabit.</p>
    </header>
    <div className="text-center p-8 bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-700">
        <h3 className="text-xl font-semibold text-white">Character & World Builder</h3>
        <p className="text-slate-400 mt-2">Use your assets or describe new characters and locations.</p>
    </div>
    <div className="flex justify-center gap-4">
      <button onClick={onBack} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">Back</button>
      <button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">Next</button>
    </div>
  </div>
);
