import React, { useState } from 'react';
import ProfileForm from '../components/ProfileForm';

type SettingsTab = 'account' | 'billing' | 'security' | 'voice_cloning';

interface SettingsViewProps {
    setPricingModalOpen: (isOpen: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ setPricingModalOpen }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('account');

    const renderContent = () => {
        switch (activeTab) {
            case 'account':
                return <ProfileForm />;
            case 'billing':
                return (
                    <div className="space-y-6">
                         <div>
                            <h3 className="text-lg font-semibold text-white">Current Plan</h3>
                            <p className="text-slate-400">You are currently on the <span className="font-semibold text-white">Free Plan</span>.</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Credit Balance</h3>
                            <p className="text-slate-400">You have <span className="font-semibold text-white">215</span> credits remaining.</p>
                        </div>
                        <button 
                            onClick={() => setPricingModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            Manage Subscription
                        </button>
                    </div>
                );
            case 'security':
                return (
                    <form className="space-y-6 max-w-md">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="current-password">
                                Current Password
                            </label>
                            <input type="password" id="current-password" className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="new-password">
                                New Password
                            </label>
                            <input type="password" id="new-password" className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="confirm-password">
                                Confirm New Password
                            </label>
                            <input type="password" id="confirm-password" className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                         <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                            Change Password
                        </button>
                    </form>
                );
            case 'voice_cloning':
                 return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Manage Your Voice Clones</h3>
                        <p className="text-slate-400 max-w-2xl">Create high-quality clones of your voice to use across projects. This allows for consistent narration and character dialogue without re-recording.</p>
                        <div className="text-center py-10 bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-700 mt-4">
                            <h4 className="text-md font-semibold text-white">No Voices Cloned Yet</h4>
                             <p className="text-slate-500 text-sm mt-1">Your created voice clones will appear here.</p>
                             <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
                                Create New Voice Clone
                            </button>
                        </div>
                    </div>
                );
        }
    }

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-4xl font-bold text-white tracking-tight">Settings</h1>
                <p className="mt-2 text-lg text-slate-400">Manage your account, plan, and security settings.</p>
            </header>

            <div className="flex gap-8 border-b border-slate-700/50 overflow-x-auto">
                <TabButton label="Account" isActive={activeTab === 'account'} onClick={() => setActiveTab('account')} />
                <TabButton label="Plan & Billing" isActive={activeTab === 'billing'} onClick={() => setActiveTab('billing')} />
                <TabButton label="Security" isActive={activeTab === 'security'} onClick={() => setActiveTab('security')} />
                <TabButton label="Voice Cloning" isActive={activeTab === 'voice_cloning'} onClick={() => setActiveTab('voice_cloning')} />
            </div>

            <div className="mt-6">
                {renderContent()}
            </div>
        </div>
    );
};

interface TabButtonProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
}
const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick }) => {
    return (
        <button onClick={onClick} className="relative py-3 text-md font-semibold transition-colors flex-shrink-0">
            <span className={isActive ? 'text-white' : 'text-slate-400 hover:text-white'}>{label}</span>
            {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t-full"></div>}
        </button>
    )
}