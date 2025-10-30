import React, { useState } from 'react';
import { XMarkIcon, UploadIcon } from './icons';
import { Voice } from '../types';

interface VoiceCreationModalProps {
    onClose: () => void;
    onAddVoice: (voice: Voice) => void;
}

const VoiceCreationModal: React.FC<VoiceCreationModalProps> = ({ onClose, onAddVoice }) => {
    const [name, setName] = useState('');
    const [hasConsented, setHasConsented] = useState(false);

    const handleCreateVoice = () => {
        if (!name || !hasConsented) return;
        const newVoice: Voice = {
            id: `v${Date.now()}`,
            name,
            type: 'voice',
            thumbnailUrl: `https://picsum.photos/seed/${name}/300/300`,
            lastUsed: 'Just now',
        };
        onAddVoice(newVoice);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-6 border-b border-slate-800">
                    <h2 className="font-bold text-white text-lg">Create New Voice Clone</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <XMarkIcon className="w-7 h-7" />
                    </button>
                </header>
                <div className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="voice-name">Voice Name</label>
                        <input type="text" id="voice-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., My Narrator Voice" className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Voice Sample</label>
                        <div className="border-2 border-dashed border-slate-700 rounded-lg p-10 text-center">
                            <UploadIcon className="w-12 h-12 text-slate-500 mx-auto mb-2" />
                            <p className="text-slate-400">Upload a clear audio file (MP3, WAV). Min 1 minute.</p>
                            <button className="mt-2 font-semibold text-blue-400 hover:text-blue-300 text-sm">Browse files</button>
                        </div>
                    </div>
                     <div className="flex items-start gap-3">
                        <input id="consent" type="checkbox" checked={hasConsented} onChange={e => setHasConsented(e.target.checked)} className="mt-1 h-4 w-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500" />
                        <label htmlFor="consent" className="text-sm text-slate-400">
                            I confirm that I have the necessary rights and consent to clone this voice and will use it responsibly.
                        </label>
                    </div>
                </div>
                 <footer className="flex justify-end p-6 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl">
                    <button onClick={onClose} className="text-sm font-semibold text-slate-300 hover:text-white mr-4">Cancel</button>
                    <button onClick={handleCreateVoice} disabled={!name || !hasConsented} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors">Create Voice</button>
                </footer>
            </div>
        </div>
    );
};

export default VoiceCreationModal;
