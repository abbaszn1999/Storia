import React from 'react';
import { Creation, TrendingVideo, View } from '../types';
import { StoriesIcon, VideoIcon } from '../components/icons';
import { CreationCard } from '../components/CreationCard';
import { TrendingVideoCard } from '../components/TrendingVideoCard';

// Fix: Define content for the Home view.
const creationOptions: Creation[] = [
    {
        title: 'Start with Story Mode',
        description: 'Ideal for short, punchy content. AI will help you write a script based on a proven story structure.',
        icon: StoriesIcon,
        view: 'stories',
    },
    {
        title: 'Start with Video Mode',
        description: 'Build more detailed videos. Start from a template like a vlog, product showcase, or ambient film.',
        icon: VideoIcon,
        view: 'video',
    },
];

const trendingVideos: TrendingVideo[] = [
    { id: 't1', title: 'AI Unveils Ancient Secrets', thumbnailUrl: 'https://picsum.photos/seed/trend1/500/800', views: '2.1M' },
    { id: 't2', title: 'The Perfect 30-Second Ad Formula', thumbnailUrl: 'https://picsum.photos/seed/trend2/500/800', views: '1.8M' },
    { id: 't3', title: 'Futuristic Cityscapes in 8K', thumbnailUrl: 'https://picsum.photos/seed/trend3/500/800', views: '1.5M' },
    { id: 't4', title: 'Cooking with a Robot Chef', thumbnailUrl: 'https://picsum.photos/seed/trend4/500/800', views: '980K' },
];

interface HomeViewProps {
    setActiveView: (view: View) => void;
}

// Fix: Implement the HomeView component.
export const HomeView: React.FC<HomeViewProps> = ({ setActiveView }) => {
    return (
        <div className="space-y-12">
            <header>
                <h1 className="text-4xl font-bold text-white tracking-tight">Welcome to Kalema</h1>
                <p className="mt-2 text-lg text-slate-400">Your AI-powered partner for creating captivating video content.</p>
            </header>
            
            <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Start Creating</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {creationOptions.map(creation => (
                        <CreationCard key={creation.title} creation={creation} onClick={setActiveView} />
                    ))}
                </div>
            </section>
            
            <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Trending Shorts</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {trendingVideos.map(video => (
                        <TrendingVideoCard key={video.id} video={video} />
                    ))}
                </div>
            </section>
        </div>
    );
};
