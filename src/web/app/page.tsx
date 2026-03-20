'use client'

import { useState } from 'react'

/* ─── DATA ─── */

const RANDOM_TOPICS = [
  {
    topic: 'Tô phở bò Nam Định nạm gầu, nước dùng trong vắt, khói bốc nghi ngút buổi sáng',
    character: 'Chủ quán phở thân thiện, mặc tạp dề trắng, đang thái thịt bò điêu luyện',
    script: 'Cảnh 1: Cận cảnh nồi nước dùng sôi sùng sục, khói mờ ảo.\nCảnh 2: Đôi bàn tay chủ quán thoắt xếp bánh phở vào tô.\nCảnh 3: Những lát thịt bò nạm tươi ngon được xếp đều lên trên.\nCảnh 4: Rưới nước dùng nóng hổi, tiếng "xèo xèo" nhẹ nhàng.\nCảnh 5: Khách hàng húp một thìa nước dùng, nét mặt mãn nguyện.'
  },
  {
    topic: 'Ổ bánh mì Sài Gòn đặc biệt đầy ắp thịt nguội, bơ xanh và đồ chua giòn rụm',
    character: 'Cô bán bánh mì vui tính, tay đeo bao tay nilon, thao tác cực nhanh',
    script: 'Cảnh 1: Lưỡi dao rạch một đường dứt khoát lên ổ bánh mì nóng giòn.\nCảnh 2: Phết bơ và pate đều tăm tắp vào lòng bánh.\nCảnh 3: Xếp từng lát thịt nguội, giò chả xen kẽ đẹp mắt.\nCảnh 4: Thêm dưa chuột, đồ chua và một chút ớt tươi.\nCảnh 5: Gói bánh vào tờ giấy báo, đưa cho thực khách đang chờ.'
  },
  {
    topic: 'Ly cà phê muối thơm nồng, lớp kem mặn sánh mịn quyện cùng vị đắng đậm đà',
    character: 'Bạn barista trẻ trung, tập trung cao độ khi pha chế',
    script: 'Cảnh 1: Cà phê phin từng giọt tí tách rơi xuống lớp sữa đặc.\nCảnh 2: Đánh bông lớp kem muối bằng máy cầm tay cho đến khi mịn mượt.\nCảnh 3: Rót nhẹ nhàng lớp kem trắng muốt lên bề mặt cà phê nâu đậm.\nCảnh 4: Rắc một chút bột cacao hoặc muối biển lên trên cùng.\nCảnh 5: Quay chậm cảnh khuấy nhẹ ly cà phê, tạo hiệu ứng vân mây đẹp mắt.'
  },
  {
    topic: 'Mẹt bún đậu mắm tôm đầy đủ sứa, dồi sụn nướng béo ngậy và thịt chân giò luộc',
    character: 'Người phục vụ nhanh nhẹn, bưng mẹt bún đậu khổng lồ ra bàn',
    script: 'Cảnh 1: Cận cảnh những miếng đậu hũ đang chiên vàng ươm trong chảo dầu.\nCảnh 2: Cắt miếng đậu hũ thấy rõ độ giòn bên ngoài và mềm nóng bên trong.\nCảnh 3: Vắt quất vào bát mắm tôm, đánh sủi bọt trắng xóa.\nCảnh 4: Sắp xếp bún lá, rau thơm và các loại topping lên mẹt tre.\nCảnh 5: Thực khách chấm một miếng đậu vào bát mắm tôm và thưởng thức.'
  }
]

const VISUAL_STYLES = [
  { id: 'cinematic', label: 'Cinematic'  },
  { id: 'golden',    label: 'Golden Hour' },
  { id: 'closeup',   label: 'Close-Up'   },
  { id: 'dreamy',    label: 'Dreamy'     },
  { id: 'vibrant',   label: 'Vibrant'    },
  { id: 'minimal',   label: 'Minimal'    },
  { id: 'rustic',    label: 'Rustic'     },
  { id: 'luxury',    label: 'Luxury'     },
  { id: 'vintage',   label: 'Vintage'    },
]

const TONES    = ['Kích thích', 'Sang trọng', 'Cảm xúc', 'Bán hàng', 'Viral', 'Review', 'Giáo dục', 'Kể chuyện', 'Hài hước']
const EMOTIONS = ['Vui tươi', 'Sang trọng', 'Ấm cúng', 'Phấn khích', 'Bình yên', 'Mãnh liệt', 'Bí ẩn', 'Tươi mới']
const V_GENDER = ['Nam', 'Nữ', 'AI']

