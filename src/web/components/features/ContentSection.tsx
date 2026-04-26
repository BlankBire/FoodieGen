import { useState, useRef, useEffect } from 'react';
import { TONES, CHARACTERS } from '../../constants';
import { Search, ChevronDown, User, PlusCircle, MapPin, Sparkles, FileText, Tag, Film } from 'lucide-react';
import { AIModelType } from '../../types';

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
  model: AIModelType;
  videoScenes?: any[];
}

const PRESET_LOCATIONS = [
  'Tại cửa hàng',
  'Trung tâm thương mại',
  'Nhà bếp hiện đại', 
  'Quầy thực phẩm',
  'Ngoài trời / Đường phố'
];

const PRESET_GENRES = [
  'Giới thiệu món ăn',
  'Review nhà hàng',
  'Công thức nấu ăn',
  'Khuyến mãi',
  'Storytelling'
];

const PRESET_SCENES = [
  '1 cảnh',
  '2 cảnh',
  '3 cảnh',
  '5 cảnh',
  '7 cảnh'
];

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
  setVoiceGender,
  model,
  videoScenes = []
}: ContentSectionProps) => {
  // Location custom state
  const isCustomLoc = locationContext !== '' && !PRESET_LOCATIONS.includes(locationContext);
  const [selectedLocOption, setSelectedLocOption] = useState(isCustomLoc ? 'custom' : (locationContext || PRESET_LOCATIONS[0]));

  // Genre custom state
  const isCustomGenre = videoGenre !== '' && !PRESET_GENRES.includes(videoGenre);
  const [selectedGenreOption, setSelectedGenreOption] = useState(isCustomGenre ? 'custom' : videoGenre);
  const [customGenre, setCustomGenre] = useState(isCustomGenre ? videoGenre : '');

  // Scenes custom state
  const isCustomScenes = numScenes !== '' && !PRESET_SCENES.includes(numScenes);
  const [selectedScenesOption, setSelectedScenesOption] = useState(isCustomScenes ? 'custom' : numScenes);
  const [customScenes, setCustomScenes] = useState(() => {
    if (isCustomScenes) {
      const match = numScenes.match(/^(\d+)/);
      return match ? match[1] : '';
    }
    return '';
  });

  // Whether this workflow uses manual script pasting (no AI generation)
  const isManualMode = model === 'runway_manual';

  useEffect(() => {
    if (locationContext === '' && selectedLocOption === 'custom') return;
    const isCustom = locationContext !== '' && !PRESET_LOCATIONS.includes(locationContext);
    setSelectedLocOption(isCustom ? 'custom' : (locationContext || PRESET_LOCATIONS[0]));
  }, [locationContext]);

  useEffect(() => {
    const isCustom = videoGenre !== '' && !PRESET_GENRES.includes(videoGenre);
    setSelectedGenreOption(prev => {
      if (prev === 'custom' && !isCustom) return 'custom';
      return isCustom ? 'custom' : videoGenre;
    });
    if (isCustom) setCustomGenre(videoGenre);
  }, [videoGenre]);

  useEffect(() => {
    const isCustom = numScenes !== '' && !PRESET_SCENES.includes(numScenes);
    setSelectedScenesOption(prev => {
      if (prev === 'custom' && !isCustom) return 'custom';
      return isCustom ? 'custom' : numScenes;
    });
    if (isCustom) {
      const match = numScenes.match(/^(\d+)/);
      if (match) setCustomScenes(match[1]);
    }
  }, [numScenes]);

  const handleCharacterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const charId = e.target.value;
    const char = CHARACTERS.find(c => c.id === charId);
    if (char) {
      setCharacterId(char.id);
      if (char.id !== 'custom_character') {
        setCharacterType(char.gender);
        setVoiceGender(char.gender === 'Nam' ? 'leminh' : 'banmai');
        setMainCharacter(char.defaultDescription);
      } else {
        setMainCharacter('');
      }
    }
  };

  const handleLocationOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedLocOption(val);
    if (val !== 'custom') {
      setLocationContext(val);
    } else {
      setLocationContext('');
    }
  };

  const handleGenreOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedGenreOption(val);
    if (val !== 'custom') {
      setVideoGenre(val);
    }
    // Don't set videoGenre when switching to custom — wait for user input
  };

  const handleCustomGenreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomGenre(val);
    setVideoGenre(val);
  };

  const handleScenesOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedScenesOption(val);
    if (val !== 'custom') {
      setNumScenes(val);
    }
    // Don't set numScenes when switching to custom — wait for user input
  };

  const handleCustomScenesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setCustomScenes(val);
    if (val) {
      setNumScenes(`${val} cảnh`);
    }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          <span className="section-title-dot" />
          Nội dung kịch bản
        </div>
      </div>
      
      <div className="section-card" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {/* 1. Chủ đề */}
        <div className="form-group animate-slide-down" style={{ marginBottom: 0 }}>
          <label className="form-label">Chủ đề món ăn</label>
          <input 
            className="form-input" 
            placeholder="VD: Tô phở bò nóng hổi..." 
            value={foodTopic} 
            onChange={e => setFoodTopic(e.target.value)} 
          />
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
              value={selectedLocOption}
              onChange={handleLocationOptionChange}
            >
              {PRESET_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              <option value="custom">Khác...</option>
            </select>
          </div>
        </div>

        {/* Custom Location Input */}
        {selectedLocOption === 'custom' && (
          <div className="form-group animate-slide-down" style={{ marginBottom: 0 }}>
             <label className="form-label">Nhập bối cảnh riêng</label>
             <div style={{ position: 'relative' }}>
               <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--amber-500)' }} />
               <input 
                 className="form-input" 
                 placeholder="VD: Trong một khu rừng nhiệt đới, Trên mặt trăng..." 
                 style={{ paddingLeft: '36px' }}
                 value={locationContext} 
                 onChange={e => setLocationContext(e.target.value)}
                 autoFocus
               />
             </div>
          </div>
        )}

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
                    background: characterType === g ? 'var(--bg-card)' : 'transparent',
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
              value={selectedGenreOption} 
              onChange={handleGenreOptionChange}
            >
              {PRESET_GENRES.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
              <option value="custom">Khác...</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom:0 }}>
            <label className="form-label">Số cảnh</label>
            <select 
              className="form-select" 
              value={selectedScenesOption} 
              onChange={handleScenesOptionChange}
            >
              {PRESET_SCENES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="custom">Khác...</option>
            </select>
          </div>
        </div>

        {/* Custom Genre Input */}
        {selectedGenreOption === 'custom' && (
          <div className="form-group animate-slide-down" style={{ marginBottom: 0 }}>
            <label className="form-label">Nhập thể loại riêng</label>
            <div style={{ position: 'relative' }}>
              <Tag size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--amber-500)' }} />
              <input 
                className="form-input" 
                placeholder="VD: Behind the scenes, Thử thách ăn uống..." 
                style={{ paddingLeft: '36px' }}
                value={customGenre} 
                onChange={handleCustomGenreChange}
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Custom Scenes Input */}
        {selectedScenesOption === 'custom' && (
          <div className="form-group animate-slide-down" style={{ marginBottom: 0 }}>
            <label className="form-label">Nhập số cảnh tùy chỉnh</label>
            <div style={{ position: 'relative' }}>
              <Film size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--amber-500)' }} />
              <input 
                className="form-input" 
                type="number"
                min={1}
                max={20}
                placeholder="VD: 4" 
                style={{ paddingLeft: '36px', paddingRight: '50px' }}
                value={customScenes} 
                onChange={handleCustomScenesChange}
                autoFocus
              />
              <span style={{ 
                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500, pointerEvents: 'none'
              }}>
                cảnh
              </span>
            </div>
          </div>
        )}

        {/* 4. Tone nội dung */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ marginBottom:10 }}>Tone nội dung</label>
          <div className="tones-container-responsive">
            {TONES.map(t => (
              <button key={t} className={`tone-button-responsive ${activeTone===t?'active':''}`} onClick={()=>setActiveTone(t)}>{t}</button>
            ))}
          </div>
        </div>

        {/* 5. Kịch bản chi tiết */}
        <div style={{ background: 'rgba(245, 158, 11, 0.04)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--amber-200)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 'var(--space-3)' }}>
              <label className="form-label" style={{ marginBottom:0, fontWeight: 700, color: '#b45309' }}>
                {isManualMode ? 'DÁN KỊCH BẢN' : 'KỊCH BẢN CHI TIẾT'}
              </label>
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
                {!isManualMode && (
                  <button 
                    className="btn-primary" 
                    onClick={onGenerateScript}
                    disabled={loading}
                    style={{ padding:'8px 16px', fontSize:13, boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' }}
                  >
                    {loading ? 'Đang tạo...' : 'AI tạo kịch bản'}
                  </button>
                )}
              </div>
            </div>

            {isManualMode && (
              <div style={{
                background: 'rgba(249, 115, 22, 0.06)',
                border: '1px solid rgba(249, 115, 22, 0.15)',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <FileText size={16} style={{ color: '#f97316', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', color: '#b45309', lineHeight: 1.4 }}>
                  Chế độ thủ công - Hãy dán kịch bản có sẵn của bạn vào ô bên dưới.
                </span>
              </div>
            )}

            <textarea 
              className="form-textarea" 
              placeholder={isManualMode 
                ? "Dán kịch bản có sẵn từ bên ngoài vào đây... (VD: nội dung bài viết, mô tả sản phẩm, kịch bản marketing...)" 
                : "Kịch bản sẽ xuất hiện tại đây..."
              } 
              style={{ minHeight: 120, borderColor: 'var(--border-accent)' }} 
              value={script} 
              onChange={e => setScript(e.target.value)} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};
