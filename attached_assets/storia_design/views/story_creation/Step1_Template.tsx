import React from 'react';
import { LightbulbIcon, SparklesIcon, RefreshIcon, MythBustingIcon, MicrophoneIcon } from '../../components/icons';

export type TemplateType = 'narrative' | 'direct';

interface StoryTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  iconBgColor: string;
  type: TemplateType;
}

const storyTemplates: StoryTemplate[] = [
    { id: 't1', name: 'Problem-Solution', description: 'Present a problem and show how your product/idea solves it.', icon: LightbulbIcon, iconBgColor: 'bg-yellow-500/20', type: 'narrative' },
    { id: 't2', name: 'Tease & Reveal', description: 'Build curiosity with a teaser, then reveal the answer or product.', icon: SparklesIcon, iconBgColor: 'bg-orange-500/20', type: 'narrative' },
    { id: 't3', name: 'Before & After', description: 'Showcase a transformation. Great for tutorials or testimonials.', icon: RefreshIcon, iconBgColor: 'bg-blue-500/20', type: 'narrative' },
    { id: 't4', name: 'Myth-Busting', description: 'Address a common misconception and reveal the truth.', icon: MythBustingIcon, iconBgColor: 'bg-pink-500/20', type: 'narrative' },
    { id: 't5', name: 'ASMR / Sensory', description: 'Focus on satisfying sounds and visuals. No complex script needed.', icon: MicrophoneIcon, iconBgColor: 'bg-teal-500/20', type: 'direct' },
];

interface Step1Props {
  onSelectTemplate: (type: TemplateType) => void;
}

export const Step1_Template: React.FC<Step1Props> = ({ onSelectTemplate }) => {
  return (
    <div className="max-w-4xl mx-auto text-center">
      <h1 className="text-4xl font-bold text-white tracking-tight">Choose a Template</h1>
      <p className="mt-2 text-lg text-slate-400">Select a proven structure to build your video around.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {storyTemplates.map(template => {
          const Icon = template.icon;
          return (
            <button 
              key={template.id} 
              onClick={() => onSelectTemplate(template.type)}
              className="p-6 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800/80 text-left transition-all flex items-start gap-4"
            >
              <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${template.iconBgColor}`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">{template.name}</h3>
                <p className="text-sm text-slate-400 mt-1">{template.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  );
};