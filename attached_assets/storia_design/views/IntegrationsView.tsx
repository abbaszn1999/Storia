import React, { useState } from 'react';
import { IntegrationCard } from '../components/IntegrationCard';
import { YouTubeIcon, TikTokIcon } from '../components/icons';

export const IntegrationsView: React.FC = () => {
    const [youtubeConnected, setYoutubeConnected] = useState(false);
    const [tiktokConnected, setTiktokConnected] = useState(false);

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-4xl font-bold text-white tracking-tight">Integrations</h1>
                <p className="mt-2 text-lg text-slate-400">Connect your accounts to streamline your content publishing workflow.</p>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <IntegrationCard
                    name="YouTube"
                    description="Publish your generated videos directly to your YouTube channel."
                    icon={YouTubeIcon}
                    isConnected={youtubeConnected}
                    onConnect={() => setYoutubeConnected(prev => !prev)}
                />
                <IntegrationCard
                    name="TikTok"
                    description="Share your shorts and stories seamlessly on your TikTok profile."
                    icon={TikTokIcon}
                    isConnected={tiktokConnected}
                    onConnect={() => setTiktokConnected(prev => !prev)}
                />
            </main>
        </div>
    );
};