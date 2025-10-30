import React, { useState } from 'react';
import { GlobeAmericasIcon, PlusIcon, UserCircleIcon } from '../../../components/icons';

interface StepProps { 
    onNext: () => void; 
    onBack: () => void; 
}

const styles = [
    { name: '3D Cute', img: 'https://picsum.photos/seed/style1/200/200' },
    { name: 'Realistic', img: 'https://picsum.photos/seed/style2/200/200' },
    { name: '3D Cartoon', img: 'https://picsum.photos/seed/style3/200/200' },
    { name: 'Disney 2.0', img: 'https://picsum.photos/seed/style4/200/200' },
    { name: 'Pixar', img: 'https://picsum.photos/seed/style5/200/200' },
    { name: 'Animate 2.0', img: 'https://picsum.photos/seed/style6/200/200' },
];

const mockCharacters = [
    { id: 'char1', name: 'Max', description: "A young boy, about 7 years old, with messy brown hair and a confident smirk." },
    { id: 'char2', name: 'Teacher', description: "A kind woman in her 30s with her hair in a bun and a gentle smile." },
]

export const Step3_WorldAndCast: React.FC<StepProps> = ({ onNext, onBack }) => {
    const [activeStyle, setActiveStyle] = useState('3D Cartoon');

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-8">
            <header className="text-center">
                <GlobeAmericasIcon className="w-16 h-16 mx-auto text-slate-500 mb-4" />
                <h1 className="text-4xl font-bold text-white tracking-tight">World & Cast</h1>
                <p className="mt-2 text-lg text-slate-400">Establish a consistent visual identity for your video.</p>
            </header>
            
            <div className="space-y-6">
                <div>
                    <h3 className="font-semibold text-white mb-2 text-lg">Art Style</h3>
                     <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                        {styles.map(style => (
                            <button key={style.name} onClick={() => setActiveStyle(style.name)} className={`relative rounded-lg overflow-hidden border-2 aspect-square ${activeStyle === style.name ? 'border-blue-500' : 'border-slate-700/50 hover:border-slate-500'}`}>
                                <img src={style.img} alt={style.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 flex items-end justify-center">
                                    <span className="text-xs font-semibold p-1">{style.name}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-white mb-2 text-lg">AI Models</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="image-model" className="block text-sm font-medium text-slate-300 mb-1">Image Model</label>
                            <select id="image-model" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                                <option>FLUX</option>
                                <option>MidJourney</option>
                                <option>DALL-E 3</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="voice-model" className="block text-sm font-medium text-slate-300 mb-1">Voiceover Model</label>
                            <select id="voice-model" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                                <option>ElevenLabs</option>
                                <option>OpenAI TTS</option>
                            </select>
                        </div>
                    </div>
                </div>

                 <div>
                    <h3 className="font-semibold text-white mb-2 text-lg">World Description</h3>
                    <textarea 
                        rows={3}
                        defaultValue="A bright, colorful elementary school playground on a sunny day. The mood is cheerful and idyllic."
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <h3 className="font-semibold text-white mb-2 text-lg">Character Casting</h3>
                     <div className="space-y-4">
                        {mockCharacters.map(char => (
                             <div key={char.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-bold text-white">{char.name}</h4>
                                        <p className="text-sm text-slate-400 mt-1 mb-3">{char.description}</p>
                                        <button className="text-sm font-semibold bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-md">Generate Character Sheet</button>
                                    </div>
                                    <div className="bg-slate-800 rounded-md flex items-center justify-center p-2 border-2 border-dashed border-slate-700">
                                        <div className="text-center text-slate-500">
                                            <UserCircleIcon className="w-10 h-10 mx-auto" />
                                            <p className="text-xs mt-1">Character sheet will appear here for approval.</p>
                                        </div>
                                    </div>
                                </div>
                             </div>
                        ))}
                     </div>
                </div>
            </div>

            <div className="flex justify-center gap-4 pt-4">
                <button onClick={onBack} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">Back</button>
                <button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">Next</button>
            </div>
        </div>
    );
};