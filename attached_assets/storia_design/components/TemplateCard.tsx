import React from 'react';
import { Template } from '../types';

interface TemplateCardProps {
  template: Template;
  onClick?: () => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ template, onClick }) => {
  const isClickable = !template.isComingSoon;

  return (
    <div 
      onClick={isClickable ? onClick : undefined}
      className={`group relative overflow-hidden rounded-lg shadow-lg transition-all duration-300 ease-in-out 
      ${isClickable ? 'cursor-pointer hover:scale-105 hover:shadow-blue-500/30' : 'cursor-not-allowed'}`}
    >
      <img 
        src={template.thumbnailUrl} 
        alt={template.title} 
        className={`w-full h-56 object-cover transition-transform duration-300 ${isClickable ? 'group-hover:scale-110' : ''} ${template.isComingSoon ? 'filter grayscale' : ''}`} 
      />
      
      {template.isComingSoon && (
        <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center p-4 text-center">
          <span className="bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1 rounded-full tracking-wider transition-opacity duration-300 ease-in-out group-hover:opacity-0">
            COMING SOON
          </span>
          <h3 className="absolute font-bold text-lg text-white opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100 px-4">
            {template.title}
          </h3>
        </div>
      )}

      {!template.isComingSoon && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4">
          <h3 className="font-bold text-lg text-white transform transition-transform duration-300 group-hover:-translate-y-6">{template.title}</h3>
          <p className="text-sm text-slate-300 opacity-0 group-hover:opacity-100 transition-all duration-300 max-h-0 group-hover:max-h-20">
            {template.description}
          </p>
        </div>
      )}
    </div>
  );
};