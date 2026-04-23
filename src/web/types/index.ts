export type AIModelType = 'runway_manual' | 'runway_ai' | 'veo3' | 'kling_ai';
export type ResolutionType = '720p' | '1080p' | '4k';
export type AspectRatioType = '16:9' | '9:16' | '1:1';
export type DurationType = '15s' | '30s' | '60s' | '90s' | '3m' | '5m';

export interface VideoConfigState {
  resolution: ResolutionType;
  aspectRatio: AspectRatioType;
  duration: DurationType;
  activeStyle: string;
  activeTone: string;
  emotion: string;
  motionIntensity: number;
  transitions: boolean;
  charConsistency: boolean;
}

export interface AudioConfigState {
  voiceGender: string;
  language: string;
  voiceSpeed: number;
  bgMusic: boolean;
}

export interface ContentState {
  foodTopic: string;
  mainCharacter: string;
  script: string;
}
