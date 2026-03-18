'use client'

import { useState } from 'react'

/* ─── DATA ─── */
const FOOD_SUBJECTS = [
  'Phở bò', 'Bánh mì', 'Bún chả', 'Cơm tấm',
  'Bánh xèo', 'Trà sữa', 'Cà phê', 'Chè',
]

const VISUAL_STYLES = [
  { id: 'golden',    label: 'Golden Hour' },
  { id: 'closeup',   label: 'Close-Up'   },
  { id: 'cinematic', label: 'Cinematic'  },
  { id: 'dreamy',    label: 'Dreamy'     },
  { id: 'vibrant',   label: 'Vibrant'    },
  { id: 'minimal',   label: 'Minimal'    },
  { id: 'rustic',    label: 'Rustic'     },
  { id: 'luxury',    label: 'Luxury'     },
  { id: 'vintage',   label: 'Vintage'    },
]

const TONES    = ['Cảm xúc', 'Bán hàng', 'Viral', 'Giáo dục', 'Review', 'Kể chuyện', 'Hài hước', 'Sang trọng', 'Kích thích']
const EMOTIONS = ['Vui tươi', 'Sang trọng', 'Ấm cúng', 'Phấn khích', 'Bình yên', 'Mãnh liệt', 'Bí ẩn', 'Tươi mới']
const V_GENDER = ['Nam', 'Nữ', 'AI']

