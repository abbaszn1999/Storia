import React, { useState, useEffect, useRef } from 'react';
import { View } from '../types';
import { BellIcon, CreditIcon } from './icons';
import ProfileDropdown from './ProfileDropdown';

interface HeaderProps {
    setActiveView: (view: View) => void;
    setPricingModalOpen: (isOpen: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setActiveView, setPricingModalOpen }) => {
  const [isProfileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleProfileDropdown = () => {
    setProfileOpen(prev => !prev);
  };

  const openPricingModal = () => {
    setProfileOpen(false);
    setPricingModalOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <header className="flex-shrink-0 bg-slate-800/50 border-b border-slate-700/50">
        <div className="flex items-center justify-end h-16 px-8 gap-4">
          <div className="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded-full text-sm">
            <CreditIcon className="w-5 h-5 text-yellow-400" />
            <span className="font-semibold text-white">215</span>
          </div>
          <button 
            onClick={() => setPricingModalOpen(true)}
            className="border border-slate-600 hover:border-yellow-400/50 bg-slate-700/50 hover:bg-slate-700 text-white font-semibold py-1.5 px-4 rounded-full text-sm transition-colors">
            Subscribe
          </button>
          <button className="p-2 rounded-full hover:bg-slate-700/50 transition-colors">
            <BellIcon className="w-6 h-6 text-slate-400" />
          </button>
          <div className="relative" ref={dropdownRef}>
            <button onClick={toggleProfileDropdown}>
              <img
                src="https://i.pravatar.cc/150?u=abbaszein"
                alt="User Profile"
                className="w-9 h-9 rounded-full ring-2 ring-offset-2 ring-offset-slate-800/50 ring-slate-600 hover:ring-yellow-400 transition-all"
              />
            </button>
            {isProfileOpen && <ProfileDropdown setActiveView={setActiveView} onSubscribeClick={openPricingModal} />}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;