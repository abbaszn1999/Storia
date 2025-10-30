import React from 'react';
import { TrendingVideo } from '../types';

interface TrendingVideoCardProps {
  video: TrendingVideo;
}

// Fix: Implement the TrendingVideoCard component.
export const TrendingVideoCard: React.FC<TrendingVideoCardProps> = ({ video }) => {
  return (
    <div className="group relative overflow-hidden rounded-lg">
      <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-4">
        <h3 className="font-semibold text-white truncate">{video.title}</h3>
        <p className="text-xs text-slate-300">{video.views} views</p>
      </div>
    </div>
  );
};
