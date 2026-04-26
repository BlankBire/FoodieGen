import React, { useState, useEffect } from 'react';
import { ResolutionType, AspectRatioType, DurationType, AIModelType } from '../../types';
import { Clock } from 'lucide-react';

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

const PRESET_DURATIONS: { value: DurationType; label: string }[] = [
  { value: '15s', label: '15 giây' },
  { value: '30s', label: '30 giây' },
  { value: '60s', label: '60 giây' },
  { value: '90s', label: '90 giây' },
  { value: '3m', label: '3 phút' },
  { value: '5m', label: '5 phút' },
];

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
    tags: ['Runway Gen-4.5', 'Kịch bản có sẵn', 'FPT Voice'],
  },
  {
    id: 'runway_ai',
    title: 'Runway + AI tạo kịch bản',
    desc: 'Google Gemini tự sinh kịch bản từ chủ đề, RunwayML tạo video và FPT tạo giọng đọc.',
    tags: ['Runway Gen-4.5', 'Google Gemini', 'FPT Voice'],
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
}: VideoConfigSectionProps) => {
  // Check if current duration is a custom value
  const isCustomDuration = !PRESET_DURATIONS.some(d => d.value === duration);
  const [selectedDurOption, setSelectedDurOption] = useState(isCustomDuration ? 'custom' : duration);
  const [customSeconds, setCustomSeconds] = useState(() => {
    if (isCustomDuration) {
      // Parse "custom:XX" format
      const match = duration.match(/^custom:(\d+)$/);
      return match ? match[1] : '';
    }
    return '';
  });

  useEffect(() => {
    const isCustom = !PRESET_DURATIONS.some(d => d.value === duration);
    setSelectedDurOption(prev => {
      // Stay in custom mode if user just switched and hasn't typed yet
      if (prev === 'custom' && !isCustom) return 'custom';
      return isCustom ? 'custom' : duration;
    });
    if (isCustom) {
      const match = duration.match(/^custom:(\d+)$/);
      if (match) setCustomSeconds(match[1]);
    }
  }, [duration]);

  const handleDurationOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedDurOption(val);
    if (val !== 'custom') {
      setDuration(val as DurationType);
    }
    // Don't set duration when switching to custom — wait for user input
  };

  const handleCustomSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setCustomSeconds(val);
    if (val) {
      setDuration(`custom:${val}` as DurationType);
    }
  };

  return (
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
                    border: `2px solid ${isActive ? 'var(--border-focus)' : 'var(--border-default)'}`,
                    background: isActive ? 'rgba(249, 115, 22, 0.04)' : 'var(--bg-card)',
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
                    color: isActive ? 'var(--text-accent)' : 'var(--text-primary)',
                    lineHeight: 1.3,
                  }}>
                    {opt.title}
                  </div>

                  {/* Description */}
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
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
                          background: isActive ? 'rgba(249, 115, 22, 0.08)' : 'var(--bg-input)',
                          color: isActive ? 'var(--text-accent)' : 'var(--text-secondary)',
                          border: `1px solid ${isActive ? 'rgba(249, 115, 22, 0.2)' : 'var(--border-default)'}`,
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
            </select>
          </div>
          {/* Duration */}
          <div className="form-group" style={{ marginBottom:0 }}>
            <label className="form-label">Thời lượng</label>
            <select 
              className="form-select" 
              value={selectedDurOption} 
              onChange={handleDurationOptionChange}
            >
              {PRESET_DURATIONS.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
              <option value="custom">Khác...</option>
            </select>
          </div>
        </div>

        {/* Custom Duration Input */}
        {selectedDurOption === 'custom' && (
          <div className="form-group animate-slide-down" style={{ marginBottom: 0, marginTop: 'var(--space-4)' }}>
            <label className="form-label">Nhập thời lượng tùy chỉnh</label>
            <div style={{ position: 'relative' }}>
              <Clock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--amber-500)' }} />
              <input 
                className="form-input" 
                type="number"
                min={1}
                max={600}
                placeholder="VD: 45" 
                style={{ paddingLeft: '36px', paddingRight: '50px' }}
                value={customSeconds} 
                onChange={handleCustomSecondsChange}
                autoFocus
              />
              <span style={{ 
                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500, pointerEvents: 'none'
              }}>
                giây
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
