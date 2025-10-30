import React from 'react';
import { PlayIcon, ArrowPathIcon, PlusIcon, TransitionIcon } from '../../../components/icons';

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

const mockScenes = [
    {
        id: 's1',
        title: 'Scene 1',
        location: 'Eldor Manor entrance',
        lighting: 'Soft sunlight',
        weather: 'Clear sky',
        videoModel: 'Runway',
        sceneSound: [],
        shots: [
            { id: 'sh1', img: 'https://i.imgur.com/K1Lg5kI.png', desc: "The Smith family's car pulls up the grand driveway of Eldor Manor, surrounded by ancient trees and overgrown ivy.", shotType: 'wideShot', motionScale: 3, dialogue: [], sfx: [] },
            { id: 'sh2', img: 'https://i.imgur.com/00TFg0r.png', desc: "Robert and Amelia unload boxes and furniture from the car, looking up in awe at the imposing mansion ahead.", shotType: 'mediumShot', motionScale: 2, dialogue: [], sfx: [] },
            { id: 'sh3', img: 'https://i.imgur.com/jM3wK8a.png', desc: "Thomas and Clara excitedly point at the intricate carvings and imposing front doors of Eldor Manor.", shotType: 'closeUp', motionScale: 2, dialogue: [], sfx: [] },
            { id: 'sh4', img: 'https://i.imgur.com/c6FQL5S.png', desc: "The family walks up the stone steps, revealing the grandeur of the mansion's architecture as they approach the entrance.", shotType: 'pointOfView', motionScale: 4, dialogue: [], sfx: [] },
            { id: 'sh5', img: 'https://i.imgur.com/vHqJ9Jp.png', desc: "The family stands in front of the massive oak doors, marveling at the intricate details and ancient aura of the mansion.", shotType: 'mediumShot', motionScale: 1, dialogue: [], sfx: [] },
        ]
    },
    {
        id: 's2',
        title: 'Scene 2',
        location: 'Eldor Manor interior',
        lighting: 'Dim candlelight',
        weather: 'Indoor',
        videoModel: 'Kling',
        sceneSound: [],
        shots: [
            { id: 'sh6', img: 'https://i.imgur.com/sXyIeCv.png', desc: "Sunlight filtering through grand windows, illuminating ornate furniture and tapestries.", shotType: 'wideShot', motionScale: 1, dialogue: [], sfx: [] },
            { id: 'sh7', img: 'https://i.imgur.com/mYlG1P8.png', desc: "Thomas cautiously opens a creaking wooden door, revealing a dimly lit hallway beyond.", shotType: 'mediumShot', motionScale: 2, dialogue: [], sfx: [] },
            { id: 'sh8', img: 'https://i.imgur.com/xHq3E8R.png', desc: "Clara runs her fingers along an ancient, dust-covered portrait, revealing the face of Lady Isabella.", shotType: 'closeUp', motionScale: 2, dialogue: [], sfx: [] },
            { id: 'sh9', img: 'https://i.imgur.com/8QG3y4H.png', desc: "A shadowy figure moves in the reflection of a tarnished silver mirror, unseen by the characters.", shotType: 'pointOfView', motionScale: 3, dialogue: [], sfx: [] },
            { id: 'sh10', img: 'https://i.imgur.com/kK5tX6Y.png', desc: "Amelia lights a candle, casting a warm glow that flickers across the ornate, cobweb-draped furnishings.", shotType: 'mediumShot', motionScale: 2, dialogue: [], sfx: [] },
        ]
    }
];

