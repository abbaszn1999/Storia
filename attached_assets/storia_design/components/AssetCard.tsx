import React from 'react';
import { Character, Voice, BrandAsset, Upload } from '../types';
import { EllipsisVerticalIcon, UserCircleIcon, SpeakerWaveIcon, SwatchIcon, PhotoIcon } from './icons';

type Asset = Character | Voice | BrandAsset | Upload;

interface AssetCardProps {
  asset: Asset;
}

const typeDetails: { [key in Asset['type']]: { icon: React.FC<any>, color: string, label: string } } = {
  character: { icon: UserCircleIcon, color: 'text-blue-400', label: 'Character' },
  voice: { icon: SpeakerWaveIcon, color: 'text-green-400', label: 'Voice' },
  brand_kit: { icon: SwatchIcon, color: 'text-purple-400', label: 'Brand Kit' },
  upload: { icon: PhotoIcon, color: 'text-orange-400', label: 'Upload' },
};

export const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
    const details = typeDetails[asset.type];
    const Icon = details.icon;
  return (
    <div className="bg-slate-800/50 rounded-lg overflow-hidden group transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50 border border-slate-700/50 hover:border-slate-600">
      <div className="relative">
        <img src={asset.thumbnailUrl} alt={asset.name} className="w-full h-40 object-cover" />
        <button className="absolute top-2 right-2 bg-slate-900/50 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <EllipsisVerticalIcon className="w-5 h-5 text-white" />
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-white truncate">{asset.name}</h3>
        <div className="flex items-center justify-between mt-2">
            <div className={`flex items-center gap-2 text-xs font-medium ${details.color}`}>
                <Icon className="w-4 h-4" />
                <span>{details.label}</span>
            </div>
             {asset.type === 'character' && (
                <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-full">{asset.gender}</span>
             )}
             {asset.type === 'brand_kit' && (
                <div className="flex items-center gap-1">
                    {asset.colors.slice(0, 3).map((color, i) => (
                        <div key={i} className="w-3 h-3 rounded-full border border-slate-500" style={{ backgroundColor: color }}></div>
                    ))}
                </div>
            )}
        </div>
        <p className="text-sm text-slate-500 mt-3">Last used: {asset.lastUsed}</p>
      </div>
    </div>
  );
};
