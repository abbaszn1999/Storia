import React from 'react';
interface StepProps { onBack: () => void; onComplete: () => void; }
export const Step8_Export: React.FC<StepProps> = ({ onBack, onComplete }) => (
  <div className="max-w-3xl mx-auto space-y-8">
    <header className="text-center">
      <h1 className="text-4xl font-bold text-white tracking-tight">Export</h1>
      <p className="mt-2 text-lg text-slate-400">Finalize your video with export settings.</p>
    </header>
    <div className="space-y-6 text-left p-6 bg-slate-800/50 rounded-lg border border-slate-700/50">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Resolution</label>
        <select className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white">
          <option>1080p (Full HD)</option>
          <option>4K (Ultra HD)</option>
        </select>
      </div>
    </div>
    <div className="flex justify-center gap-4">
      <button onClick={onBack} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">Back</button>
      <button onClick={onComplete} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">Render Video</button>
    </div>
  </div>
);