export default function Home() {
  const [resolution,     setResolution]     = useState<'720p'|'1080p'>('720p')
  const [aspectRatio,    setAspectRatio]    = useState<'9:16'|'16:9'|'1:1'>('9:16')
  const [duration,       setDuration]       = useState<'15s'|'30s'|'60s'>('15s')
  const [activeStyle,    setActiveStyle]    = useState('cinematic')
  const [voiceGender,    setVoiceGender]    = useState('Nam')
  const [activeTone,     setActiveTone]     = useState('Kích thích')
  const [voiceSpeed,     setVoiceSpeed]     = useState(50)
  const [motionIntensity,setMotionIntensity]= useState(50)
  const [transitions,    setTransitions]    = useState(true)
  const [bgMusic,        setBgMusic]        = useState(false)
  const [autoEnhance,    setAutoEnhance]    = useState(false)
  const [charConsistency,setCharConsistency]= useState(true)
  const [foodTopic,      setFoodTopic]      = useState('')
  const [mainCharacter,  setMainCharacter]  = useState('')
  const [script,         setScript]         = useState('')
  const [emotion,        setEmotion]        = useState('Vui tươi')
  const [language,       setLanguage]       = useState('vi')

  const handleFillSamples = () => {
    const randomIdx = Math.floor(Math.random() * RANDOM_TOPICS.length)
    const item = RANDOM_TOPICS[randomIdx]
    setFoodTopic(item.topic)
    setMainCharacter(item.character)
    setScript(item.script)
  }

  /* Helper for dropdown with arrow */
  const CustomSelect = ({ children, style, ...props }: any) => (
    <div style={{ position: 'relative', width: '100%' }}>
      <select 
        className="form-select" 
        style={{ 
          ...style, 
          appearance: 'none', 
          paddingRight: '32px',
          height: 42,
          fontSize: 13,
          background: 'var(--bg-surface)'
        }} 
        {...props}
      >
        {children}
      </select>
      <div style={{ 
        position: 'absolute', 
        right: 12, 
        top: '50%', 
        transform: 'translateY(-50%)', 
        pointerEvents: 'none',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center'
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', padding: '0 var(--space-6) var(--space-8)' }}>

      {/* ── TOP HEADER ── */}
      <header className="header-responsive" style={{
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
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img 
              src="/logo.png" 
              alt="FoodieGen Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </div>
          <h1 className="header-title" style={{
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
          Tạo video marketing đồ ăn tự động với AI
        </p>
      </header>

      {/* ── 2-COLUMN LAYOUT ── */}
      <div className="main-grid-responsive">

        {/* ═══════════════════════════
            LEFT — Scrollable form
        ═══════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

          {/* SECTION 1 — Nội dung */}
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--amber-600)', textTransform:'uppercase', letterSpacing:'0.06em', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:4, height:16, background:'var(--amber-600)', borderRadius:2 }} />
              Nội dung
            </div>
            
            <div className="section-card" style={{ margin: 0 }}>
              <div className="form-group">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 'var(--space-2)' }}>
                  <label className="form-label" style={{ marginBottom:0 }}>Chủ đề món ăn</label>
                  <button 
                    className="btn-secondary" 
                    style={{ padding:'4px 10px', fontSize:11, fontWeight:600, borderColor:'var(--amber-300)', color:'var(--amber-600)' }}
                    onClick={handleFillSamples}
                  >
                    Gợi ý ý tưởng
                  </button>
                </div>
                <input
                  className="form-input"
                  placeholder="VD: Tô phở bò nóng hổi, khói bốc nghi ngút..."
                  value={foodTopic}
                  onChange={e => setFoodTopic(e.target.value)}
                />
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

              <div style={{ 
                background: 'rgba(245, 158, 11, 0.03)', 
                padding: 'var(--space-4)', 
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                marginBottom: 'var(--space-5)'
              }}>
                <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 'var(--space-2)' }}>
                    <label className="form-label" style={{ marginBottom:0 }}>Kịch bản chi tiết</label>
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

                <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-3)' }}>
                  <div className="form-group" style={{ marginBottom:0 }}>
                    <label className="form-label" style={{ marginBottom:10, fontSize:11 }}>Tone nội dung</label>
                    <div className="tones-container-responsive">
                      {TONES.map(t => (
                        <button 
                          key={t} 
                          className={`tone-button-responsive ${activeTone===t?'active':''}`} 
                          onClick={()=>setActiveTone(t)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
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
          </div>

          {/* SECTION 2 — Cấu hình video */}
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--amber-600)', textTransform:'uppercase', letterSpacing:'0.06em', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:4, height:16, background:'var(--amber-600)', borderRadius:2 }} />
              Cấu hình video
            </div>

            <div className="section-card" style={{ margin: 0 }}>
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
                    <option value="9:16">9:16</option>
                    <option value="16:9">16:9</option>
                    <option value="1:1">1:1</option>
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
          </div>

            {/* ── VISUAL & AUDIO GRID ── */}
            <div className="config-grid" style={{ marginTop: 'var(--space-2)' }}>
              
              {/* === COL 1: VISUALS === */}
              <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--amber-600)', textTransform:'uppercase', letterSpacing:'0.06em', display:'flex', alignItems:'center', gap:8, minHeight:20 }}>
                  <span style={{ width:4, height:16, background:'var(--amber-600)', borderRadius:2 }} />
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
                    <div style={{ padding: '4px 0' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text-muted)', marginBottom:4 }}>
                        <span>Nhẹ (x0.5)</span>
                        <span>Chuẩn (x1.0)</span>
                        <span>Mạnh (x1.5)</span>
                      </div>
                      <input type="range" className="range-slider" min={0} max={100} value={motionIntensity} onChange={e=>setMotionIntensity(Number(e.target.value))} />
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-4)', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="toggle-wrap" style={{ display:'flex', alignItems: 'center' }}>
                      <div className="toggle">
                        <input type="checkbox" checked={transitions} onChange={e=>setTransitions(e.target.checked)} />
                        <div className="toggle-slider" />
                      </div>
                      <span style={{ fontSize:12, color:'var(--text-primary)', fontWeight:500 }}>Chuyển cảnh</span>
                    </label>

                    <label className="toggle-wrap" style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:12, color:'var(--text-primary)', fontWeight:500 }}>Nhất quán chủ thể</span>
                        <div className="toggle">
                          <input type="checkbox" checked={charConsistency} onChange={e=>setCharConsistency(e.target.checked)} />
                          <div className="toggle-slider" />
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* === COL 2: AUDIO === */}
              <div style={{ display:'flex', flexDirection:'column', gap:'var(--space-4)' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--amber-600)', textTransform:'uppercase', letterSpacing:'0.06em', display:'flex', alignItems:'center', gap:8, minHeight:20 }}>
                  <span style={{ width:4, height:16, background:'var(--amber-600)', borderRadius:2 }} />
                  Âm thanh & Thuyết minh
                </div>

                <div className="section-card" style={{ padding:'var(--space-4)', margin:0, flex:1, display:'flex', flexDirection:'column', gap:'var(--space-5)' }}>
                  <div className="form-group" style={{ marginBottom:0 }}>
                    <label className="form-label">Kiểu giọng</label>
                    <select className="form-select" value={voiceGender} onChange={e=>setVoiceGender(e.target.value)}>
                      {V_GENDER.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom:0 }}>
                    <label className="form-label">Ngôn ngữ</label>
                    <select className="form-select" value={language} onChange={e=>setLanguage(e.target.value)}>
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">Tiếng Anh</option>
                      <option value="jp">Tiếng Nhật</option>
                      <option value="kr">Tiếng Hàn</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom:0 }}>
                    <label className="form-label">Tốc độ đọc</label>
                    <div style={{ padding: '4px 0' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text-muted)', marginBottom:4 }}>
                        <span>Chậm (0.5x)</span>
                        <span>Vừa (1.0x)</span>
                        <span>Nhanh (1.5x)</span>
                      </div>
                      <input type="range" className="range-slider" min={0} max={100} value={voiceSpeed} onChange={e=>setVoiceSpeed(Number(e.target.value))} />
                    </div>
                  </div>

                  <div style={{ 
                    borderTop: '1px solid var(--border-default)', 
                    paddingTop: 'var(--space-4)', 
                    marginTop: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '42px' // Đồng bộ độ cao với cụm 2 nút bên Visual
                  }}>
                    <label className="toggle-wrap" style={{ display:'flex', alignItems: 'center', margin: 0 }}>
                      <div className="toggle">
                        <input type="checkbox" checked={bgMusic} onChange={e=>setBgMusic(e.target.checked)} />
                        <div className="toggle-slider" />
                      </div>
                      <span style={{ fontSize:12, color:'var(--text-primary)', fontWeight:500 }}>Nhạc nền</span>
                    </label>
                  </div>
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
        <aside className="preview-sidebar" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 'var(--space-6)' 
        }}>

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
          <div style={{ 
            display:'grid', 
            gridTemplateColumns:'1fr 1fr', 
            gap:'var(--space-3)',
            marginBottom: 'var(--space-2)' // Thêm khoảng cách với bảng cấu hình
          }}>
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
        </aside>
      </div>
    </div>
  )
}
