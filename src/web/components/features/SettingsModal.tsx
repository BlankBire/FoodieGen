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

  const [testingStatus, setTestingStatus] = useState<Record<string, 'testing' | 'success' | 'error' | null>>({});
  const [testMessage, setTestMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const handleTestApi = async (provider: string) => {
    let key = '';
    let secret = '';
    
    if (provider === 'gemini') key = googleKey;
    else if (provider === 'runway') key = runwayKey;
    else if (provider === 'fpt') key = fptKey;
    else if (provider === 'kling') {
      key = klingAccessKey;
      secret = klingSecretKey;
    }

    if (!key && provider !== 'kling') {
        setTestMessage({ type: 'error', text: 'Vui lòng nhập API Key trước khi test.' });
        return;
    }
    if (provider === 'kling' && (!key || !secret)) {
        setTestMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ Access Key và Secret Key.' });
        return;
    }

    setTestingStatus(prev => ({ ...prev, [provider]: 'testing' }));
    setTestMessage(null);
    
    try {
      const res = await fetch(`${API_BASE}/api/settings/test-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, key, secret })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setTestingStatus(prev => ({ ...prev, [provider]: 'success' }));
        setTestMessage({ type: 'success', text: data.message || 'API Key hợp lệ!' });
      } else {
        throw new Error(data.error || 'Kiểm tra thất bại');
      }
    } catch (err: any) {
      setTestingStatus(prev => ({ ...prev, [provider]: 'error' }));
      setTestMessage({ type: 'error', text: err.message || 'Lỗi kết nối' });
    }
    
    // Auto clear message after 5s
    setTimeout(() => {
      setTestMessage(null);
    }, 5000);
  };

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
    border: '1px solid var(--border-default)',
    outline: 'none',
    fontSize: '0.9rem',
    transition: 'border-color 0.2s',
    background: 'var(--bg-base)',
    color: 'var(--text-muted)',
    cursor: 'not-allowed',
  };

  const enabledInputStyle = {
    width: '100%',
    padding: '12px 16px',
    paddingRight: '44px',
    borderRadius: '12px',
    border: '1px solid var(--border-default)',
    outline: 'none',
    fontSize: '0.9rem',
    transition: 'border-color 0.2s',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
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
    provider?: string
  ) => {
    const status = provider ? testingStatus[provider] : null;
    return (
      <div className="input-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: 600, color: enabled ? 'var(--text-primary)' : 'var(--text-muted)', marginBottom: '8px' }}>
          {!enabled && <Lock size={13} style={{ color: 'var(--text-muted)' }} />}
          {label}
        </label>
        {!enabled && disabledHint && (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px', fontStyle: 'italic' }}>
            {disabledHint}
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input 
              type={show ? "text" : "password"}
              value={value}
              onChange={e => {
                setValue(e.target.value);
                // Clear test status when user modifies the key
                if (provider) {
                  setTestingStatus(prev => ({ ...prev, [provider]: null }));
                  setTestMessage(null);
                } else if (label.includes('Kling AI Secret Key')) {
                  setTestingStatus(prev => ({ ...prev, kling: null }));
                  setTestMessage(null);
                }
              }}
              placeholder={enabled ? placeholder : 'Không cần thiết cho quy trình hiện tại'}
              disabled={!enabled}
              style={enabled ? enabledInputStyle : disabledInputStyle}
            />
            <button 
              onClick={() => setShow(!show)}
              disabled={!enabled}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: enabled ? 'var(--text-muted)' : 'var(--border-default)', cursor: enabled ? 'pointer' : 'not-allowed' }}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {provider && (
            <button
              onClick={() => handleTestApi(provider)}
              disabled={!enabled || status === 'testing'}
              style={{
                padding: '0 16px',
                borderRadius: '12px',
                background: status === 'testing' ? 'var(--bg-base)' : (status === 'success' ? '#10b981' : (status === 'error' ? '#ef4444' : 'var(--bg-input)')),
                color: status === 'testing' ? 'var(--text-muted)' : (status === 'success' || status === 'error' ? 'white' : 'var(--text-secondary)'),
                border: status === 'success' || status === 'error' ? 'none' : '1px solid var(--border-default)',
                cursor: !enabled || status === 'testing' ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
                minWidth: '70px',
                transition: 'all 0.2s'
              }}
            >
              {status === 'testing' ? '...' : 'Test'}
            </button>
          )}
        </div>
      </div>
    );
  };

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
        maxWidth: '520px',
        background: 'var(--bg-surface)',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--border-default)',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute',
          top: '24px', right: '24px',
          background: 'var(--bg-input)', border: 'none',
          color: 'var(--text-muted)', cursor: 'pointer',
          padding: '4px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '28px', height: '28px',
          transition: 'background 0.2s'
        }}>
          <X size={16} />
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

        {testMessage && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '20px',
            fontSize: '0.875rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: testMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: testMessage.type === 'success' ? '#10b981' : '#ef4444',
            border: `1px solid ${testMessage.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
          }}>
            {testMessage.type === 'success' ? <CheckCircle2 size={16} /> : <X size={16} />}
            {testMessage.text}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Google Gemini Key — Always enabled */}
          {renderApiInput(
            'Google Gemini API Key',
            googleKey, setGoogleKey,
            showGoogle, setShowGoogle,
            'Nhập mã API từ Google AI Studio...',
            true,
            undefined,
            'gemini'
          )}

          {/* RunwayML Key */}
          {renderApiInput(
            'RunwayML API Key',
            runwayKey, setRunwayKey,
            showRunway, setShowRunway,
            'Nhập mã API từ Runway Dashboard...',
            needsRunway,
            'Chỉ cần khi chọn quy trình Runway',
            'runway'
          )}

          {/* FPT AI Key — Always enabled */}
          {renderApiInput(
            'FPT AI API Key (TTS)',
            fptKey, setFptKey,
            showFpt, setShowFpt,
            'Nhập mã API từ FPT.AI Console...',
            true,
            undefined,
            'fpt'
          )}

          {/* Kling AI Keys */}
          {renderApiInput(
            'Kling AI Access Key',
            klingAccessKey, setKlingAccessKey,
            showKlingAccess, setShowKlingAccess,
            'Nhập Access Key từ Kling AI...',
            needsKling,
            'Chỉ cần khi chọn quy trình Kling AI',
            'kling' // Provider 'kling' added to the first one, which will test both
          )}

          {renderApiInput(
            'Kling AI Secret Key',
            klingSecretKey, setKlingSecretKey,
            showKlingSecret, setShowKlingSecret,
            'Nhập Secret Key từ Kling AI...',
            needsKling,
            'Chỉ cần khi chọn quy trình Kling AI',
            // No provider here so we don't duplicate the test button
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

        <p style={{ marginTop: '20px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px dashed var(--border-default)', paddingTop: '16px' }}>
          Lưu ý: Các mã API này sẽ được lưu cục bộ trên máy tính của bạn và chỉ được sử dụng để gọi trực tiếp tới các dịch vụ AI.
        </p>
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .input-group input:focus:not(:disabled) {
          border-color: var(--border-focus) !important;
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15);
        }
      `}</style>
    </div>
  );
};
