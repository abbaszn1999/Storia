import React, { useState, useMemo } from 'react';
import { Project } from '../types';
import { ProjectCard } from '../components/ProjectCard';
import { SearchIcon } from '../components/icons';

const mockProjects: Project[] = [
    { id: 'p1', title: 'The Three Bulls', thumbnailUrl: 'https://i.imgur.com/8nL3bJ0.jpeg', status: 'Draft', tags: ['Animals', 'magiclight 1.0'], lastEdited: '1 day ago', mode: 'Video' },
    { id: 'p2', title: 'Summer Vlog #3', thumbnailUrl: 'https://picsum.photos/seed/hist2/400/300', status: 'Completed', tags: ['Vlog', 'Travel'], lastEdited: '3 days ago', mode: 'Video' },
    { id: 'p3', title: 'Quick Teaser Ad', thumbnailUrl: 'https://picsum.photos/seed/hist3/400/300', status: 'Completed', tags: ['Ad', 'Tease & Reveal'], lastEdited: '5 days ago', mode: 'Story' },
    { id: 'p4', title: 'Cybernetic Dawn', thumbnailUrl: 'https://picsum.photos/seed/proj2/400/300', status: 'Completed', tags: ['Sci-Fi', 'narrative'], lastEdited: '1 week ago', mode: 'Video' },
    { id: 'p5', title: 'Forest Whispers', thumbnailUrl: 'https://picsum.photos/seed/proj3/400/300', status: 'Draft', tags: ['Fantasy', 'ambient'], lastEdited: '2 weeks ago', mode: 'Video' },
    { id: 'p6', title: 'Product Hunt Launch', thumbnailUrl: 'https://picsum.photos/seed/hist4/400/300', status: 'Draft', tags: ['Launch', 'Problem-Solution'], lastEdited: '3 weeks ago', mode: 'Story' },
    { id: 'p7', title: 'Unboxing New Gear', thumbnailUrl: 'https://picsum.photos/seed/hist5/400/300', status: 'Completed', tags: ['Unboxing', 'Social'], lastEdited: '1 month ago', mode: 'Story' },
];

type ModeFilter = 'all' | 'Story' | 'Video';

export const HistoryView: React.FC = () => {
    const [modeFilter, setModeFilter] = useState<ModeFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProjects = useMemo(() => {
        return mockProjects
            .filter(project => {
                if (modeFilter === 'all') return true;
                return project.mode === modeFilter;
            })
            .filter(project => {
                return project.title.toLowerCase().includes(searchQuery.toLowerCase());
            });
    }, [modeFilter, searchQuery]);

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-4xl font-bold text-white tracking-tight">My Projects</h1>
                <p className="mt-2 text-lg text-slate-400">Review, manage, and continue your past creations.</p>
            </header>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                 <div className="flex items-center gap-2">
                    <FilterButton label="All" isActive={modeFilter === 'all'} onClick={() => setModeFilter('all')} />
                    <FilterButton label="Stories" isActive={modeFilter === 'Story'} onClick={() => setModeFilter('Story')} />
                    <FilterButton label="Videos" isActive={modeFilter === 'Video'} onClick={() => setModeFilter('Video')} />
                </div>
                <div className="relative w-full md:w-auto">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors w-full md:w-64"
                    />
                </div>
            </div>

            <main>
                {filteredProjects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProjects.map(project => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-20 bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-700">
                        <h3 className="text-xl font-semibold text-white">No Projects Found</h3>
                        <p className="text-slate-400 mt-2">Try adjusting your filters or search query.</p>
                    </div>
                )}
            </main>
        </div>
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
        className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
            isActive
                ? 'bg-white text-slate-900'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
        }`}
    >
        {label}
    </button>
);