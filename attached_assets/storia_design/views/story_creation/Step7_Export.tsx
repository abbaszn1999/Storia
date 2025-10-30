import React from 'react';

interface Step7Props {
  onNext: () => void;
  onBack: () => void;
}

export const Step7_Export: React.FC<Step7Props> = ({ onNext, onBack }) => {
  return (
    <div className="max-w-3xl mx-auto text-center">
      <h1 className="text-4xl font-bold text-white tracking-tight">Export Your Video</h1>
      <p className="mt-2 text-lg text-slate-400">Choose your desired export settings.</p>

      <div className="mt-8 text-left space-y-6 bg-slate-800/50 p-6 rounded-lg border border-slate-700/50">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Resolution</label>
          <select className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>1080p (Full HD)</option>
            <option>720p (HD)</option>
            <option>480p (SD)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Aspect Ratio</label>
           <div className="flex gap-2">
            <button className="flex-1 py-2 rounded-md font-semibold bg-white text-slate-900">9:16 (Vertical)</button>
            <button className="flex-1 py-2 rounded-md font-semibold bg-slate-700/50 text-slate-300 hover:bg-slate-700">16:9 (Horizontal)</button>
            <button className="flex-1 py-2 rounded-md font-semibold bg-slate-700/50 text-slate-300 hover:bg-slate-700">1:1 (Square)</button>
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-center gap-4">
        <button onClick={onBack} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">Back</button>
        <button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">Render Video</button>
      </div>
    </div>
  );
};
