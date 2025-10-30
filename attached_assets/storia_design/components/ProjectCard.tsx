import React from 'react';
import { Project } from '../types';
import { EllipsisVerticalIcon, ScissorsIcon } from './icons';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <div className="bg-slate-800/50 rounded-lg overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/50 border border-slate-700/50 hover:border-slate-600">
      <div className="relative">
        <img src={project.thumbnailUrl} alt={project.title} className="w-full h-40 object-cover" />
        <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
            {project.status === 'Draft' ? (
              <span className="bg-slate-900/80 text-white text-xs font-bold px-2.5 py-1 rounded-full border border-slate-600">
                Draft
              </span>
            ) : (
                 <span className="bg-green-500/20 text-green-300 text-xs font-bold px-2.5 py-1 rounded-full border border-green-500/30">
                    Completed
                </span>
            )}
        </div>
        <div className="absolute top-2 left-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
             <button className="bg-slate-900/50 p-1.5 rounded-full hover:bg-slate-800/80">
                <EllipsisVerticalIcon className="w-5 h-5 text-white" />
            </button>
             {project.status === 'Completed' && (
                 <button className="bg-slate-900/50 p-1.5 rounded-full hover:bg-slate-800/80" title="Generate Shorts">
                    <ScissorsIcon className="w-5 h-5 text-white" />
                </button>
            )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg text-white truncate">{project.title}</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          {project.tags.map(tag => (
            <span key={tag} className="bg-slate-700 text-slate-300 text-xs font-medium px-2.5 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <p className="text-sm text-slate-500 mt-3">{project.lastEdited}</p>
      </div>
    </div>
  );
};
