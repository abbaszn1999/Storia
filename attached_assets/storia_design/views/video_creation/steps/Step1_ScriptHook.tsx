import React, { useState } from 'react';
import { LandscapeIcon, PortraitIcon } from '../../../components/icons';

interface StepProps {
  onNext: () => void;
}

const mockScript = "A young boy named Max often believed he knew best, confident in his own judgment, sometimes to the point of ignoring others. One sunny day, his teacher gathered the class and issued a clear warning: the big slide on the playground was undergoing repairs and was strictly off-limits. 'Do not go near the big slide,' she instructed, 'it’s being fixed.'\n\nMax, however, paid little heed. He mused, 'I'll be careful,' convinced he could manage the situation on his own. Despite the teacher's admonition, he made his way to the forbidden slide. He didn't consider the potential dangers; his only thought was to enjoy himself in his own way. Max climbed the ladder, his face alight with anticipation.\n\nBut as he reached the top, his foot slipped on a loose patch. Max tumbled down, landing awkwardly at the bottom. He cried out in pain, his leg throbbing, and his clothes now stained with mud from the ground. Alone and hurt, he sat there, a wave of regret washing over him. He wished, more than anything, that he had simply listened.\n\nSoon after, the teacher approached him. With gentle hands, she carefully bandaged his injured leg. 'Rules are here to keep you safe,' she explained softly, her voice kind. 'Listening can protect you from harm.' Max absorbed her words. He finally understood that listening wasn't about being bossed around; it was about ensuring his safety and growing into a more discerning person. From that day on, Max learned a valuable lesson: listen first, and you’ll go further in life.";

export const Step1_Concept: React.FC<StepProps> = ({ onNext }) => {
    const [aspectRatio, setAspectRatio] = useState('landscape');
    const [script, setScript] = useState(mockScript);

    return (
        <div className="h-full flex flex-col">
            <div className="bg-slate-800/50 text-center py-2 text-sm">
                Google Nano Banana Re-gen Pro is now in our product — for precise edits and lifelike characters!
            </div>
            <div className="flex-grow flex p-6 gap-6">
                {/* Left Sidebar */}
                <aside className="w-80 flex-shrink-0 flex flex-col gap-6">
                    <div>
                        <h3 className="font-semibold mb-2 text-slate-300">Aspect Ratio</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setAspectRatio('landscape')} className={`flex flex-col items-center p-3 rounded-lg border-2 ${aspectRatio === 'landscape' ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}`}>
                                <LandscapeIcon className="w-8 h-8 mb-1" />
                                <span className="font-semibold text-sm">Landscape</span>
                                <span className="text-xs text-slate-400">16:9, 4:3</span>
                            </button>
                             <button onClick={() => setAspectRatio('portrait')} className={`flex flex-col items-center p-3 rounded-lg border-2 ${aspectRatio === 'portrait' ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}`}>
                                <PortraitIcon className="w-8 h-8 mb-1" />
                                <span className="font-semibold text-sm">Portrait</span>
                                <span className="text-xs text-slate-400">9:16, 3:4</span>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="language" className="font-semibold mb-2 text-slate-300 block">Video Language</label>
                        <select id="language" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500">
                            <option>العربية</option>
                            <option>English</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="genre" className="font-semibold mb-2 text-slate-300 block">Genre</label>
                        <select id="genre" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500">
                            <option>Action</option>
                            <option>Animation</option>
                            <option>Comedy</option>
                            <option>Romance</option>
                            <option>Mystery</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="scenes" className="font-semibold mb-2 text-slate-300 block">Number of Scenes</label>
                        <select id="scenes" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500">
                            <option>Auto</option>
                            <option>3</option>
                            <option>4</option>
                            <option>5</option>
                            <option>6</option>
                        </select>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-grow flex flex-col bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
                    <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-700/50 mb-2">
                        <div className="flex">
                            <button className="px-4 py-2 text-sm font-semibold border-b-2 border-white">Smart Script</button>
                            <button className="px-4 py-2 text-sm font-semibold text-slate-400">Basic Script</button>
                        </div>
                        <div className="w-48">
                             <label htmlFor="text-model" className="block text-xs font-medium text-slate-400 mb-1 text-right">Text Model</label>
                            <select id="text-model" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-1.5 focus:ring-blue-500 focus:border-blue-500 text-xs">
                                <option>Gemini</option>
                                <option>GPT-4</option>
                                <option>Claude 3</option>
                            </select>
                        </div>
                    </div>
                    <textarea 
                        value={script}
                        onChange={e => setScript(e.target.value)}
                        className="flex-grow w-full bg-transparent p-4 text-slate-300 focus:outline-none resize-none"
                    />
                    <div className="flex justify-between items-center text-sm text-slate-400">
                        <button className="bg-yellow-400/20 text-yellow-300 font-semibold px-3 py-1 rounded-md text-xs">✨ Expansion</button>
                        <span>{script.length}/2000</span>
                    </div>
                </main>
            </div>
             {/* Bottom Bar */}
            <div className="flex-shrink-0 flex items-center justify-center gap-4 p-4 border-t border-slate-800">
                <span className="font-semibold text-slate-300">Duration</span>
                <div className="flex items-center gap-2">
                    {['Auto', '3-5min', '5-10min', '10-20min', '20-30min', 'Custom'].map(dur => (
                        <button key={dur} className={`px-4 py-1.5 rounded-full text-sm font-semibold ${dur === 'Auto' ? 'bg-white text-slate-900' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}>
                            {dur}
                        </button>
                    ))}
                </div>
            </div>
             <div className="flex justify-center p-4">
                 <button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">Next</button>
            </div>
        </div>
    );
};