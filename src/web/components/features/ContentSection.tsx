import { useState, useRef, useEffect } from 'react';
import { TONES, CHARACTERS } from '../../constants';
import { Search, ChevronDown, User, PlusCircle } from 'lucide-react';

interface ContentSectionProps {
  foodTopic: string;
  setFoodTopic: (v: string) => void;
  mainCharacter: string;
  setMainCharacter: (v: string) => void;
  characterId: string;
  setCharacterId: (v: string) => void;
  characterType: string;
  setCharacterType: (v: string) => void;
  locationContext: string;
  setLocationContext: (v: string) => void;
  script: string;
  setScript: (v: string) => void;
  activeTone: string;
  setActiveTone: (v: string) => void;
  numScenes: string;
  setNumScenes: (v: string) => void;
  onGenerateScript: () => void;
  onToggleReadingMode?: () => void;
  videoGenre: string;
  setVideoGenre: (v: string) => void;
  loading: boolean;
  setVoiceGender: (v: string) => void;
}

export const ContentSection = ({
  foodTopic, setFoodTopic,
  mainCharacter, setMainCharacter,
  characterId, setCharacterId,
  characterType, setCharacterType,
  locationContext, setLocationContext,
  script, setScript,
  activeTone, setActiveTone,
  numScenes, setNumScenes,
  onGenerateScript,
  onToggleReadingMode,
  videoGenre,
  setVideoGenre,
  loading,
  setVoiceGender
}: ContentSectionProps) => {
  const handleCharacterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const charId = e.target.value;
    const char = CHARACTERS.find(c => c.id === charId);
    if (char) {
      setCharacterId(char.id);
      // Nếu là nhân vật tùy chỉnh, giữ nguyên giới tính hiện tại để người dùng tự chọn tiếp
      if (char.id !== 'custom_character') {
        setCharacterType(char.gender);
        setVoiceGender(char.gender === 'Nam' ? 'leminh' : 'banmai');
        setMainCharacter(char.defaultDescription);
      } else {
        // Clear mô tả khi chuyển sang tùy chỉnh để người dùng nhập mới
        setMainCharacter('');
      }
    }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
      <div className="section-title">
        <span className="section-title-dot" />
        Nội dung kịch bản
      </div>
      
      <div className="section-card" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {/* 1. Chủ đề món ăn */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Chủ đề món ăn</label>
          <input className="form-input" placeholder="VD: Tô phở bò nóng hổi..." value={foodTopic} onChange={e => setFoodTopic(e.target.value)} />
        </div>

        {/* 2. Cấu hình Nhân vật & Bối cảnh */}
        <div className="form-row">
          <div className="form-group" style={{ marginBottom:0 }}>
            <label className="form-label">Chọn nhân vật</label>
            <select 
              className="form-select" 
              onChange={handleCharacterChange}
              value={characterId}
            >
              {CHARACTERS.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom:0 }}>
            <label className="form-label">Bối cảnh</label>
            <select 
              className="form-select" 
              value={locationContext} 
              onChange={e => setLocationContext(e.target.value)}
            >
              <option>Tại cửa hàng</option>
              <option>Trung tâm thương mại</option>
              <option>Nhà bếp hiện đại</option>
              <option>Quầy thực phẩm</option>
              <option>Ngoài trời / Đường phố</option>
            </select>
          </div>
        </div>

        {/* 2.1 Lựa chọn giới tính cho nhân vật tùy chỉnh */}
        {characterId === 'custom_character' && (
          <div className="form-group animate-slide-down" style={{ marginBottom: 0 }}>
            <label className="form-label">Giới tính nhân vật</label>
            <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              {['Nam', 'Nữ'].map(g => (
                <button
                  key={g}
                  onClick={() => {
                    setCharacterType(g);
                    setVoiceGender(g === 'Nam' ? 'leminh' : 'banmai');
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    background: characterType === g ? 'white' : 'transparent',
                    color: characterType === g ? 'var(--amber-600)' : 'var(--text-muted)',
                    boxShadow: characterType === g ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                    border: characterType === g ? '1px solid var(--amber-200)' : '1px solid transparent'
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Mô tả nhân vật</label>
          <textarea 
            className="form-textarea" 
            placeholder="Mô tả ngoại hình, tác phong nhân vật..." 
            style={{ minHeight: 80 }} 
            value={mainCharacter} 
            onChange={e => setMainCharacter(e.target.value)} 
          />
        </div>

        {/* 3.Metadata (Thể loại & Số cảnh) */}
        <div className="form-row">
          <div className="form-group" style={{ marginBottom:0 }}>
            <label className="form-label">Thể loại</label>
            <select 
              className="form-select" 
              value={videoGenre} 
              onChange={e => setVideoGenre(e.target.value)}
            >
              <option>Giới thiệu món ăn</option>
              <option>Review nhà hàng</option>
              <option>Công thức nấu ăn</option>
              <option>Khuyến mãi</option>
              <option>Storytelling</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom:0 }}>
            <label className="form-label">Số cảnh</label>
            <select 
              className="form-select" 
              value={numScenes} 
              onChange={e => setNumScenes(e.target.value)}
            >
              <option>1 cảnh</option>
              <option>2 cảnh</option>
              <option>3 cảnh</option>
              <option>5 cảnh</option>
              <option>7 cảnh</option>
            </select>
          </div>
        </div>

        {/* 4. Tone nội dung */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ marginBottom:10 }}>Tone nội dung</label>
          <div className="tones-container-responsive">
            {TONES.map(t => (
              <button key={t} className={`tone-button-responsive ${activeTone===t?'active':''}`} onClick={()=>setActiveTone(t)}>{t}</button>
            ))}
          </div>
        </div>

        {/* 5. Kịch bản chi tiết (NẰM TRONG CARD TRẮNG) */}
        <div style={{ background: 'rgba(245, 158, 11, 0.04)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--amber-200)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 'var(--space-3)' }}>
              <label className="form-label" style={{ marginBottom:0, fontWeight: 700, color: '#b45309' }}>KỊCH BẢN CHI TIẾT</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn-icon-small" 
                  onClick={onToggleReadingMode}
                  title="Mở chế độ đọc toàn màn hình"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  Chế độ đọc
                </button>
                <button 
                  className="btn-primary" 
                  onClick={onGenerateScript}
                  disabled={loading}
                  style={{ padding:'8px 16px', fontSize:13, boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' }}
                >
                  {loading ? 'Đang tạo...' : 'AI tạo kịch bản'}
                </button>
              </div>
            </div>
            <textarea 
              className="form-textarea" 
              placeholder="Kịch bản sẽ xuất hiện tại đây..." 
              style={{ minHeight: 120, background: 'white', borderColor: 'var(--amber-200)' }} 
              value={script} 
              onChange={e => setScript(e.target.value)} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};
