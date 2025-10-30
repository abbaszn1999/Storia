import React, { useState } from 'react';
import { PhotoIcon, UploadIcon, VideoIcon } from '../../components/icons';
import { View } from '../../types';

interface DirectToVideoGeneratorProps {
    onExit: () => void;
    onComplete: (view: View) => void;
}

export const DirectToVideoGenerator: React.FC<DirectToVideoGeneratorProps> = ({ onExit, onComplete }) => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    const handleGenerate = () => {
        if (!prompt) return;
        setIsGenerating(true);
        setVideoUrl(null);
        setTimeout(() => {
            // Mock generation
            setVideoUrl('https://i.imgur.com/8nL3bJ0.mp4'); // Using a placeholder URL
            setIsGenerating(false);
        }, 3000);
    };
    
    const handleFinish = () => {
        onComplete('history');
    }

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white tracking-tight">ASMR / Sensory Video Generator</h1>
                <p className="mt-2 text-lg text-slate-400">Describe the scene and sounds you want to create.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Controls */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="prompt">Prompt</label>
                        <textarea
                            id="prompt"
                            rows={6}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., A sharp knife cleanly slicing a crisp green apple, with high-fidelity cutting sounds and a clean white background."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Reference Image (Optional)</label>
                        <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                            <UploadIcon className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                            <p className="text-slate-400 text-sm">Drag & drop or <button className="font-semibold text-blue-400 hover:text-blue-300">browse</button></p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="aspect-ratio">Aspect Ratio</label>
                            <select id="aspect-ratio" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                                <option>9:16 (Vertical)</option>
                                <option>16:9 (Horizontal)</option>
                                <option>1:1 (Square)</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="duration">Duration</label>
                             <select id="duration" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
                                <option>15 seconds</option>
                                <option>30 seconds</option>
                                <option>60 seconds</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Preview & Actions */}
                <div className="flex flex-col">
                    <div className="flex-grow bg-slate-800/50 border-2 border-slate-700 rounded-lg flex items-center justify-center p-4 aspect-video">
                        {isGenerating ? (
                            <div className="text-center text-slate-400">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                                <p className="mt-4 font-semibold">Generating your masterpiece...</p>
                            </div>
                        ) : videoUrl ? (
                            <video src={videoUrl} controls autoPlay loop className="max-w-full max-h-full rounded"></video>
                        ) : (
                            <div className="text-center text-slate-500">
                                <VideoIcon className="w-16 h-16 mx-auto" />
                                <p className="mt-2 font-semibold">Your video will appear here.</p>
                            </div>
                        )}
                    </div>
                     <div className="mt-6 flex justify-center gap-4">
                        <button onClick={onExit} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">Back to Templates</button>
                        {videoUrl ? (
                             <button onClick={handleFinish} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">Finish & Export</button>
                        ) : (
                            <button onClick={handleGenerate} disabled={!prompt || isGenerating} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors">
                                {isGenerating ? 'Generating...' : 'Generate Video'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
