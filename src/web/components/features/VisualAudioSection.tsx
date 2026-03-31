import React from 'react';
import { EMOTIONS, VISUAL_STYLES, V_GENDER } from '../../constants';
import { RangeSlider } from '../ui/RangeSlider';
import { Toggle } from '../ui/Toggle';

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
  bgMusic, setBgMusic
}: VisualAudioSectionProps) => (
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
          <select className="form-select" value={emotion} onChange={e=>setEmotion(e.target.value)}>
            {EMOTIONS.map(em => <option key={em} value={em}>{em}</option>)}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom:0 }}>
          <label className="form-label">Phong cách</label>
          <select className="form-select" value={activeStyle} onChange={e=>setActiveStyle(e.target.value)}>
            {VISUAL_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

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
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="AI">AI</option>
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

        <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-4)', marginTop: 'auto', display: 'flex', alignItems: 'center', minHeight: '42px' }}>
          <Toggle checked={bgMusic} onChange={setBgMusic} label="Nhạc nền" />
        </div>
      </div>
    </div>
  </div>
);
