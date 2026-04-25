import React, { useState, useEffect } from 'react';
import { X, Settings, Eye, EyeOff, Save, CheckCircle2, Lock } from 'lucide-react';
import { AIModelType } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: AIModelType;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, model }) => {
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

  // Determine which API keys are needed based on model
  const needsRunway = model === 'runway_manual' || model === 'runway_ai';
  const needsKling = model === 'kling_ai';
  // Google & FPT are always needed

  // Load keys from localStorage on mount
  useEffect(() => {
    if (isOpen) {
      setGoogleKey(localStorage.getItem('foodiegen_google_api_key') || '');
      setRunwayKey(localStorage.getItem('foodiegen_runway_api_key') || '');
      setFptKey(localStorage.getItem('foodiegen_fpt_api_key') || '');
      setKlingAccessKey(localStorage.getItem('foodiegen_kling_access_key') || '');
      setKlingSecretKey(localStorage.getItem('foodiegen_kling_secret_key') || '');
      setIsSaved(false);
      
      // Ngăn chặn cuộn trang chính khi mở modal
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
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

  const disabledInputStyle = {
    width: '100%',
    padding: '12px 16px',
    paddingRight: '44px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    outline: 'none',
    fontSize: '0.9rem',
    transition: 'border-color 0.2s',
    background: '#f8fafc',
    color: '#94a3b8',
    cursor: 'not-allowed',
  };

  const enabledInputStyle = {
    width: '100%',
    padding: '12px 16px',
    paddingRight: '44px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    outline: 'none',
    fontSize: '0.9rem',
    transition: 'border-color 0.2s',
  };

  const renderApiInput = (
    label: string,
    value: string,
    setValue: (v: string) => void,
    show: boolean,
    setShow: (v: boolean) => void,
    placeholder: string,
    enabled: boolean,
    disabledHint?: string,
  ) => (
    <div className="input-group">
      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: 600, color: enabled ? '#475569' : '#94a3b8', marginBottom: '8px' }}>
        {!enabled && <Lock size={13} style={{ color: '#cbd5e1' }} />}
        {label}
      </label>
      {!enabled && disabledHint && (
        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '6px', fontStyle: 'italic' }}>
          {disabledHint}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        <input 
          type={show ? "text" : "password"}
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={enabled ? placeholder : 'Không cần thiết cho quy trình hiện tại'}
          disabled={!enabled}
          style={enabled ? enabledInputStyle : disabledInputStyle}
        />
        <button 
          onClick={() => setShow(!show)}
          disabled={!enabled}
          style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: enabled ? '#94a3b8' : '#cbd5e1', cursor: enabled ? 'pointer' : 'not-allowed' }}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" style={{
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
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto',
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
          {/* Google Gemini Key — Always enabled */}
          {renderApiInput(
            'Google Gemini API Key',
            googleKey, setGoogleKey,
            showGoogle, setShowGoogle,
            'Nhập mã API từ Google AI Studio...',
            true,
          )}

          {/* RunwayML Key */}
          {renderApiInput(
            'RunwayML API Key',
            runwayKey, setRunwayKey,
            showRunway, setShowRunway,
            'Nhập mã API từ Runway Dashboard...',
            needsRunway,
            'Chỉ cần khi chọn quy trình Runway',
          )}

          {/* FPT AI Key — Always enabled */}
          {renderApiInput(
            'FPT AI API Key (TTS)',
            fptKey, setFptKey,
            showFpt, setShowFpt,
            'Nhập mã API từ FPT.AI Console...',
            true,
          )}

          {/* Kling AI Access Key */}
          {renderApiInput(
            'Kling AI Access Key',
            klingAccessKey, setKlingAccessKey,
            showKlingAccess, setShowKlingAccess,
            'Nhập Access Key từ Kling AI...',
            needsKling,
            'Chỉ cần khi chọn quy trình Kling AI',
          )}

          {/* Kling AI Secret Key */}
          {renderApiInput(
            'Kling AI Secret Key',
            klingSecretKey, setKlingSecretKey,
            showKlingSecret, setShowKlingSecret,
            'Nhập Secret Key từ Kling AI...',
            needsKling,
            'Chỉ cần khi chọn quy trình Kling AI',
          )}
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
        .input-group input:focus:not(:disabled) {
          border-color: #f97316 !important;
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
        }
      `}</style>
    </div>
  );
};
