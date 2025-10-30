import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { HomeView } from './views/HomeView';
import { StoriesModeView } from './views/StoriesModeView';
import { VideoModeView } from './views/VideoModeView';
import { HistoryView } from './views/HistoryView';
import { AssetsView } from './views/AssetsView';
import { SettingsView } from './views/SettingsView';
import { View, Workspace } from './types';
import PricingModal from './components/PricingModal';
import { ProfileView } from './views/ProfileView';
import { IntegrationsView } from './views/IntegrationsView';
import { ContentCalendarView } from './views/ContentCalendarView';


function App() {
  const [activeView, setActiveView] = useState<View>('home');
  const [inCreationFlow, setInCreationFlow] = useState(false);
  const [isPricingModalOpen, setPricingModalOpen] = useState(false);
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    { id: 'ws1', name: 'My First Workspace' },
    { id: 'ws2', name: 'Client Project' },
  ]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace>(workspaces[0]);

  const renderActiveView = () => {
    switch (activeView) {
      case 'home':
        return <HomeView setActiveView={setActiveView} />;
      case 'content_calendar':
        return <ContentCalendarView />;
      case 'stories':
        return <StoriesModeView setActiveView={setActiveView} setInCreationFlow={setInCreationFlow} />;
      case 'video':
        return <VideoModeView setActiveView={setActiveView} setInCreationFlow={setInCreationFlow} />;
      case 'history':
        return <HistoryView />;
      case 'assets':
        return <AssetsView />;
      case 'integrations':
        return <IntegrationsView />;
      case 'settings':
        return <SettingsView setPricingModalOpen={setPricingModalOpen} />;
      case 'profile':
        return <ProfileView />;
      default:
        return <HomeView setActiveView={setActiveView} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isDisabled={inCreationFlow}
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onSwitchWorkspace={setCurrentWorkspace}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setActiveView={setActiveView} setPricingModalOpen={setPricingModalOpen} />
        <main className="flex-1 overflow-y-auto p-8">
            {renderActiveView()}
        </main>
      </div>
      {isPricingModalOpen && <PricingModal onClose={() => setPricingModalOpen(false)} />}
    </div>
  );
}

export default App;