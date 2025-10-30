import React from 'react';
import { Plan } from '../types';
import { CheckIcon } from './icons';

interface PlanCardProps {
  plan: Plan;
  billingCycle: 'monthly' | 'yearly';
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, billingCycle }) => {
    const displayPrice = billingCycle === 'yearly' ? plan.price : (parseFloat(plan.price) / 0.7).toFixed(1);
    const displayOriginalPrice = billingCycle === 'yearly' ? plan.originalPrice : ((parseFloat(plan.originalPrice || '0') / 0.7).toFixed(1));

  return (
    <div className={`p-6 rounded-2xl border flex flex-col ${plan.isPopular ? 'bg-slate-800/50 border-purple-500' : 'bg-slate-800/30 border-slate-700'}`}>
        {plan.isPopular && <div className="absolute -top-3 right-4 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">Popular</div>}
      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
      <div className="mt-4">
        {plan.isCurrent ? (
            <span className="text-4xl font-bold text-white">Free</span>
        ) : (
            <>
                <span className="text-4xl font-bold text-white">${displayPrice}</span>
                <span className="text-slate-400"> /month</span>
                {plan.originalPrice && <span className="text-slate-500 line-through ml-2">${displayOriginalPrice}</span>}
            </>
        )}
      </div>
       <p className="text-sm text-slate-500 mt-1 h-5">{plan.billedAnnually && `or $${plan.billedAnnually} Billed annually`}</p>
      
      {plan.isCurrent ? (
        <button className="mt-6 w-full bg-slate-700 text-white font-semibold py-3 rounded-lg cursor-default">Current Plan</button>
      ) : (
        <>
        <button className="mt-6 w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-lg transition-colors">Buy Now</button>
        <button className="mt-2 w-full text-center text-sm text-slate-400 hover:text-white font-semibold py-2">PayPal</button>
        </>
      )}

        <div className="border-t border-slate-700/50 my-6"></div>

        <div className="flex-grow space-y-3 text-sm">
            <p className="text-slate-400"><span className="font-bold text-white">{plan.credits} credits</span> per month {plan.creditPrice !== 'N/A' && <span className="text-slate-500">(${plan.creditPrice} per 100 credits)</span>}</p>
            {plan.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                    <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{feature}</span>
                </div>
            ))}
        </div>
    </div>
  );
};

export default PlanCard;
