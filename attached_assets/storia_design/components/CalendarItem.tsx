import React from 'react';
import { ScheduledItem } from '../types';
import { TikTokIcon, YouTubeIcon } from './icons';

interface CalendarItemProps {
    item: ScheduledItem;
}

const platformDetails = {
    YouTube: { icon: YouTubeIcon, color: 'text-red-500' },
    TikTok: { icon: TikTokIcon, color: 'text-cyan-400' },
};

const statusDetails = {
    Published: { color: 'bg-green-500/20 text-green-300' },
    Scheduled: { color: 'bg-yellow-500/20 text-yellow-300' },
};


export const CalendarItem: React.FC<CalendarItemProps> = ({ item }) => {
    const PlatformIcon = platformDetails[item.platform].icon;
    const platformColor = platformDetails[item.platform].color;
    const statusStyle = statusDetails[item.status].color;

    return (
        <div className="bg-slate-800/50 p-2 rounded-md border border-slate-700/50 cursor-pointer hover:border-blue-500/50">
            <div className="flex items-start gap-2">
                <img src={item.thumbnailUrl} alt={item.title} className="w-10 h-10 object-cover rounded flex-shrink-0" />
                <div className="flex-grow min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                        <PlatformIcon className={`w-3.5 h-3.5 ${platformColor}`} />
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${statusStyle}`}>{item.status}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};