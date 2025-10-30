import React, { useState } from 'react';

interface Step2Props {
  onNext: () => void;
  onBack: () => void;
}

export const Step2_Script: React.FC<Step2Props> = ({ onNext, onBack }) => {
  const [script, setScript] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = () => {
    setIsLoading(true);
    setTimeout(() => {
        setScript(`Scene 1: A programmer is staring at a screen full of errors. The frustration is visible.
Narrator: "Tired of endless bugs and confusing code?"

Scene 2: The programmer discovers Kalema. Their eyes light up.
Narrator: "Meet Kalema, your AI video creation partner."

Scene 3: Quick cuts of amazing videos being created effortlessly with Kalema.
Narrator: "Create stunning videos from simple text prompts. No experience needed."

Scene 4: The programmer, now relaxed and happy, shares their new video. It's getting lots of likes.
Narrator: "Go from idea to viral sensation in minutes. Try Kalema today."`);
        setIsLoading(false);
    }, 1500);
  };


  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white tracking-tight">Write Your Script</h1>
        <p className="mt-2 text-lg text-slate-400">Describe your video topic, and our AI will generate a script for you.</p>
      </div>
      
      <div className="mt-8 space-y-4">
        <textarea 
          rows={3} 
          className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., A 30-second ad for an AI video generation app named Kalema."
        />
        <button 
          onClick={handleGenerate} 
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors"
        >
          {isLoading ? 'Generating...' : 'Generate Script'}
        </button>
      </div>
      
      <div className="mt-6">
        <textarea 
          rows={10} 
          value={script}
          onChange={(e) => setScript(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Your generated script will appear here..."
        />
      </div>

      <div className="mt-8 flex justify-center gap-4">
        <button onClick={onBack} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">Back</button>
        <button onClick={onNext} disabled={!script} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors">Next: Scenes</button>
      </div>
    </div>
  );
};
