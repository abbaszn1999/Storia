import React from 'react';
interface StepProps { onNext: () => void; onBack: () => void; }
export const Step3_Shotlist: React.FC<StepProps> = ({ onNext, onBack }) => (
  <div className="max-w-4xl mx-auto space-y-8">
    <header className="text-center">
      <h1 className="text-4xl font-bold text-white tracking-tight">Shotlist</h1>
      <p className="mt-2 text-lg text-slate-400">Review and edit the AI-generated shot list for each story beat.</p>
    </header>
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
          <h3 className="font-bold text-white">Shot {i} - Wide Angle</h3>
          <p className="text-slate-400 text-sm mt-1">Wide angle shot of the hero looking at the map against a mountain backdrop.</p>
        </div>
      ))}
    </div>
    <div className="flex justify-center gap-4">
      <button onClick={onBack} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">Back</button>
      <button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">Next</button>
    </div>
  </div>
);
