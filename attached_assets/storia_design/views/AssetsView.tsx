import React, { useState, useMemo } from 'react';
import { AssetType, Character, Voice, BrandAsset, Upload } from '../types';
import { AssetCard } from '../components/AssetCard';
import { PlusIcon, SearchIcon, UploadIcon } from '../components/icons';
import CharacterCreationModal from '../components/CharacterCreationModal';
import VoiceCreationModal from '../components/VoiceCreationModal';
import { BrandKitCreationModal } from '../components/BrandKitModals';

type AssetFilter = 'all' | AssetType;

export const AssetsView: React.FC = () => {
    const [assetFilter, setAssetFilter] = useState<AssetFilter>('character');
    const [searchQuery, setSearchQuery] = useState('');
    
    const [characters, setCharacters] = useState<Character[]>([
        { id: 'c1', name: 'Abbas Zein', type: 'character', thumbnailUrl: 'https://i.pravatar.cc/300?u=abbaszein', lastUsed: '2 hours ago', gender: 'Male' },
        { id: 'c2', name: 'Female Character 1', type: 'character', thumbnailUrl: 'https://i.pravatar.cc/300?u=female1', lastUsed: '1 week ago', gender: 'Female' },
    ]);
    const [voices, setVoices] = useState<Voice[]>([
        { id: 'v1', name: 'Narrator (Deep)', type: 'voice', thumbnailUrl: 'https://picsum.photos/seed/voice1/300/300', lastUsed: '1 week ago' },
    ]);
    const [brandKits, setBrandKits] = useState<BrandAsset[]>([
        { id: 'b1', name: 'Kalema Official', type: 'brand_kit', thumbnailUrl: 'https://picsum.photos/seed/brand1/300/300', lastUsed: '3 weeks ago', colors: ['#3B82F6', '#8B5CF6', '#FFFFFF'] },
    ]);
    const [uploads, setUploads] = useState<Upload[]>([]);

    const [isCharacterModalOpen, setCharacterModalOpen] = useState(false);
    const [isVoiceModalOpen, setVoiceModalOpen] = useState(false);
    const [isBrandKitModalOpen, setBrandKitModalOpen] = useState(false);

    const allAssets = useMemo(() => [...characters, ...voices, ...brandKits, ...uploads], [characters, voices, brandKits, uploads]);

    const filteredAssets = useMemo(() => {
        let assetsToFilter: (Character | Voice | BrandAsset | Upload)[] = [];
        if (assetFilter === 'all') assetsToFilter = allAssets;
        if (assetFilter === 'character') assetsToFilter = characters;
        if (assetFilter === 'voice') assetsToFilter = voices;
        if (assetFilter === 'brand_kit') assetsToFilter = brandKits;
        if (assetFilter === 'upload') assetsToFilter = uploads;
        
        return assetsToFilter.filter(asset => asset.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [assetFilter, searchQuery, allAssets, characters, voices, brandKits, uploads]);

    const buttonConfig = useMemo(() => {
        switch(assetFilter) {
            case 'character':
                return { label: 'Create Character', action: () => setCharacterModalOpen(true) };
            case 'voice':
                return { label: 'Create Voice', action: () => setVoiceModalOpen(true) };
            case 'brand_kit':
                return { label: 'Create Brand Kit', action: () => setBrandKitModalOpen(true) };
            case 'upload':
                return { label: 'Upload Media', action: () => alert('Upload functionality coming soon!') };
            default:
                return null;
        }
    }, [assetFilter]);

    return (
        <>
            <div className="space-y-8">
                <header>
                    <h1 className="text-4xl font-bold text-white tracking-tight">My Assets</h1>
                    <p className="mt-2 text-lg text-slate-400">Manage your reusable characters, voices, brand kits, and media.</p>
                </header>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        <FilterButton label="All" isActive={assetFilter === 'all'} onClick={() => setAssetFilter('all')} />
                        <FilterButton label="Characters" isActive={assetFilter === 'character'} onClick={() => setAssetFilter('character')} />
                        <FilterButton label="Voices" isActive={assetFilter === 'voice'} onClick={() => setAssetFilter('voice')} />
                        <FilterButton label="Brand Kits" isActive={assetFilter === 'brand_kit'} onClick={() => setAssetFilter('brand_kit')} />
                        <FilterButton label="Uploads" isActive={assetFilter === 'upload'} onClick={() => setAssetFilter('upload')} />
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative w-full md:w-auto flex-grow">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search assets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors w-full md:w-56"
                            />
                        </div>
                        {buttonConfig && (
                            <button onClick={buttonConfig.action} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors flex-shrink-0">
                                <PlusIcon className="w-5 h-5" />
                                <span>{buttonConfig.label}</span>
                            </button>
                        )}
                    </div>
                </div>

                <main>
                    {filteredAssets.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {filteredAssets.map(asset => <AssetCard key={asset.id} asset={asset} />)}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-700">
                            <div className="mb-4 text-slate-600">
                                <UploadIcon className="w-16 h-16 mx-auto" />
                            </div>
                            <h3 className="text-xl font-semibold text-white">No Assets Found</h3>
                            <p className="text-slate-400 mt-2">Try adjusting your filters or create a new asset to get started.</p>
                            {buttonConfig && (
                                <button onClick={buttonConfig.action} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors mx-auto">
                                    <PlusIcon className="w-5 h-5" />
                                    <span>{buttonConfig.label}</span>
                                </button>
                            )}
                        </div>
                    )}
                </main>
            </div>
            {isCharacterModalOpen && <CharacterCreationModal onClose={() => setCharacterModalOpen(false)} onAddCharacter={(char) => setCharacters(prev => [char, ...prev])}/>}
            {isVoiceModalOpen && <VoiceCreationModal onClose={() => setVoiceModalOpen(false)} onAddVoice={(voice) => setVoices(prev => [voice, ...prev])} />}
            {isBrandKitModalOpen && <BrandKitCreationModal onClose={() => setBrandKitModalOpen(false)} onAddBrandKit={(kit) => setBrandKits(prev => [kit, ...prev])} />}
        </>
    );
};

interface FilterButtonProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
}
const FilterButton: React.FC<FilterButtonProps> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors flex-shrink-0 ${
            isActive
                ? 'bg-white text-slate-900'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
        }`}
    >
        {label}
    </button>
);
