import React from 'react';
import { CheckIcon } from '../../components/icons';
import { View } from '../../types';

interface CreationSuccessProps {
    onComplete: (view: View) => void;
}

export const CreationSuccess: React.FC<CreationSuccessProps> = ({ onComplete }) => {
  return (
    <div className="max-w-2xl mx-auto text-center py-20">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center">
                <CheckIcon className="w-8 h-8 text-white"/>
            </div>
        </div>
      <h1 className="text-4xl font-bold text-white tracking-tight mt-6">Video Created!</h1>
      <p className="mt-2 text-lg text-slate-400">Your video is now rendering. You can find it in your History page shortly.</p>
      
      <div className="mt-8 flex justify-center gap-4">
        <button onClick={() => onComplete('home')} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">Back to Home</button>
        <button onClick={() => onComplete('history')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">View History</button>
      </div>
    </div>
  );
};