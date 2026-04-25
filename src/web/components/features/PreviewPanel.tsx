import React, { useRef } from 'react';
import { VISUAL_STYLES, VOICES } from '../../constants';

interface VideoSceneData {
  videoClipUrl: string;
  audioUrl: string;
  sceneOrder: number;
}

interface PreviewPanelProps {
  scenes?: VideoSceneData[];
  productImage: string | null;
  setProductImage: (v: string | null) => void;
  config: {
    resolution: string;
    aspectRatio: string;
    duration: string;
    model: string;
    voiceGender: string;
    activeStyle: string;
    activeTone: string;
  };
  onReset?: () => void;
  onDownload?: () => void;
}

export const PreviewPanel = ({ scenes, productImage, setProductImage, config, onReset, onDownload }: PreviewPanelProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentIdx, setCurrentIdx] = React.useState(0);
  
  // Find the label for the active style
  const styleLabel = VISUAL_STYLES.find(s => s.id === config.activeStyle)?.label || config.activeStyle;
  const voiceLabel = VOICES.find(v => v.id === config.voiceGender)?.label || config.voiceGender;

  // Format duration for display
  const getDurationLabel = (dur: string) => {
    const customMatch = dur.match(/^custom:(\d+)$/);
    if (customMatch) return `${customMatch[1]}s`;
    return dur;
  };

  const getModelName = (modelId: string) => {
    switch (modelId) {
      case 'runway_manual': return 'Runway Gen-3';
      case 'runway_ai':     return 'Runway Gen-3';
      case 'veo3':          return 'Veo 3';
      case 'kling_ai':      return 'Kling AI 3';
      default: return modelId;
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const currentScene = scenes && scenes.length > 0 ? scenes[currentIdx] : null;

  const handleVideoEnd = () => {
    if (scenes && currentIdx < scenes.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setCurrentIdx(0); // Loop back to start
    }
  };

  return (
    <aside className="preview-sidebar">
      <div className="preview-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <h3 className="form-label" style={{ marginBottom: 0 }}>Xem trước & Tùy chọn</h3>
        
        {/* Video Preview Screen */}
        <div className="preview-screen">
          <div className="preview-badge-top">
            {scenes && scenes.length > 1 ? `Cảnh ${currentIdx + 1}/${scenes.length}` : (config.resolution === '1080p' ? '1080p' : '720p')}
          </div>
          
          {currentScene ? (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <video 
                key={currentScene.videoClipUrl}
                src={currentScene.videoClipUrl} 
                controls 
                onEnded={handleVideoEnd}
                style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-lg)', objectFit: 'cover' }}
              />
            </div>
          ) : (
            <div className="preview-placeholder">
              <div className="preview-play-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <p className="preview-empty-text">Chưa có preview video</p>
            </div>
          )}
          
          <div className="preview-badge-bottom">
            {config.aspectRatio} · {getDurationLabel(config.duration)}
          </div>
        </div>

        {/* Product Image Upload */}
        <div className="glass-card" style={{ padding: 'var(--space-5)', border: '1px solid var(--amber-100)', background: 'white' }}>
          <h3 className="form-label" style={{ color: '#8b6d4d', marginBottom: 'var(--space-4)', fontSize: 13, textTransform: 'uppercase' }}>
            Hình ảnh sản phẩm mẫu
          </h3>
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              width: '100%', 
              height: 100, 
              background: 'rgba(245, 158, 11, 0.02)', 
              borderRadius: 'var(--radius-md)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              overflow: 'hidden',
              position: 'relative',
              border: '1px dashed var(--amber-200)'
            }}
          >
            {productImage ? (
              <>
                <img src={productImage} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8, 
                    background: 'rgba(0,0,0,0.6)', 
                    color: 'white', 
                    borderRadius: '50%', 
                    width: 24, 
                    height: 24, 
                    fontSize: 14, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }} 
                  onClick={(e) => { e.stopPropagation(); setProductImage(null); }}
                >
                  ×
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--amber-600)', fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                <span style={{ fontWeight: 500 }}>Nhấn để tải ảnh</span>
              </div>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn-secondary" style={{ flex: 1, padding: '12px 0', fontSize: 14, fontWeight: 500 }} onClick={onReset}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8, verticalAlign: 'middle' }}>
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Làm lại
          </button>
          <button className="btn-generate" style={{ flex: 1, padding: '12px 0', fontSize: 14, fontWeight: 500, boxShadow: 'none' }} onClick={onDownload}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8, verticalAlign: 'middle' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"></path>
            </svg>
            Tải xuống
          </button>
        </div>

        {/* Configuration Summary */}
        <div className="config-summary glass-card" style={{ padding: 'var(--space-5)', border: '1px solid var(--amber-100)', background: 'white' }}>
          <h3 className="form-label" style={{ color: '#8b6d4d', marginBottom: 'var(--space-4)', fontSize: 13, textTransform: 'uppercase' }}>
            Cấu hình hiện tại
          </h3>
          <div className="summary-list" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="summary-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#9c7f6a' }}>Model</span>
              <span style={{ fontWeight: 600, color: '#d97706' }}>{getModelName(config.model)}</span>
            </div>
            <div className="summary-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#9c7f6a' }}>Resolution</span>
              <span style={{ fontWeight: 600, color: '#d97706' }}>{config.resolution}</span>
            </div>
            <div className="summary-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#9c7f6a' }}>Ratio</span>
              <span style={{ fontWeight: 600, color: '#d97706' }}>{config.aspectRatio}</span>
            </div>
            <div className="summary-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#9c7f6a' }}>Duration</span>
              <span style={{ fontWeight: 600, color: '#d97706' }}>{getDurationLabel(config.duration)}</span>
            </div>
            <div className="summary-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#9c7f6a' }}>Voice</span>
              <span style={{ fontWeight: 600, color: '#d97706' }}>{voiceLabel}</span>
            </div>
            <div className="summary-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#9c7f6a' }}>Style</span>
              <span style={{ fontWeight: 600, color: '#d97706' }}>{styleLabel}</span>
            </div>
            <div className="summary-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: '#9c7f6a' }}>Tone</span>
              <span style={{ fontWeight: 600, color: '#d97706' }}>{config.activeTone}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
