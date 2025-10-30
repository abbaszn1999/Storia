import React, { useState } from 'react';
import { Template, View } from '../types';
import { TemplateCard } from '../components/TemplateCard';
import { NewProjectModal } from '../components/video_creation/NewProjectModal';
import { StoryboardCreator } from './video_creation/StoryboardCreator';

const videoModes: Template[] = [
    { id: 'v1', title: 'Storyboard Narrative Mode', description: 'Craft a story with sequential scenes and voiceover.', thumbnailUrl: 'https://picsum.photos/seed/vid_narrative/600/400' },
    { id: 'v2', title: 'Character Vlog / Monologue', description: 'Create a video from the perspective of a single character.', thumbnailUrl: 'https://picsum.photos/seed/vid_vlog/600/400', isComingSoon: true },
    { id: 'v3', title: 'Ambient / Visual / Mood', description: 'Focus on atmosphere and mood with stunning visuals.', thumbnailUrl: 'https://picsum.photos/seed/vid_mood/600/400', isComingSoon: true },
    { id: 'v4', title: 'Video-Podcast Mode', description: 'Turn your audio podcast into an engaging visual experience.', thumbnailUrl: 'https://picsum.photos/seed/vid_podcast/600/400', isComingSoon: true },
    { id: 'v5', title: 'Social Commerce Video', description: 'Create compelling product marketing videos for social media.', thumbnailUrl: 'https://picsum.photos/seed/vid_commerce/600/400', isComingSoon: true },
    { id: 'v6', title: 'Logo Animation Storytelling', description: 'Animate your logo and tell a short story about your brand.', thumbnailUrl: 'https://picsum.photos/seed/vid_logo/600/400', isComingSoon: true },
];

interface VideoModeViewProps {
    setActiveView: (view: View) => void;
    setInCreationFlow: (isCreating: boolean) => void;
}

export const VideoModeView: React.FC<VideoModeViewProps> = ({ setActiveView, setInCreationFlow }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);

    const startCreation = (title: string) => {
        console.log('Starting project:', title);
        setModalOpen(false);
        setIsCreating(true);
        setInCreationFlow(true);
    };

    const exitCreation = () => {
        setIsCreating(false);
        setInCreationFlow(false);
    };

    if (isCreating) {
        return <StoryboardCreator onExit={exitCreation} />;
    }

    return (
        <>
        <div className="space-y-12">
            <header>
              <div>
                <h1 className="text-4xl font-bold text-white tracking-tight">Video Mode</h1>
                <p className="mt-2 text-lg text-slate-400">Select a video structure to begin building a more detailed project.</p>
              </div>
            </header>
            
            <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Select a Video Type</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videoModes.map(template => (
                        <TemplateCard 
                            key={template.id} 
                            template={template} 
                            onClick={() => setModalOpen(true)}
                        />
                    ))}
                </div>
            </section>
        </div>
        {isModalOpen && <NewProjectModal onClose={() => setModalOpen(false)} onStart={startCreation} />}
        </>
    );
};