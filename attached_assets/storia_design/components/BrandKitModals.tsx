import React, { useState } from 'react';
import { XMarkIcon, UploadIcon } from './icons';
import { BrandAsset } from '../types';

interface BrandKitCreationModalProps {
    onClose: () => void;
    onAddBrandKit: (kit: BrandAsset) => void;
}

export const BrandKitCreationModal: React.FC<BrandKitCreationModalProps> = ({ onClose, onAddBrandKit }) => {
    const [name, setName] = useState('');
    const [colors, setColors] = useState<string[]>(['#FFFFFF', '#000000', '#3B82F6', '', '', '']);

    const handleColorChange = (index: number, value: string) => {
        const newColors = [...colors];
        newColors[index] = value;
        setColors(newColors);
    };

    const handleCreateKit = () => {
        if (!name) return;
        const newKit: BrandAsset = {
            id: `bk${Date.now()}`,
            name,
            type: 'brand_kit',
            thumbnailUrl: `https://picsum.photos/seed/${name}/300/300`, // Placeholder for logo
            lastUsed: 'Just now',
            colors: colors.filter(c => c),
        };
        onAddBrandKit(newKit);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-6 border-b border-slate-800">
                    <h2 className="font-bold text-white text-lg">Create New Brand Kit</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <XMarkIcon className="w-7 h-7" />
                    </button>
                </header>
                <div className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="kit-name">Kit Name</label>
                        <input type="text" id="kit-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., My Company Brand" className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Logo</label>
                        <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center">
                            <UploadIcon className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                            <p className="text-slate-400 text-sm">Upload your logo (PNG, SVG)</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Brand Colors</label>
                        <div className="grid grid-cols-6 gap-3">
                            {colors.map((color, index) => (
                                <div key={index} className="relative w-full aspect-square">
                                    <input type="color" value={color} onChange={e => handleColorChange(index, e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <div className="w-full h-full rounded-md border-2 border-slate-700" style={{ backgroundColor: color || '#1e293b' }}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                 <footer className="flex justify-end p-6 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl">
                    <button onClick={onClose} className="text-sm font-semibold text-slate-300 hover:text-white mr-4">Cancel</button>
                    <button onClick={handleCreateKit} disabled={!name} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors">Create Brand Kit</button>
                </footer>
            </div>
        </div>
    );
};
