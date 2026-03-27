import React from 'react';
import { ResolutionType, AspectRatioType, DurationType } from '../../types';

interface VideoConfigSectionProps {
  resolution: ResolutionType;
  setResolution: (v: ResolutionType) => void;
  aspectRatio: AspectRatioType;
  setAspectRatio: (v: AspectRatioType) => void;
  duration: DurationType;
  setDuration: (v: DurationType) => void;
}

export const VideoConfigSection = ({
  resolution, setResolution,
  aspectRatio, setAspectRatio,
  duration, setDuration
}: VideoConfigSectionProps) => (
  <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
    <div className="section-title">
      <span className="section-title-dot" />
      Cấu hình video
    </div>

    <div className="section-card" style={{ margin: 0 }}>
      {/* Resolution */}
      <div className="form-group">
        <label className="form-label">Độ phân giải</label>
        <div className="resolution-grid">
          {(['720p', '1080p'] as ResolutionType[]).map(res => (
            <div key={res} className={`resolution-card ${resolution===res?'active':''}`} onClick={()=>setResolution(res)}>
              <span className="resolution-badge">{res}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Model */}
      <div className="form-group">
        <label className="form-label">AI Model</label>
        <div className="ai-model-badge">
          <div className="ai-model-pulse" />
          <div>
            <div className="ai-model-name">Veo 3.1 Fast</div>
            <div className="ai-model-desc">Google DeepMind · Ultra-quality food video</div>
          </div>
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
            <option value="5s">5 giây</option>
            <option value="10s">10 giây</option>
            <option value="15s">15 giây</option>
            <option value="30s">30 giây</option>
            <option value="60s">60 giây</option>
          </select>
        </div>
      </div>
    </div>
  </div>
);
