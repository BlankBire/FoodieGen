export type EntityType = 'CHARACTER' | 'FOOD' | 'LOCATION';
export type ProjectStatus = 'draft' | 'generating' | 'completed' | 'failed';
export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface User {
    id: string;
    email: string;
    fullName: string;
    createdAt: Date;
}

export interface AIVoice {
    id: string;
    name: string;
    provider: string;
    gender: 'Male' | 'Female' | 'AI';
    locale: string;
    previewUrl?: string;
    isActive: boolean;
}

export interface StylePreset {
    id: string;
    name: string;
    visualDescription: string;
    baseImagePrompt?: string;
    negativePrompt?: string;
}

export interface VideoProject {
    id: string;
    userId: string;
    title: string;
    storyTopic: string;
    videoGenre: string;
    status: ProjectStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProjectEntity {
    id: string;
    projectId: string;
    entityType: EntityType;
    name: string;
    description: string;
    referenceImageUrl?: string;
    metaJson?: Record<string, any>;
}

export interface VideoScript {
    id: string;
    projectId: string;
    version: number;
    content: SceneDetail[];
    isActive: boolean;
    createdAt: Date;
}

export interface SceneDetail {
    sceneOrder: number;
    title: string;
    visualDescription: string;
    audioScript: string;
}

export interface VideoGeneration {
    id: string;
    projectId: string;
    scriptId: string;
    voiceId: string;
    styleId: string;
    generationNo: number;
    resolution: '720p' | '1080p';
    aspectRatio: '9:16' | '16:9' | '1:1';
    motionIntensity: number;
    status: GenerationStatus;
    outputUrl?: string;
    thumbnailUrl?: string;
    durationSeconds?: number;
    createdAt: Date;
}

export interface VideoScene {
    id: string;
    generationId: string;
    sceneOrder: number;
    visualPrompt: string;
    motionPrompt: string;
    audioScript: string;
    imageUrl?: string;
    videoClipUrl?: string;
    audioUrl?: string;
    metadata?: Record<string, any>;
}
