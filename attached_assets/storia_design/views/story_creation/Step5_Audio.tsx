import React from 'react';

interface Step5Props {
  onNext: () => void;
  onBack: () => void;
}

export const Step5_Audio: React.FC<Step5Props> = ({ onNext, onBack }) => {
  return (
    <div className="max-w-3xl mx-auto text-center">
      <h1 className="text-4xl font-bold text-white tracking-tight">Add Audio</h1>
      <p className="mt-2 text-lg text-slate-400">Choose a voice for narration and select background music.</p>
      
      <div className="mt-8 text-left space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Voiceover</label>
          <select className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Narrator (Deep)</option>
            <option>Friendly Female</option>
            <option>Energetic Male</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Background Music</label>
          <select className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Uplifting Corporate</option>
            <option>Cinematic Epic</option>
            <option>Lo-fi Chill</option>
            <option>None</option>
          </select>
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-4">
        <button onClick={onBack} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">Back</button>
        <button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">Preview Video</button>
      </div>
    </div>
  );
};
