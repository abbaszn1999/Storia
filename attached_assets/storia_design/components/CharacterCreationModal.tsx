import React, { useState } from 'react';
import { XMarkIcon, DocumentTextIcon, PhotoIcon } from './icons';
import { Character } from '../types';

interface CharacterCreationModalProps {
    onClose: () => void;
    onAddCharacter: (character: Character) => void;
}

type CreationStep = 'details' | 'method' | 'prompt' | 'upload';

const CharacterCreationModal: React.FC<CharacterCreationModalProps> = ({ onClose, onAddCharacter }) => {
    const [step, setStep] = useState<CreationStep>('details');
    const [name, setName] = useState('');
    const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');

    const handleCreateCharacter = () => {
        if (!name) return;
        const newCharacter: Character = {
            id: `c${Date.now()}`,
            name,
            gender,
            type: 'character',
            thumbnailUrl: `https://i.pravatar.cc/300?u=${name}`,
            lastUsed: 'Just now',
        };
        onAddCharacter(newCharacter);
        onClose();
    };
    
    const renderStep = () => {
        switch(step) {
            case 'details':
                return (
                    <>
                        <p className="text-slate-400 mb-6">Give your new character a name and gender.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="char-name">Character Name</label>
                                <input type="text" id="char-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Commander Valerius" className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Gender</label>
                                <div className="flex gap-2">
                                    {(['Male', 'Female', 'Other'] as const).map(g => (
                                        <button key={g} onClick={() => setGender(g)} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${gender === g ? 'bg-white text-slate-900' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}>{g}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                );
            case 'method':
                 return (
                    <div className="space-y-4">
                        <p className="text-slate-400 mb-6">How would you like to create <span className="font-bold text-white">{name}</span>?</p>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setStep('prompt')} className="text-left p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg">
                                <DocumentTextIcon className="w-8 h-8 text-blue-400 mb-2" />
                                <h4 className="font-semibold text-white">Describe Appearance</h4>
                                <p className="text-sm text-slate-400">Use a prompt to create your character.</p>
                            </button>
                            <button onClick={() => setStep('upload')} className="text-left p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg">
                                <PhotoIcon className="w-8 h-8 text-blue-400 mb-2" />
                                <h4 className="font-semibold text-white">Upload Photos</h4>
                                <p className="text-sm text-slate-400">Use 3 or more photos for consistency.</p>
                            </button>
                        </div>
                    </div>
                 );
            case 'prompt':
                return (
                     <div>
                        <p className="text-slate-400 mb-6">Describe your character's appearance, clothing, and style.</p>
                        <textarea rows={5} placeholder="e.g., A rugged space captain with a cybernetic eye, wearing a worn leather jacket..." className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                    </div>
                );
             case 'upload':
                return (
                    <div>
                        <p className="text-slate-400 mb-6">Upload at least 3 photos of the person from different angles.</p>
                        <div className="border-2 border-dashed border-slate-700 rounded-lg p-10 text-center">
                            <PhotoIcon className="w-12 h-12 text-slate-500 mx-auto mb-2" />
                            <p className="text-slate-400">Drag & drop files or <button className="font-semibold text-blue-400 hover:text-blue-300">browse</button></p>
                        </div>
                    </div>
                );
        }
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-6 border-b border-slate-800">
                    <h2 className="font-bold text-white text-lg">Create New Character</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <XMarkIcon className="w-7 h-7" />
                    </button>
                </header>
                <div className="p-8 min-h-[250px]">{renderStep()}</div>
                <footer className="flex justify-between items-center p-6 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl">
                     <button onClick={step === 'details' ? onClose : () => setStep('details')} className="text-sm font-semibold text-slate-300 hover:text-white">
                        {step === 'details' ? 'Cancel' : 'Back'}
                    </button>
                    {step === 'details' && <button onClick={() => setStep('method')} disabled={!name} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors">Next</button>}
                    {(step === 'prompt' || step === 'upload') && <button onClick={handleCreateCharacter} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Create Character</button>}
                </footer>
            </div>
        </div>
    );
};

export default CharacterCreationModal;
