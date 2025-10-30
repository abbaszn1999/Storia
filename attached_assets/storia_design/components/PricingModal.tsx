import React, { useState } from 'react';
import { Plan } from '../types';
import PlanCard from './PlanCard';
// Fix: Import CreditIcon to resolve the 'Cannot find name' error.
import { XMarkIcon, CreditIcon } from './icons';

const plans: Plan[] = [
    {
        name: 'Free Plan',
        price: '0',
        billedAnnually: '',
        features: ['Smart Script supports 1-minute videos.', '3,000 characters prompt', '10+ visual styles, Watermark free', 'General commercial license'],
        isCurrent: true,
        credits: '0',
        creditPrice: 'N/A'
    },
    {
        name: 'Standard Plan',
        price: '8.4',
        originalPrice: '12',
        billedAnnually: '100.8',
        features: ['Exclusive MagicLight, Hailuo, Kling, Seedance', 'Voice Cloning', '1080P HD Video, Trending Templates', 'Fast Track Generation 1,000 images/day', 'Smart Script supports videos up to 50 min', '12,000 characters prompt', '10+ visual styles, Watermark free', 'Free Image Regeneration & Character Generation', 'General commercial license'],
        credits: '7,000',
        creditPrice: '0.12'
    },
    {
        name: 'Plus Plan',
        price: '18.2',
        originalPrice: '26',
        billedAnnually: '218.4',
        features: ['Sora 2', 'Exclusive MagicLight, Hailuo, Kling, Seedance', 'Voice Cloning', '1080P HD Video, Trending Templates', 'Fast Track Generation 3,000 images/day', 'Smart Script supports videos up to 50 min', '12,000 characters prompt', '10+ visual styles, Watermark free', 'Free Image Regeneration & Character Generation', 'General commercial license'],
        credits: '25,000',
        creditPrice: '0.072',
        sora2Access: true
    },
    {
        name: 'Pro Plan',
        price: '24.5',
        originalPrice: '35',
        billedAnnually: '294',
        features: ['Sora 2', '20% off MagicLight, Hailuo, Kling, Seedance', 'Exclusive Access to Kling 2.1 Master', '20% off Voice Cloning', '1080P HD Video, Trending Templates', 'Fast Track Generation Unlimited', 'Smart Script supports videos up to 50 min', '12,000 characters prompt', '10+ visual styles, Watermark free', 'Free Image Regeneration & Character Generation', 'General commercial license'],
        credits: '45,000',
        creditPrice: '0.054',
        isPopular: true,
        sora2Access: true,
        voiceCloningDiscount: '20%'
    },
];

const PricingModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-6 border-b border-slate-800 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <img src="https://i.pravatar.cc/150?u=abbaszein" alt="Abbas Zein" className="w-10 h-10 rounded-full" />
                        <div>
                            <h2 className="font-bold text-white text-lg">Abbas Zein</h2>
                            <p className="text-sm text-slate-400">No subscription yet</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700/50 border border-slate-700 px-4 py-2 rounded-lg transition-colors">Invitation Code Benefits</button>
                        <div className="flex items-center gap-2">
                             <CreditIcon className="w-5 h-5 text-yellow-400" />
                            <span className="font-bold text-white">215</span>
                            <button className="text-sm text-yellow-400 hover:text-yellow-300 font-semibold ml-2">Purchase Credits</button>
                        </div>
                         <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                            <XMarkIcon className="w-7 h-7" />
                        </button>
                    </div>
                </header>

                <div className="flex-grow p-8 overflow-y-auto">
                    <div className="flex justify-center items-center mb-8">
                        <span className={`font-semibold ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
                        <button onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')} className="mx-4 w-12 h-6 rounded-full bg-slate-800 flex items-center p-1 transition-all duration-300">
                            <div className={`w-5 h-5 rounded-full bg-white transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-5' : ''}`}></div>
                        </button>
                        <span className={`font-semibold ${billingCycle === 'yearly' ? 'text-white' : 'text-slate-400'}`}>Yearly</span>
                        <span className="ml-2 bg-yellow-400/20 text-yellow-300 text-xs font-bold px-2 py-1 rounded-md">-30%</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {plans.map(plan => <PlanCard key={plan.name} plan={plan} billingCycle={billingCycle} />)}
                    </div>
                </div>

                 <footer className="text-center p-4 border-t border-slate-800 flex-shrink-0">
                    <p className="text-xs text-slate-500">
                        Payment issues? feedback? <a href="#" className="text-slate-400 hover:text-white font-semibold">discord</a> or <a href="#" className="text-slate-400 hover:text-white font-semibold">telegram</a>
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default PricingModal;