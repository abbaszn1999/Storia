import React from 'react';
import { View } from '../types';
import { CrownIcon, CreditIcon, UserCircleIcon, SettingsIcon, HistoryIcon } from './icons';

interface ProfileDropdownProps {
    onSubscribeClick: () => void;
    setActiveView: (view: View) => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onSubscribeClick, setActiveView }) => {
    const menuItems = [
        { label: 'Subscribe', icon: CrownIcon, action: onSubscribeClick, highlight: true },
        { label: '215 Credits', icon: CreditIcon, action: () => {} },
        { label: 'My Profile', icon: UserCircleIcon, action: () => setActiveView('profile') },
        { label: 'Settings', icon: SettingsIcon, action: () => setActiveView('settings') },
        { label: 'Log out', icon: HistoryIcon, action: () => {}, separate: true },
    ];

    return (
        <div className="absolute top-full right-0 mt-3 w-60 bg-slate-800 rounded-lg shadow-2xl border border-slate-700/50 z-50 overflow-hidden">
            <div className="p-2">
                {menuItems.map((item, index) => (
                    <div key={index}>
                    {item.separate && <div className="h-px bg-slate-700/50 my-2"></div>}
                    <button
                        onClick={item.action}
                        className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                        item.highlight
                            ? 'text-yellow-400 hover:bg-slate-700/80'
                            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                        }`}
                    >
                        <item.icon className={`w-5 h-5 ${item.highlight ? 'text-yellow-400' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                    </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProfileDropdown;