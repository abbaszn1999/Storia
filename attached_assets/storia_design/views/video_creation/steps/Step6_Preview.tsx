import React from 'react';
import { PlayIcon, ScissorsIcon } from '../../../components/icons';

interface StepProps { 
    onBack: () => void;
    onComplete: () => void;
}

export const Step6_Preview: React.FC<StepProps> = ({ onBack, onComplete }) => (
  <div className="p-8 h-full flex flex-col items-center justify-center">
    <header className="text-center mb-8 flex-shrink-0">
      <h1 className="text-4xl font-bold text-white tracking-tight">Final Preview</h1>
      <p className="mt-2 text-lg text-slate-400">Watch your fully rendered video. One last check before you finish.</p>
    </header>
    
    <div className="w-full max-w-4xl aspect-video bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-700 flex items-center justify-center p-4">
        <div className="text-center text-slate-500">
            <PlayIcon className="w-20 h-20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white">Final Video Render</h3>
            <p className="text-slate-400 mt-2">Your final video will be playable here.</p>
        </div>
    </div>
    
    <div className="mt-8 p-6 bg-slate-800/50 border border-slate-700/50 rounded-lg w-full max-w-4xl">
        <h3 className="font-semibold text-white text-lg mb-4">Post-Processing Actions</h3>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <ScissorsIcon className="w-6 h-6 text-blue-400" />
                <div>
                    <h4 className="font-semibold text-slate-300">Auto-generate Shorts</h4>
                    <p className="text-sm text-slate-400">Let AI find the best hooks and create short-form clips from your video.</p>
                </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" value="" className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
        </div>
    </div>

    <div className="flex justify-center gap-4 pt-8 flex-shrink-0">
      <button onClick={onBack} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">Back</button>
      <button onClick={onComplete} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">Finish & Go to History</button>
    </div>
  </div>
);
