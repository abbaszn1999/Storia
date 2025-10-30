import React from 'react';
import { PlayIcon, SoundBarsIcon } from '../../../components/icons';

interface StepProps { 
    onBack: () => void;
    onNext: () => void;
}

const suggestedSfx = [
    { id: 'sfx1', name: 'Footsteps on gravel' },
    { id: 'sfx2', name: 'Door creak' },
    { id: 'sfx3', name: 'Wind blowing' },
    { id: 'sfx4', name: 'Candle flicker' },
];

export const Step5_Edit: React.FC<StepProps> = ({ onBack, onNext }) => (
  <div className="p-8 h-full flex flex-col">
    <header className="text-center mb-8 flex-shrink-0">
      <h1 className="text-4xl font-bold text-white tracking-tight">Edit & Finalize Audio</h1>
      <p className="mt-2 text-lg text-slate-400">Review the animatic, adjust audio settings, and prepare for the final preview.</p>
    </header>
    
    <div className="flex-grow flex gap-8">
        {/* Animatic Preview */}
        <div className="flex-1 flex flex-col">
            <div className="flex-grow bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-700 flex items-center justify-center p-4">
                <div className="text-center text-slate-500">
                    <PlayIcon className="w-20 h-20 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white">Animatic Preview</h3>
                    <p className="text-slate-400 mt-2">A preview of your storyboard shots with audio will be shown here.</p>
                </div>
            </div>
        </div>

        {/* Audio & Settings Panel */}
        <aside className="w-96 bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
            <h3 className="font-bold text-white text-xl">Finalize & Export</h3>
            
            {/* Audio Settings */}
            <div className="space-y-3">
                <h4 className="font-semibold text-slate-300 text-lg border-b border-slate-700 pb-2 mb-3">Audio Settings</h4>
                {/* Voiceover Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-slate-300">Voiceover</h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    <div>
                        <label htmlFor="voice-select" className="block text-sm font-medium text-slate-400 mb-1">Voice</label>
                        <select id="voice-select" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                            <option>Narrator (Deep)</option>
                            <option>My Cloned Voice</option>
                            <option>Friendly Female</option>
                        </select>
                    </div>
                </div>

                <div className="border-t border-slate-700/50 my-3"></div>

                {/* Background Music Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-slate-300">Background Music</h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    <div>
                        <label htmlFor="music-style" className="block text-sm font-medium text-slate-400 mb-1">Music Style</label>
                        <select id="music-style" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                            <option>Cinematic Epic</option>
                            <option>Uplifting Corporate</option>
                            <option>Lo-fi Chill</option>
                            <option>AI Composition (Suno)</option>
                            <option>None</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="music-volume" className="block text-sm font-medium text-slate-400 mb-1">Volume</label>
                        <input id="music-volume" type="range" min="0" max="100" defaultValue="70" className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                    </div>
                </div>

                <div className="border-t border-slate-700/50 my-3"></div>

                {/* Sound Effects Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-slate-300">Sound Effects</h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                         {suggestedSfx.map(sfx => (
                            <div key={sfx.id} className="flex items-center justify-between text-sm p-2 bg-slate-900/50 rounded-md">
                                <div className="flex items-center gap-2">
                                    <SoundBarsIcon className="w-4 h-4 text-slate-400" />
                                    <span>{sfx.name}</span>
                                </div>
                                <input type="checkbox" defaultChecked className="h-4 w-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Export Settings */}
            <div className="space-y-3 mt-auto pt-4">
                 <h4 className="font-semibold text-slate-300 text-lg border-b border-slate-700 pb-2 mb-3">Export Settings</h4>
                <div>
                    <label htmlFor="resolution-select" className="block text-sm font-medium text-slate-400 mb-1">Resolution</label>
                    <select id="resolution-select" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                        <option>1080p (Full HD)</option>
                        <option>4K (Ultra HD)</option>
                        <option>720p (HD)</option>
                    </select>
                </div>
                <div className="flex items-center justify-between pt-2">
                    <span className="font-medium text-slate-300">Subtitles</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" value="" className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </div>

        </aside>
    </div>

    <div className="flex justify-center gap-4 pt-8 flex-shrink-0">
      <button onClick={onBack} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">Back</button>
      <button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">Generate Final Preview</button>
    </div>
  </div>
);