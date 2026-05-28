import React, { useRef } from 'react';
import { Copy, CheckCheck, TriangleAlert } from 'lucide-react';
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
    runwayModel?: string;
  };
  onReset?: () => void;
  onDownload?: () => void;
}

export const PreviewPanel = ({ scenes, productImage, setProductImage, config, onReset, onDownload }: PreviewPanelProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [imageRatioWarning, setImageRatioWarning] = React.useState(false);
  const [promptCopied, setPromptCopied] = React.useState(false);
  
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
      case 'runway_manual': 
      case 'runway_ai':     
        return config.runwayModel === 'gen4.5' ? 'Runway Gen 4.5' : 'Runway Gen-4 Turbo';
      case 'veo3':          return 'Veo 3 Fast';
      case 'kling_ai':      return 'Kling AI 3';
      default: return modelId;
    }
  };

  const getChatGptPrompt = () => {
    const ratioLabel = config.aspectRatio === '9:16' ? '9:16 (dọc/portrait)' : config.aspectRatio === '16:9' ? '16:9 (ngang/landscape)' : config.aspectRatio;
    return `Tôi có một ảnh chụp món ăn nhưng kích thước chưa phù hợp với video short/reel. Hãy giúp tôi tạo lại ảnh theo tỉ lệ ${ratioLabel} với các yêu cầu sau:\n\n1. Tạo thêm vùng không gian tự nhiên bên cạnh món ăn để có thể đặt nhân vật người đứng vào — vùng này phải trông như một phần không gian thực sự của bức ảnh gốc, không bị cắt ghép lộ liễu\n2. Giữ nguyên màu sắc, ánh sáng và phong cách nhiếp ảnh của ảnh gốc\n3. Kết quả phải sắc nét, chuyên nghiệp, phù hợp làm video marketing thực phẩm\n\nẢnh gốc tôi đính kèm bên dưới.`;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setProductImage(dataUrl);
      // Kiểm tra tỉ lệ ảnh so với video
      const img = new window.Image();
      img.onload = () => {
        const isPortraitVideo = config.aspectRatio === '9:16';
        const isLandscapeVideo = config.aspectRatio === '16:9';
        const imgPortrait = img.naturalHeight > img.naturalWidth;
        const imgLandscape = img.naturalWidth > img.naturalHeight;
        const mismatch =
          (isPortraitVideo && !imgPortrait) ||
          (isLandscapeVideo && !imgLandscape);
        setImageRatioWarning(mismatch);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(getChatGptPrompt()).then(() => {
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    });
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
        <div className="glass-card" style={{ padding: 'var(--space-5)' }}>
          {(() => {
            const isGen4Turbo = (config.model === 'runway_ai' || config.model === 'runway_manual') && config.runwayModel === 'gen4_turbo';
            return (
              <h3 className="form-label" style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)', fontSize: 13, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                Hình ảnh sản phẩm mẫu
                {isGen4Turbo && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: productImage ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.1)', color: productImage ? '#16a34a' : '#dc2626', border: `1px solid ${productImage ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.25)'}`, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                    {productImage ? 'Đã có ảnh' : 'Bắt buộc'}
                  </span>
                )}
              </h3>
            );
          })()}
          
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
                  onClick={(e) => { e.stopPropagation(); setProductImage(null); setImageRatioWarning(false); }}
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
          {(config.model === 'runway_ai' || config.model === 'runway_manual') && config.runwayModel === 'gen4_turbo' && !productImage && (
            <p style={{ margin: '10px 0 0', fontSize: 12, color: '#dc2626', lineHeight: 1.5 }}>
              Gen-4 Turbo chỉ hỗ trợ Image-to-Video. Tải ảnh lên để Gemini đọc thông tin thương hiệu và tạo kịch bản chính xác.
            </p>
          )}
          {imageRatioWarning && productImage && (
            <div style={{ marginTop: 10, borderRadius: 10, border: '1px solid rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.07)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                <TriangleAlert size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  Ảnh không phù hợp với tỉ lệ <strong style={{ color: '#f59e0b' }}>{config.aspectRatio}</strong>. Dùng ChatGPT để tạo lại ảnh đúng kích thước và có thêm không gian cho nhân vật — tỉ lệ thành công sẽ cao hơn nhiều.
                </p>
              </div>
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 7, padding: '8px 10px', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {getChatGptPrompt()}
              </div>
              <button
                onClick={handleCopyPrompt}
                style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, border: `1px solid ${promptCopied ? 'rgba(34,197,94,0.4)' : 'rgba(245,158,11,0.4)'}`, background: promptCopied ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.12)', color: promptCopied ? 'var(--text-success, #16a34a)' : 'var(--text-accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                {promptCopied ? <CheckCheck size={13} /> : <Copy size={13} />}
                {promptCopied ? 'Đã sao chép!' : 'Sao chép prompt'}
              </button>
            </div>
          )}
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
        <div className="config-summary glass-card" style={{ padding: 'var(--space-5)' }}>
          <h3 className="form-label" style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)', fontSize: 13, textTransform: 'uppercase' }}>
            Cấu hình hiện tại
          </h3>
          <div className="summary-list" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="summary-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--text-muted)' }}>Model</span>
              <span style={{ fontWeight: 600, color: 'var(--text-accent)' }}>{getModelName(config.model)}</span>
            </div>
            <div className="summary-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--text-muted)' }}>Resolution</span>
              <span style={{ fontWeight: 600, color: 'var(--text-accent)' }}>{config.resolution}</span>
            </div>
            <div className="summary-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--text-muted)' }}>Ratio</span>
              <span style={{ fontWeight: 600, color: 'var(--text-accent)' }}>{config.aspectRatio}</span>
            </div>
            <div className="summary-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--text-muted)' }}>Duration</span>
              <span style={{ fontWeight: 600, color: 'var(--text-accent)' }}>{getDurationLabel(config.duration)}</span>
            </div>
            <div className="summary-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--text-muted)' }}>Voice</span>
              <span style={{ fontWeight: 600, color: 'var(--text-accent)' }}>{voiceLabel}</span>
            </div>
            <div className="summary-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--text-muted)' }}>Style</span>
              <span style={{ fontWeight: 600, color: 'var(--text-accent)' }}>{styleLabel}</span>
            </div>
            <div className="summary-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--text-muted)' }}>Tone</span>
              <span style={{ fontWeight: 600, color: 'var(--text-accent)' }}>{config.activeTone}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