export const Step4_Storyboard: React.FC<StepProps> = ({ onNext, onBack }) => {
    return (
        <div className="p-6 space-y-6">
            {mockScenes.map(scene => (
                <div key={scene.id} className="bg-slate-900/70 p-4 rounded-lg">
                    <div className="grid grid-cols-[200px_1fr] gap-6">
                        {/* Scene Metadata */}
                        <aside>
                            <h2 className="text-xl font-bold mb-4">{scene.title}</h2>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <h4 className="text-slate-400 font-semibold">Location</h4>
                                    <p>{scene.location}</p>
                                </div>
                                <div>
                                    <h4 className="text-slate-400 font-semibold">Lighting</h4>
                                    <p>{scene.lighting}</p>
                                </div>
                                <div>
                                    <h4 className="text-slate-400 font-semibold">Weather</h4>
                                    <p>{scene.weather}</p>
                                </div>
                                <div>
                                    <label htmlFor={`scene-duration-${scene.id}`} className="text-slate-400 font-semibold">Scene Duration</label>
                                    <input
                                        id={`scene-duration-${scene.id}`}
                                        type="text"
                                        placeholder="e.g. 15s"
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-1.5 focus:ring-blue-500 focus:border-blue-500 text-xs mt-1"
                                    />
                                </div>
                                <div>
                                    <label htmlFor={`video-model-${scene.id}`} className="text-slate-400 font-semibold">Video Model</label>
                                    <select id={`video-model-${scene.id}`} defaultValue={scene.videoModel} className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-1.5 focus:ring-blue-500 focus:border-blue-500 text-xs mt-1">
                                        <option>Runway</option>
                                        <option>Kling</option>
                                        <option>Minimax</option>
                                        <option>Luma</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <h4 className="text-slate-400 font-semibold">Scene sound</h4>
                                    <button className="text-slate-400 hover:text-white"><PlusIcon className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </aside>

                        {/* Shots */}
                        <div className="flex gap-2 items-center overflow-x-auto pb-4">
                            {scene.shots.map((shot, index) => (
                                <React.Fragment key={shot.id}>
                                    <div className="w-64 flex-shrink-0 bg-slate-800/50 p-3 rounded-md space-y-2 border border-slate-700/50">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold">Shot {index + 1}</h3>
                                            <div className="flex items-center gap-2">
                                                <button className="text-slate-400 hover:text-white"><PlayIcon className="w-4 h-4" /></button>
                                                <button className="text-slate-400 hover:text-white"><ArrowPathIcon className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                        <img src={shot.img} alt={`Shot ${index + 1}`} className="w-full h-32 object-cover rounded" />
                                        <textarea defaultValue={shot.desc} rows={3} className="w-full bg-slate-800 text-sm p-1 rounded-sm border border-slate-700 focus:ring-blue-500 focus:border-blue-500 resize-none"></textarea>
                                        <div className="text-xs space-y-1 pt-1">
                                            <div className="flex items-center justify-between">
                                                <label htmlFor={`shot-vm-${shot.id}`} className="text-slate-300">Video Model</label>
                                                <select id={`shot-vm-${shot.id}`} className="bg-slate-700 text-white rounded px-1.5 py-0.5 max-w-[100px] text-xs">
                                                    <option>Scene Default</option>
                                                    <option>Runway</option>
                                                    <option>Kling</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <label htmlFor={`shot-duration-${shot.id}`} className="text-slate-300">Duration</label>
                                                <input id={`shot-duration-${shot.id}`} type="text" defaultValue="3.5s" className="bg-slate-700 text-white rounded px-1.5 py-0.5 w-12 text-center text-xs" />
                                            </div>
                                            <div className="flex items-center justify-between"><span>Shot type</span><span className="bg-slate-700 px-1.5 py-0.5 rounded">{shot.shotType}</span></div>
                                            <div className="flex items-center justify-between"><span>Motion scale</span><span className="bg-slate-700 px-1.5 py-0.5 rounded">{shot.motionScale}</span></div>
                                            <div className="flex items-center justify-between"><span>Character dialogue</span><button className="text-slate-400 hover:text-white"><PlusIcon className="w-3 h-3" /></button></div>
                                            <div className="flex items-center justify-between"><span>SFX</span><button className="text-slate-400 hover:text-white"><PlusIcon className="w-3 h-3" /></button></div>
                                        </div>
                                    </div>
                                     {index < scene.shots.length - 1 && (
                                        <div className="flex-shrink-0">
                                            <button className="p-2 rounded-full bg-slate-900/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors border border-slate-700/50">
                                                <TransitionIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
            <div className="flex justify-center gap-4 pt-4">
                <button onClick={onBack} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">Back</button>
                <button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">Next</button>
            </div>
        </div>
    );
};