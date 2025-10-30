import React, { useState, useMemo } from 'react';
import { ScheduledItem } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/icons';
import { CalendarItem } from '../components/CalendarItem';

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth();

const mockItems: ScheduledItem[] = [
    { id: 's1', title: 'Summer Vlog Teaser', thumbnailUrl: 'https://picsum.photos/seed/hist2/400/300', platform: 'TikTok', status: 'Published', publishDate: new Date(currentYear, currentMonth, 2) },
    { id: 's2', title: 'The Three Bulls', thumbnailUrl: 'https://i.imgur.com/8nL3bJ0.jpeg', platform: 'YouTube', status: 'Published', publishDate: new Date(currentYear, currentMonth, 10) },
    { id: 's3', title: 'Cybernetic Dawn Trailer', thumbnailUrl: 'https://picsum.photos/seed/proj2/400/300', platform: 'YouTube', status: 'Scheduled', publishDate: new Date(currentYear, currentMonth, 18) },
    { id: 's4', title: 'Unboxing New Gear', thumbnailUrl: 'https://picsum.photos/seed/hist5/400/300', platform: 'TikTok', status: 'Scheduled', publishDate: new Date(currentYear, currentMonth, 25) },
    { id: 's5', title: 'Quick Teaser Ad', thumbnailUrl: 'https://picsum.photos/seed/hist3/400/300', platform: 'TikTok', status: 'Published', publishDate: new Date(currentYear, currentMonth - 1, 28)},
];


export const ContentCalendarView: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const { month, year, daysInMonth, firstDayOfMonth, weeks } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const weeks = [];
        let week = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            week.push(null);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            week.push(day);
            if (week.length === 7) {
                weeks.push(week);
                week = [];
            }
        }
        if (week.length > 0) {
            while (week.length < 7) {
                week.push(null);
            }
            weeks.push(week);
        }
        
        return { year, month, daysInMonth, firstDayOfMonth, weeks };
    }, [currentDate]);

    const itemsByDay = useMemo(() => {
        const map: { [key: number]: ScheduledItem[] } = {};
        mockItems.forEach(item => {
            if (item.publishDate.getFullYear() === year && item.publishDate.getMonth() === month) {
                const day = item.publishDate.getDate();
                if (!map[day]) {
                    map[day] = [];
                }
                map[day].push(item);
            }
        });
        return map;
    }, [year, month]);
    
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate);
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="space-y-8 flex flex-col h-full">
            <header>
                <h1 className="text-4xl font-bold text-white tracking-tight">Content Calendar</h1>
                <p className="mt-2 text-lg text-slate-400">Plan, schedule, and visualize your content pipeline.</p>
            </header>

            <div className="flex justify-between items-center p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                <div className="flex items-center gap-4">
                    <button onClick={goToPreviousMonth} className="p-2 rounded-md hover:bg-slate-700/50">
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <h2 className="text-2xl font-bold text-white w-40 text-center">{monthName} {year}</h2>
                    <button onClick={goToNextMonth} className="p-2 rounded-md hover:bg-slate-700/50">
                        <ChevronRightIcon className="w-6 h-6" />
                    </button>
                </div>
                <div>
                     <button className="px-4 py-2 rounded-md text-sm font-semibold bg-white text-slate-900">Month</button>
                </div>
            </div>

            <main className="flex-1 grid grid-cols-7 grid-rows-[auto_1fr] gap-px bg-slate-700/50 border border-slate-700/50 rounded-lg overflow-hidden">
                {weekdays.map(day => (
                    <div key={day} className="text-center font-semibold text-sm text-slate-400 py-2 bg-slate-800/50">{day}</div>
                ))}
                
                {weeks.flat().map((day, index) => (
                    <div key={index} className="bg-slate-900/70 p-2 flex flex-col gap-2 overflow-y-auto min-h-[120px]">
                        {day && (
                            <>
                                <span className={`font-semibold text-sm ${
                                    today.getDate() === day && today.getMonth() === month && today.getFullYear() === year 
                                    ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' 
                                    : 'text-slate-300'
                                }`}>
                                    {day}
                                </span>
                                <div className="space-y-2">
                                    {itemsByDay[day]?.map(item => (
                                        <CalendarItem key={item.id} item={item} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </main>
        </div>
    );
};