import React, { useState, useEffect } from 'react';
import { X, Settings, Eye, EyeOff, Save, CheckCircle2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [googleKey, setGoogleKey] = useState('');
  const [runwayKey, setRunwayKey] = useState('');
  const [fptKey, setFptKey] = useState('');
  const [klingAccessKey, setKlingAccessKey] = useState('');
  const [klingSecretKey, setKlingSecretKey] = useState('');
  
  const [showGoogle, setShowGoogle] = useState(false);
  const [showRunway, setShowRunway] = useState(false);
  const [showFpt, setShowFpt] = useState(false);
  const [showKlingAccess, setShowKlingAccess] = useState(false);
  const [showKlingSecret, setShowKlingSecret] = useState(false);
  
  const [isSaved, setIsSaved] = useState(false);

  // Load keys from localStorage on mount
  useEffect(() => {
    if (isOpen) {
      setGoogleKey(localStorage.getItem('foodiegen_google_api_key') || '');
      setRunwayKey(localStorage.getItem('foodiegen_runway_api_key') || '');
      setFptKey(localStorage.getItem('foodiegen_fpt_api_key') || '');
      setKlingAccessKey(localStorage.getItem('foodiegen_kling_access_key') || '');
      setKlingSecretKey(localStorage.getItem('foodiegen_kling_secret_key') || '');
      setIsSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('foodiegen_google_api_key', googleKey);
    localStorage.setItem('foodiegen_runway_api_key', runwayKey);
    localStorage.setItem('foodiegen_fpt_api_key', fptKey);
    localStorage.setItem('foodiegen_kling_access_key', klingAccessKey);
    localStorage.setItem('foodiegen_kling_secret_key', klingSecretKey);
    
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        width: '100%',
        maxWidth: '500px',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'relative'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute',
          top: '24px', right: '24px',
          background: 'none', border: 'none',
          color: '#64748b', cursor: 'pointer',
          padding: '4px'
        }}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            width: '40px', height: '40px',
            background: 'var(--gradient-primary)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white'
          }}>
            <Settings size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>
              Cấu hình API
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
              Thiết lập mã API để bắt đầu tạo video
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Google Gemini Key */}
          <div className="input-group">
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
              Google Gemini API Key
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showGoogle ? "text" : "password"}
                value={googleKey}
                onChange={e => setGoogleKey(e.target.value)}
                placeholder="Nhập mã API từ Google AI Studio..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  paddingRight: '44px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  outline: 'none',
                  fontSize: '0.9rem',
                  transition: 'border-color 0.2s'
                }}
              />
              <button 
                onClick={() => setShowGoogle(!showGoogle)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                {showGoogle ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* RunwayML Key */}
          <div className="input-group">
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
              RunwayML API Key
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showRunway ? "text" : "password"}
                value={runwayKey}
                onChange={e => setRunwayKey(e.target.value)}
                placeholder="Nhập mã API từ Runway Dashboard..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  paddingRight: '44px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
              <button 
                onClick={() => setShowRunway(!showRunway)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                {showRunway ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* FPT AI Key */}
          <div className="input-group">
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
              FPT AI API Key (TTS)
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showFpt ? "text" : "password"}
                value={fptKey}
                onChange={e => setFptKey(e.target.value)}
                placeholder="Nhập mã API từ FPT.AI Console..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  paddingRight: '44px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
              <button 
                onClick={() => setShowFpt(!showFpt)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                {showFpt ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Kling AI Access Key */}
          <div className="input-group">
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
              Kling AI Access Key
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showKlingAccess ? "text" : "password"}
                value={klingAccessKey}
                onChange={e => setKlingAccessKey(e.target.value)}
                placeholder="Nhập Access Key từ Kling AI..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  paddingRight: '44px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
              <button 
                onClick={() => setShowKlingAccess(!showKlingAccess)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                {showKlingAccess ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Kling AI Secret Key */}
          <div className="input-group">
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
              Kling AI Secret Key
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showKlingSecret ? "text" : "password"}
                value={klingSecretKey}
                onChange={e => setKlingSecretKey(e.target.value)}
                placeholder="Nhập Secret Key từ Kling AI..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  paddingRight: '44px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
              <button 
                onClick={() => setShowKlingSecret(!showKlingSecret)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                {showKlingSecret ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
          <button 
            className="btn-secondary" 
            onClick={onClose}
            style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 600 }}
          >
            Hủy bỏ
          </button>
          <button 
            className="btn-generate"
            onClick={handleSave}
            disabled={isSaved}
            style={{ 
              flex: 2, 
              padding: '12px', 
              borderRadius: '12px', 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: isSaved ? '#10b981' : undefined
            }}
          >
            {isSaved ? (
              <>
                <CheckCircle2 size={18} />
                <span>Đã lưu thành công</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Lưu cấu hình</span>
              </>
            )}
          </button>
        </div>

        <p style={{ marginTop: '20px', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', borderTop: '1px dashed #e2e8f0', paddingTop: '16px' }}>
          Lưu ý: Các mã API này sẽ được lưu cục bộ trên máy tính của bạn và chỉ được sử dụng để gọi trực tiếp tới các dịch vụ AI.
        </p>
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .input-group input:focus {
          border-color: #f97316 !important;
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
        }
      `}</style>
    </div>
  );
};
