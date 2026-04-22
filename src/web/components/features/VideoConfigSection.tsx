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

const MODELS = [
  { id: 'runway', name: 'Runway Gen-3', desc: 'Sáng tạo & Nghệ thuật' },
  { id: 'kling',  name: 'Kling AI 3.0', desc: 'Sáng tạo & Đỉnh cao' },
  { id: 'veo',    name: 'Veo 3.1 Fast', desc: 'Tốc độ & Chất lượng' },
] as const;

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
      {/* AI Model Selection */}
      <div className="form-group">
        <label className="form-label">Hệ thống AI (Model)</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          {MODELS.map(m => (
            <div 
              key={m.id}
              onClick={() => setModel(m.id as AIModelType)}
              style={{
                padding: '16px 12px',
                borderRadius: '12px',
                border: `2px solid ${model === m.id ? '#f97316' : '#e2e8f0'}`,
                background: model === m.id ? 'rgba(249, 115, 22, 0.05)' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60px'
              }}
            >
              {model === m.id && (
                <div style={{ 
                  position: 'absolute', top: '-10px', right: '-10px', 
                  width: '30px', height: '30px', background: '#f97316', 
                  transform: 'rotate(45deg)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' 
                }}>
                  <div style={{ transform: 'rotate(-45deg)', color: 'white', fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>✓</div>
                </div>
              )}
              <div style={{ 
                fontSize: '0.85rem', 
                fontWeight: 700, 
                color: model === m.id ? '#ea580c' : '#1e293b',
                textAlign: 'center'
              }}>
                {m.name}
              </div>
            </div>
          ))}
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
            <option value="5s">5 giây</option>
            <option value="10s">10 giây</option>
            <option value="15s">15 giây</option>
            <option value="30s">30 giây</option>
            <option value="60s">60 giây</option>
            <option value="3m">3 phút</option>
            <option value="5m">5 phút</option>
          </select>
        </div>
      </div>
    </div>
  </div>
);
