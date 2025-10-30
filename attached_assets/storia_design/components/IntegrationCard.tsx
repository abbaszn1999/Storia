import React from 'react';
import { CheckIcon } from './icons';

interface IntegrationCardProps {
    name: string;
    description: string;
    icon: React.FC<any>;
    isConnected: boolean;
    onConnect: () => void;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({ name, description, icon: Icon, isConnected, onConnect }) => {
    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 flex flex-col">
            <div className="flex items-center justify-between">
                <Icon className="w-10 h-10 text-white" />
                {isConnected && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold bg-green-500/20 text-green-300 px-2.5 py-1 rounded-full">
                        <CheckIcon className="w-4 h-4" />
                        <span>Connected</span>
                    </div>
                )}
            </div>
            <div className="flex-grow mt-4">
                <h3 className="text-xl font-bold text-white">{name}</h3>
                <p className="text-slate-400 mt-2 text-sm">{description}</p>
            </div>
            <div className="mt-6">
                <button
                    onClick={onConnect}
                    className={`w-full font-bold py-2.5 rounded-lg transition-colors text-sm ${
                        isConnected
                            ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                            : 'bg-white text-slate-900 hover:bg-slate-200'
                    }`}
                >
                    {isConnected ? 'Disconnect' : 'Connect'}
                </button>
            </div>
        </div>
    );
};