export default function Home() {
  const [resolution,     setResolution]     = useState<'720p'|'1080p'>('1080p')
  const [aspectRatio,    setAspectRatio]    = useState<'9:16'|'16:9'|'1:1'>('9:16')
  const [duration,       setDuration]       = useState<'15s'|'30s'|'60s'>('30s')
  const [activeStyle,    setActiveStyle]    = useState('cinematic')
  const [voiceGender,    setVoiceGender]    = useState('Nữ')
  const [activeTone,     setActiveTone]     = useState('Kích thích')
  const [voiceSpeed,     setVoiceSpeed]     = useState(55)
  const [motionIntensity,setMotionIntensity]= useState(75)
  const [transitions,    setTransitions]    = useState(true)
  const [bgMusic,        setBgMusic]        = useState(true)
  const [autoEnhance,    setAutoEnhance]    = useState(false)
  const [charConsistency,setCharConsistency]= useState(true)
  const [foodTopic,      setFoodTopic]      = useState('')
  const [mainCharacter,  setMainCharacter]  = useState('')
  const [script,         setScript]         = useState('')

  return (
    <div style={{ minHeight: '100vh', padding: '0 var(--space-6) var(--space-8)' }}>

      {/* ── TOP HEADER ── */}
      <header style={{
        textAlign: 'center',
        padding: 'var(--space-8) 0 var(--space-6)',
        borderBottom: '1px solid var(--border-default)',
        marginBottom: 'var(--space-6)',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-2)',
        }}>
          <div style={{
            width: 44, height: 44,
            borderRadius: 'var(--radius-md)',
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
            boxShadow: 'var(--shadow-button)',
          }}>🍽️</div>
          <h1 style={{
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontSize: 28, fontWeight: 500,
            letterSpacing: '-0.01em',
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>FoodieGen</h1>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          Tạo video marketing đồ ăn tự động với AI · Veo 3.1 Fast
        </p>
      </header>

      {/* ── 2-COLUMN LAYOUT ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: 'var(--space-6)',
        alignItems: 'start',
        maxWidth: 1200,
        margin: '0 auto',
      }}>

        {/* ═══════════════════════════
            LEFT — Scrollable form
        ═══════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

          {/* SECTION 1 — Nội dung */}
          <div className="section-card" style={{ margin: 0 }}>
            <div className="section-header">
              <div>
                <div className="section-title">Nội dung</div>
                <div className="section-subtitle">Chủ đề món ăn và kịch bản video</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Chủ đề món ăn *</label>
              <input
                className="form-input"
                placeholder="VD: Tô phở bò nóng hổi, khói bốc nghi ngút..."
                value={foodTopic}
                onChange={e => setFoodTopic(e.target.value)}
              />
              <div className="chip-group" style={{ marginTop: 'var(--space-3)' }}>
                {FOOD_SUBJECTS.map(f => (
                  <button key={f} className={`chip ${foodTopic===f?'active':''}`} onClick={() => setFoodTopic(f)}>{f}</button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mô tả nhân vật chính</label>
              <input
                className="form-input"
                placeholder="VD: Chú chó Shiba mặc áo đầu bếp..."
                value={mainCharacter}
                onChange={e => setMainCharacter(e.target.value)}
              />
            </div>

            <div className="form-group">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 'var(--space-2)' }}>
                <label className="form-label" style={{ marginBottom:0 }}>Kịch bản</label>
                <button className="btn-primary" style={{ padding:'6px 14px', fontSize:12 }}>AI tạo kịch bản</button>
              </div>
              <textarea
                className="form-textarea"
                placeholder="Mô tả từng cảnh quay, hoặc nhấn AI để tự tạo..."
                style={{ minHeight: 90 }}
                value={script}
                onChange={e => setScript(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">Thể loại</label>
                <select className="form-select">
                  <option>Giới thiệu món ăn</option>
                  <option>Review nhà hàng</option>
                  <option>Công thức nấu ăn</option>
                  <option>Khuyến mãi</option>
                  <option>Storytelling</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">Số cảnh</label>
                <select className="form-select">
                  <option>3 cảnh</option>
                  <option>5 cảnh</option>
                  <option>7 cảnh</option>
                  <option>10 cảnh</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2 — Cấu hình video */}
          <div className="section-card" style={{ margin: 0 }}>
            <div className="section-header">
              <div>
                <div className="section-title">Cấu hình video</div>
                <div className="section-subtitle">Chất lượng, tỷ lệ và thời lượng</div>
              </div>
            </div>

            {/* Resolution */}
            <div className="form-group">
              <label className="form-label">Độ phân giải</label>
              <div className="resolution-grid">
                <div className={`resolution-card ${resolution==='720p'?'active':''}`} onClick={()=>setResolution('720p')}>
                  <span className="resolution-badge">720p</span>
                </div>
                <div className={`resolution-card ${resolution==='1080p'?'active':''}`} onClick={()=>setResolution('1080p')}>
                  <span className="resolution-badge">1080p</span>
                </div>
              </div>
            </div>

            {/* AI Model */}
            <div className="form-group">
              <label className="form-label">AI Model</label>
              <div className="ai-model-badge">
                <div className="ai-model-pulse" />
                <div>
                  <div className="ai-model-name">Veo 3.1 Fast</div>
                  <div className="ai-model-desc">Google DeepMind · Ultra-quality food video</div>
                </div>
              </div>
            </div>

            <div className="form-row">
              {/* Aspect ratio */}
              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">Tỷ lệ khung hình</label>
                <select
                  className="form-select"
                  value={aspectRatio}
                  onChange={e => setAspectRatio(e.target.value as '9:16'|'16:9'|'1:1')}
                >
                  <option value="9:16">9:16 - TikTok / Reels</option>
                  <option value="16:9">16:9 - YouTube</option>
                  <option value="1:1">1:1 - Instagram</option>
                </select>
              </div>
              {/* Duration */}
              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">Thời lượng</label>
                <select
                  className="form-select"
                  value={duration}
                  onChange={e => setDuration(e.target.value as '15s'|'30s'|'60s')}
                >
                  <option value="15s">15 giây</option>
                  <option value="30s">30 giây</option>
                  <option value="60s">60 giây</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3 — Tối ưu video AI (2×2 grid) */}
          <div className="section-card" style={{ margin: 0 }}>
            <div className="section-header">
              <div>
                <div className="section-title">Tối ưu video AI</div>
                <div className="section-subtitle">Tinh chỉnh để video đẹp và hiệu quả nhất</div>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-4)' }}>

              {/* Sub-card: Đối tượng */}
              <div style={{
                padding:'var(--space-4)',
                background:'var(--bg-surface)',
                border:'1px solid var(--border-default)',
                borderRadius:'var(--radius-md)',
              }}>
                <div style={{ fontSize:12, fontWeight:500, color:'var(--text-secondary)', marginBottom:'var(--space-4)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                  Đối tượng
                </div>
                <label className="toggle-wrap" style={{ marginBottom:'var(--space-3)', display:'flex' }}>
                  <div className="toggle">
                    <input type="checkbox" checked={charConsistency} onChange={e=>setCharConsistency(e.target.checked)} />
                    <div className="toggle-slider" />
                  </div>
                  <span style={{ fontSize:12, color:'var(--text-secondary)' }}>Nhất quán chủ thể</span>
                </label>

                <div className="form-group" style={{ marginBottom:0 }}>
                  <label className="form-label" style={{ marginBottom:2 }}>Cảm xúc</label>
                  <select className="form-select" style={{ fontSize:12 }}>
                    {EMOTIONS.map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>
              </div>

              {/* Sub-card: Kịch bản */}
              <div style={{
                padding:'var(--space-4)',
                background:'var(--bg-surface)',
                border:'1px solid var(--border-default)',
                borderRadius:'var(--radius-md)',
              }}>
                <div style={{ fontSize:12, fontWeight:500, color:'var(--text-secondary)', marginBottom:'var(--space-4)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                  Kịch bản
                </div>
                <label className="toggle-wrap" style={{ marginBottom:'var(--space-4)', display:'flex' }}>
                  <div className="toggle">
                    <input type="checkbox" checked={autoEnhance} onChange={e=>setAutoEnhance(e.target.checked)} />
                    <div className="toggle-slider" />
                  </div>
                  <span style={{ fontSize:12, color:'var(--text-secondary)' }}>AI viết lại kịch bản hay hơn</span>
                </label>
                <div className="form-group" style={{ marginBottom:0 }}>
                  <label className="form-label" style={{ marginBottom:2 }}>Tone nội dung</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-2)' }}>
                    {TONES.map(t => (
                      <button key={t} className={`segment-btn ${activeTone===t?'active':''}`} style={{ fontSize:11, padding:'4px 10px' }} onClick={()=>setActiveTone(t)}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sub-card: Giọng đọc */}
              <div style={{
                padding:'var(--space-4)',
                background:'var(--bg-surface)',
                border:'1px solid var(--border-default)',
                borderRadius:'var(--radius-md)',
              }}>
                <div style={{ fontSize:12, fontWeight:500, color:'var(--text-secondary)', marginBottom:'var(--space-4)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                  Giọng đọc
                </div>
                <div className="form-group" style={{ marginBottom:'var(--space-3)' }}>
                  <label className="form-label" style={{ marginBottom:2 }}>Kiểu giọng</label>
                  <div style={{ display:'flex', gap:'var(--space-2)' }}>
                    {V_GENDER.map(g => (
                      <button key={g} className={`segment-btn ${voiceGender===g?'active':''}`} style={{ fontSize:11, padding:'4px 10px' }} onClick={()=>setVoiceGender(g)}>{g}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom:'var(--space-3)' }}>
                  <label className="form-label">Ngôn ngữ</label>
                  <select className="form-select" style={{ fontSize:12 }}>
                    <option>Tiếng Việt</option>
                    <option>English</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom:0 }}>
                  <label className="form-label" style={{ marginBottom:2 }}>Tốc độ đọc</label>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text-muted)', marginBottom:4 }}>
                    <span>Chậm</span><span>Nhanh</span>
                  </div>
                  <input type="range" className="range-slider" min={0} max={100} value={voiceSpeed} onChange={e=>setVoiceSpeed(Number(e.target.value))} />
                </div>
              </div>

              {/* Sub-card: Hiệu ứng */}
              <div style={{
                padding:'var(--space-4)',
                background:'var(--bg-surface)',
                border:'1px solid var(--border-default)',
                borderRadius:'var(--radius-md)',
              }}>
                <div style={{ fontSize:12, fontWeight:500, color:'var(--text-secondary)', marginBottom:'var(--space-4)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                  Hiệu ứng hình ảnh
                </div>
                <div className="form-group" style={{ marginBottom:'var(--space-3)' }}>
                  <label className="form-label" style={{ marginBottom:2 }}>Phong cách</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--space-2)' }}>
                    {VISUAL_STYLES.map(s => (
                      <button key={s.id} className={`segment-btn ${activeStyle===s.id?'active':''}`} style={{ fontSize:11, padding:'4px 10px' }} onClick={()=>setActiveStyle(s.id)}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom:'var(--space-3)' }}>
                  <label className="form-label">Cường độ chuyển động</label>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text-muted)', marginBottom:4 }}>
                    <span>Nhẹ</span><span>Mạnh</span>
                  </div>
                  <input type="range" className="range-slider" min={0} max={100} value={motionIntensity} onChange={e=>setMotionIntensity(Number(e.target.value))} />
                </div>
                <label className="toggle-wrap" style={{ marginBottom:'var(--space-3)', display:'flex' }}>
                  <div className="toggle">
                    <input type="checkbox" checked={transitions} onChange={e=>setTransitions(e.target.checked)} />
                    <div className="toggle-slider" />
                  </div>
                  <div style={{ display:'flex', flexDirection:'column' }}>
                    <span style={{ fontSize:12, color:'var(--text-secondary)' }}>Chuyển cảnh</span>
                  </div>
                </label>
                <label className="toggle-wrap" style={{ display:'flex' }}>
                  <div className="toggle">
                    <input type="checkbox" checked={bgMusic} onChange={e=>setBgMusic(e.target.checked)} />
                    <div className="toggle-slider" />
                  </div>
                  <div style={{ display:'flex', flexDirection:'column' }}>
                    <span style={{ fontSize:12, color:'var(--text-secondary)' }}>Nhạc nền</span>
                  </div>
                </label>
              </div>

            </div>
          </div>

          {/* Bottom action bar */}
          <div style={{ display:'flex', gap:'var(--space-3)', justifyContent:'flex-end', paddingBottom:'var(--space-8)' }}>
            <button className="btn-secondary">Lưu nháp</button>
            <button className="btn-primary" style={{ padding:'var(--space-3) var(--space-8)', fontSize:15 }}>
              Tạo video
            </button>
          </div>

        </div>

        {/* ═══════════════════════════
            RIGHT — Sticky preview
        ═══════════════════════════ */}
        <div style={{ position:'sticky', top: 24, display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>

          <div style={{ fontSize:13, fontWeight:500, color:'var(--text-secondary)' }}>
            Xem trước video
          </div>

          {/* Preview screen */}
          <div className="preview-screen">
            <div className="preview-play-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </div>
            <span className="preview-empty-text">Chưa có preview</span>

            <div style={{
              position:'absolute', top:12, right:12,
              background:'rgba(245,158,11,0.12)',
              border:'1px solid var(--border-accent)',
              borderRadius:'var(--radius-sm)',
              padding:'2px 8px', fontSize:10, fontWeight:500,
              color:'var(--amber-600)', zIndex:1,
            }}>{resolution}</div>

            <div style={{
              position:'absolute', bottom:12, left:12,
              background:'rgba(180,130,80,0.1)',
              borderRadius:'var(--radius-sm)',
              padding:'2px 8px', fontSize:10,
              color:'var(--text-muted)', zIndex:1,
            }}>{aspectRatio} · {duration}</div>
          </div>

          {/* Action row — Enhanced buttons */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--space-3)' }}>
            <button className="btn-secondary" style={{
              fontSize:13,
              padding:'var(--space-3) var(--space-2)',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              border: '1px solid var(--border-default)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              Làm lại
            </button>
            <button className="btn-primary" style={{
              fontSize:13,
              padding:'var(--space-3) var(--space-2)',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: 'var(--shadow-button)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Tải xuống
            </button>
          </div>

          {/* Config summary */}
          <div style={{
            padding:'var(--space-4)',
            background:'var(--bg-card)',
            border:'1px solid var(--border-default)',
            borderRadius:'var(--radius-md)',
            fontSize:12,
          }}>
            <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)', marginBottom:'var(--space-3)' }}>
              Cấu hình hiện tại
            </div>
            {[
              ['Model',      'Veo 3.1 Fast'],
              ['Resolution', resolution],
              ['Ratio',      aspectRatio],
              ['Duration',   duration],
              ['Voice',      voiceGender],
              ['Style',      VISUAL_STYLES.find(s=>s.id===activeStyle)?.label ?? ''],
            ].map(([label, value]) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', marginBottom:'var(--space-2)' }}>
                <span style={{ color:'var(--text-muted)' }}>{label}</span>
                <span style={{ color:'var(--amber-600)', fontWeight:500, fontSize:11 }}>{value}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
