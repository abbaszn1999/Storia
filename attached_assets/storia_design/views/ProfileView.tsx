import React from 'react';
import ProfileForm from '../components/ProfileForm';

export const ProfileView: React.FC = () => {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <header>
                <h1 className="text-4xl font-bold text-white tracking-tight">My Profile</h1>
                <p className="mt-2 text-lg text-slate-400">View and edit your personal information.</p>
            </header>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-8">
                <ProfileForm />
            </div>
        </div>
    );
};