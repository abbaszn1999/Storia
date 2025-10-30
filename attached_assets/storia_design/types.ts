import React from 'react';

export type View = 'home' | 'content_calendar' | 'stories' | 'video' | 'history' | 'assets' | 'settings' | 'profile' | 'integrations';

export interface NavItem {
  view: View;
  label: string;
  icon: React.FC<any>;
}

export interface Workspace {
  id: string;
  name: string;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  isComingSoon?: boolean;
}

export interface Creation {
  title: string;
  description: string;
  icon: React.FC<any>;
  view: 'stories' | 'video';
}

export interface TrendingVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  views: string;
}

export interface Project {
  id: string;
  title: string;
  thumbnailUrl: string;
  status: 'Draft' | 'Completed';
  tags: string[];
  lastEdited: string;
  mode: 'Story' | 'Video';
}

export type AssetType = 'character' | 'voice' | 'brand_kit' | 'upload';

interface BaseAsset {
  id: string;
  name: string;
  type: AssetType;
  thumbnailUrl: string;
  lastUsed: string;
}

export interface Character extends BaseAsset {
  type: 'character';
  gender: 'Male' | 'Female' | 'Other';
}

export interface Voice extends BaseAsset {
  type: 'voice';
}

export interface BrandAsset extends BaseAsset {
  type: 'brand_kit';
  colors: string[];
}

export interface Upload extends BaseAsset {
  type: 'upload';
}

export interface Plan {
  name: string;
  price: string;
  originalPrice?: string;
  billedAnnually: string;
  features: string[];
  isCurrent?: boolean;
  credits: string;
  creditPrice: string;
  isPopular?: boolean;
  sora2Access?: boolean;
  voiceCloningDiscount?: string;
}

export interface ScheduledItem {
  id: string;
  title: string;
  thumbnailUrl: string;
  platform: 'YouTube' | 'TikTok';
  status: 'Published' | 'Scheduled';
  publishDate: Date;
}