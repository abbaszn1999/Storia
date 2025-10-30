import React from 'react';
import { VideoIcon } from '../../components/icons';

interface Step6Props {
  onNext: () => void;
  onBack: () => void;
}

export const Step6_Preview: React.FC<Step6Props> = ({ onNext, onBack }) => {
  return (
    <div className="max-w-4xl mx-auto text-center">
      <h1 className="text-4xl font-bold text-white tracking-tight">Preview & Finalize</h1>
      <p className="mt-2 text-lg text-slate-400">Watch your creation. Go back to any step to make changes.</p>
      
      <div className="mt-8 aspect-video bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg flex items-center justify-center">
        <div className="text-center text-slate-500">
            <VideoIcon className="w-16 h-16 mx-auto"/>
            <p className="mt-2 font-semibold">Video preview will be generated here.</p>
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-4">
        <button onClick={onBack} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">Back</button>
        <button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">Next: Export</button>
      </div>
    </div>
  );
};
