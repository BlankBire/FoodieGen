import React from 'react';
import { ResolutionType, AspectRatioType, DurationType, AIModelType } from '../../types';

interface VideoConfigSectionProps {
  resolution: ResolutionType;
  setResolution: (v: ResolutionType) => void;
  aspectRatio: AspectRatioType;
  setAspectRatio: (v: AspectRatioType) => void;
  duration: DurationType;
  setDuration: (v: DurationType) => void;
  model: AIModelType;
  setModel: (v: AIModelType) => void;
}

const WORKFLOW_OPTIONS: {
  id: AIModelType;
  title: string;
  desc: string;
  tags: string[];
}[] = [
  {
    id: 'runway_manual',
    title: 'Runway + Kịch bản thủ công',
    desc: 'Dán kịch bản có sẵn từ bên ngoài, RunwayML tạo video và FPT tạo giọng đọc.',
    tags: ['Runway Gen-3', 'Kịch bản có sẵn', 'FPT Voice'],
  },
  {
    id: 'runway_ai',
    title: 'Runway + AI tạo kịch bản',
    desc: 'Google Gemini tự sinh kịch bản từ chủ đề, RunwayML tạo video và FPT tạo giọng đọc.',
    tags: ['Runway Gen-3', 'Google Gemini', 'FPT Voice'],
  },
  {
    id: 'veo3',
    title: 'Google Veo3 trực tiếp',
    desc: 'Tạo video qua Google Veo3 (không qua Runway), Gemini sinh kịch bản, FPT tạo giọng đọc.',
    tags: ['Veo 3', 'Google Gemini', 'FPT Voice'],
  },
  {
    id: 'kling_ai',
    title: 'Kling AI + AI tạo kịch bản',
    desc: 'Kling AI V3 tạo video, Gemini sinh kịch bản, FPT tạo giọng đọc.',
    tags: ['Kling AI 3', 'Google Gemini', 'FPT Voice'],
  },
];

export const VideoConfigSection = ({
  resolution, setResolution,
  aspectRatio, setAspectRatio,
  duration, setDuration,
  model, setModel
}: VideoConfigSectionProps) => (
  <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
    <div className="section-title">
      <span className="section-title-dot" />
      Cấu hình video
    </div>

    <div className="section-card" style={{ margin: 0 }}>
      {/* Workflow Selection */}
      <div className="form-group">
        <label className="form-label">Chọn quy trình tạo video</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {WORKFLOW_OPTIONS.map(opt => {
            const isActive = model === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => setModel(opt.id)}
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  border: `2px solid ${isActive ? '#f97316' : '#e2e8f0'}`,
                  background: isActive ? 'rgba(249, 115, 22, 0.04)' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {/* Checkmark corner */}
                {isActive && (
                  <div style={{
                    position: 'absolute', top: '-10px', right: '-10px',
                    width: '30px', height: '30px', background: '#f97316',
                    transform: 'rotate(45deg)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
                  }}>
                    <div style={{ transform: 'rotate(-45deg)', color: 'white', fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>✓</div>
                  </div>
                )}

                {/* Title */}
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: isActive ? '#ea580c' : '#1e293b',
                  lineHeight: 1.3,
                }}>
                  {opt.title}
                </div>

                {/* Description */}
                <div style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  lineHeight: 1.5,
                }}>
                  {opt.desc}
                </div>

                {/* Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {opt.tags.map(tag => (
                    <span
                      key={tag}
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: isActive ? 'rgba(249, 115, 22, 0.08)' : '#f1f5f9',
                        color: isActive ? '#ea580c' : '#64748b',
                        border: `1px solid ${isActive ? 'rgba(249, 115, 22, 0.2)' : '#e2e8f0'}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resolution */}
      <div className="form-group" style={{ marginTop: '4px' }}>
        <label className="form-label">Độ phân giải</label>
        <div className="resolution-grid">
          {(['720p', '1080p'] as ResolutionType[]).map(res => (
            <div key={res} className={`resolution-card ${resolution===res?'active':''}`} onClick={()=>setResolution(res)}>
              <span className="resolution-badge">{res}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="form-row">
        {/* Aspect ratio */}
        <div className="form-group" style={{ marginBottom:0 }}>
          <label className="form-label">Tỷ lệ khung hình</label>
          <select className="form-select" value={aspectRatio} onChange={e => setAspectRatio(e.target.value as AspectRatioType)}>
            <option value="9:16">9:16</option>
            <option value="16:9">16:9</option>
            <option value="1:1">1:1</option>
          </select>
        </div>
        {/* Duration */}
        <div className="form-group" style={{ marginBottom:0 }}>
          <label className="form-label">Thời lượng</label>
          <select className="form-select" value={duration} onChange={e => setDuration(e.target.value as DurationType)}>
            <option value="15s">15 giây</option>
            <option value="30s">30 giây</option>
            <option value="60s">60 giây</option>
            <option value="90s">90 giây</option>
            <option value="3m">3 phút</option>
            <option value="5m">5 phút</option>
          </select>
        </div>
      </div>
    </div>
  </div>
);
