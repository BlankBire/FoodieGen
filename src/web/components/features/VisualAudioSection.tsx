import React, { useState, useEffect } from 'react';
import { EMOTIONS, VISUAL_STYLES, VOICES } from '../../constants';
import { RangeSlider } from '../ui/RangeSlider';
import { Toggle } from '../ui/Toggle';
import { Heart, Palette } from 'lucide-react';

interface VisualAudioSectionProps {
  emotion: string;
  setEmotion: (v: string) => void;
  activeStyle: string;
  setActiveStyle: (v: string) => void;
  motionIntensity: number;
  setMotionIntensity: (v: number) => void;
  transitions: boolean;
  setTransitions: (v: boolean) => void;
  charConsistency: boolean;
  setCharConsistency: (v: boolean) => void;
  voiceGender: string;
  setVoiceGender: (v: string) => void;
  language: string;
  setLanguage: (v: string) => void;
  voiceSpeed: number;
  setVoiceSpeed: (v: number) => void;
  voiceOver: boolean;
  setVoiceOver: (v: boolean) => void;
  bgMusic: boolean;
  setBgMusic: (v: boolean) => void;
}

export const VisualAudioSection = ({
  emotion, setEmotion,
  activeStyle, setActiveStyle,
  motionIntensity, setMotionIntensity,
  transitions, setTransitions,
  charConsistency, setCharConsistency,
  voiceGender, setVoiceGender,
  language, setLanguage,
  voiceSpeed, setVoiceSpeed,
  voiceOver, setVoiceOver,
  bgMusic, setBgMusic
}: VisualAudioSectionProps) => {
  // Emotion custom state
  const isCustomEmotion = emotion !== '' && !EMOTIONS.includes(emotion);
  const [selectedEmotionOption, setSelectedEmotionOption] = useState(isCustomEmotion ? 'custom' : emotion);
  const [customEmotion, setCustomEmotion] = useState(isCustomEmotion ? emotion : '');

  // Style custom state
  const isCustomStyle = activeStyle !== '' && !VISUAL_STYLES.some(s => s.id === activeStyle);
  const [selectedStyleOption, setSelectedStyleOption] = useState(isCustomStyle ? 'custom' : activeStyle);
  const [customStyle, setCustomStyle] = useState(isCustomStyle ? activeStyle : '');

  useEffect(() => {
    const isCustom = emotion !== '' && !EMOTIONS.includes(emotion);
    setSelectedEmotionOption(prev => {
      if (prev === 'custom' && !isCustom) return 'custom';
      return isCustom ? 'custom' : emotion;
    });
    if (isCustom) setCustomEmotion(emotion);
  }, [emotion]);

  useEffect(() => {
    const isCustom = activeStyle !== '' && !VISUAL_STYLES.some(s => s.id === activeStyle);
    setSelectedStyleOption(prev => {
      if (prev === 'custom' && !isCustom) return 'custom';
      return isCustom ? 'custom' : activeStyle;
    });
    if (isCustom) setCustomStyle(activeStyle);
  }, [activeStyle]);

  const handleEmotionOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedEmotionOption(val);
    if (val !== 'custom') {
      setEmotion(val);
    }
    // Don't set emotion when switching to custom — wait for user input
  };

  const handleCustomEmotionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomEmotion(val);
    setEmotion(val);
  };

  const handleStyleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedStyleOption(val);
    if (val !== 'custom') {
      setActiveStyle(val);
    }
    // Don't set activeStyle when switching to custom — wait for user input
  };

  const handleCustomStyleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomStyle(val);
    setActiveStyle(val);
  };

  return (
    <div className="config-grid" style={{ marginTop: 'var(--space-2)' }}>
      {/* COL 1: VISUALS */}
      <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
        <div className="section-title">
          <span className="section-title-dot" />
          Hình ảnh & Chuyển động
        </div>

        <div className="section-card" style={{ padding:'var(--space-4)', margin:0, flex:1, display:'flex', flexDirection:'column', gap:'var(--space-5)' }}>
          <div className="form-group" style={{ marginBottom:0 }}>
            <label className="form-label">Cảm xúc</label>
            <select 
              className="form-select" 
              value={selectedEmotionOption} 
              onChange={handleEmotionOptionChange}
            >
              {EMOTIONS.map(em => <option key={em} value={em}>{em}</option>)}
              <option value="custom">Khác...</option>
            </select>
          </div>

          {/* Custom Emotion Input */}
          {selectedEmotionOption === 'custom' && (
            <div className="form-group animate-slide-down" style={{ marginBottom: 0 }}>
              <label className="form-label">Nhập cảm xúc riêng</label>
              <div style={{ position: 'relative' }}>
                <Heart size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--amber-500)' }} />
                <input 
                  className="form-input" 
                  placeholder="VD: Hoài niệm, Lãng mạn, Hào hứng..." 
                  style={{ paddingLeft: '36px' }}
                  value={customEmotion} 
                  onChange={handleCustomEmotionChange}
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom:0 }}>
            <label className="form-label">Phong cách</label>
            <select 
              className="form-select" 
              value={selectedStyleOption} 
              onChange={handleStyleOptionChange}
            >
              {VISUAL_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              <option value="custom">Khác...</option>
            </select>
          </div>

          {/* Custom Style Input */}
          {selectedStyleOption === 'custom' && (
            <div className="form-group animate-slide-down" style={{ marginBottom: 0 }}>
              <label className="form-label">Nhập phong cách riêng</label>
              <div style={{ position: 'relative' }}>
                <Palette size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--amber-500)' }} />
                <input 
                  className="form-input" 
                  placeholder="VD: Neon Cyberpunk, Film Noir, Anime..." 
                  style={{ paddingLeft: '36px' }}
                  value={customStyle} 
                  onChange={handleCustomStyleChange}
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="form-group" style={{ marginBottom:0 }}>
            <label className="form-label">Cường độ chuyển động</label>
            <RangeSlider 
              min={0} max={100} value={motionIntensity} onChange={setMotionIntensity}
              labels={{ min: 'Nhẹ (x0.5)', mid: 'Chuẩn (x1.0)', max: 'Mạnh (x1.5)' }}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-4)', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Toggle checked={transitions} onChange={setTransitions} label="Chuyển cảnh" />
            <Toggle checked={charConsistency} onChange={setCharConsistency} label="Nhất quán chủ thể" direction="column" align="flex-end" />
          </div>
        </div>
      </div>

      {/* COL 2: AUDIO */}
      <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
        <div className="section-title">
          <span className="section-title-dot" />
          Âm thanh & Thuyết minh
        </div>

        <div className="section-card" style={{ padding:'var(--space-4)', margin:0, flex:1, display:'flex', flexDirection:'column', gap:'var(--space-5)' }}>
          <div className="form-group" style={{ marginBottom:0 }}>
            <label className="form-label">Kiểu giọng</label>
            <select className="form-select" value={voiceGender} onChange={e=>setVoiceGender(e.target.value)}>
              {VOICES.map(v => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom:0 }}>
            <label className="form-label">Ngôn ngữ</label>
            <select className="form-select" value={language} onChange={e=>setLanguage(e.target.value)}>
              <option value="vi">Tiếng Việt</option>
              <option value="en">Tiếng Anh</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom:0 }}>
            <label className="form-label">Tốc độ đọc</label>
            <RangeSlider 
              min={0} max={100} value={voiceSpeed} onChange={setVoiceSpeed}
              labels={{ min: 'Chậm (0.5x)', mid: 'Vừa (1.0x)', max: 'Nhanh (1.5x)' }}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-4)', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '42px' }}>
            <Toggle checked={voiceOver} onChange={setVoiceOver} label="Thuyết minh" />
            <Toggle checked={bgMusic} onChange={setBgMusic} label="Nhạc nền" direction="column" align="flex-end" />
          </div>
        </div>
      </div>
    </div>
  );
};
