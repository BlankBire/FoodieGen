'use client'

import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/** Convert Google file URL to proxy URL (adds API key server-side) */
function toProxyUrl(raw: string): string {
  if (!raw?.startsWith('https://generativelanguage.googleapis.com/')) return raw
  const base64 = btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${API_BASE}/api/video/proxy?u=${encodeURIComponent(base64)}`
}
import { RANDOM_TOPICS, TONES } from '../constants'
import { ResolutionType, AspectRatioType, DurationType } from '../types'

// Components
import { AppHeader } from '../components/features/AppHeader'
import { ContentSection } from '../components/features/ContentSection'
import { VideoConfigSection } from '../components/features/VideoConfigSection'
import { VisualAudioSection } from '../components/features/VisualAudioSection'
import { PreviewPanel } from '../components/features/PreviewPanel'

export default function Home() {
  // State: Video Config
  const [resolution,     setResolution]     = useState<ResolutionType>('720p')
  const [aspectRatio,    setAspectRatio]    = useState<AspectRatioType>('9:16')
  const [duration,       setDuration]       = useState<DurationType>('6s')
  const [activeStyle,    setActiveStyle]    = useState('cinematic')
  const [activeTone,     setActiveTone]     = useState(TONES[0])
  const [emotion,        setEmotion]        = useState('Vui tươi')
  const [motionIntensity,setMotionIntensity]= useState(50)
  const [transitions,    setTransitions]    = useState(true)
  const [charConsistency,setCharConsistency]= useState(true)

  // State: Audio Config
  const [voiceGender,    setVoiceGender]    = useState('Nam')
  const [language,       setLanguage]       = useState('vi')
  const [voiceSpeed,     setVoiceSpeed]     = useState(50)
  const [bgMusic,        setBgMusic]        = useState(false)

  // State: Content
  const [foodTopic,      setFoodTopic]      = useState('')
  const [characterType,  setCharacterType]  = useState('Nam')
  const [locationContext,setLocationContext]= useState('Tại cửa hàng')
  const [mainCharacter,  setMainCharacter]  = useState('')
  const [script,         setScript]         = useState('')
  const [scriptId,       setScriptId]       = useState('')
  const [numScenes,      setNumScenes]      = useState('2 cảnh')
  const [videoUrl,       setVideoUrl]       = useState('')
  const [audioUrl,       setAudioUrl]       = useState('')
  const [productImage,   setProductImage]   = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [toast, setToast] = useState<{ message: string; hiding: boolean } | null>(null)
  const [isReadingMode, setIsReadingMode] = useState(false)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isReadingMode) setIsReadingMode(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isReadingMode])

  const showToast = (message: string) => {
    setToast({ message, hiding: false })
    setTimeout(() => {
      setToast(prev => prev ? { ...prev, hiding: true } : null)
      setTimeout(() => setToast(null), 500)
    }, 4000)
  }

  const handleFillSamples = () => {
    const randomIdx = Math.floor(Math.random() * RANDOM_TOPICS.length)
    const item = RANDOM_TOPICS[randomIdx]
    setFoodTopic(item.topic)
    setMainCharacter(item.character)
    setScript(item.script)
  }

  const handleReset = () => {
    setFoodTopic('')
    setMainCharacter('')
    setCharacterType('Nam')
    setLocationContext('Tại cửa hàng')
    setScript('')
    setScriptId('')
    setVideoUrl('')
    setAudioUrl('')
    setProductImage(null)
    alert('Đã làm mới form thành công!')
    setStatus('')
  }

  const handleDownload = () => {
    if (!videoUrl) return
    window.open(videoUrl, '_blank')
  }

  const handleGenerateScript = async () => {
    try {
      if (!foodTopic) {
        alert('Vui lòng nhập chủ đề món ăn.')
        return
      }
      setLoading(true)
      setStatus('Đang phác thảo kịch bản...')

      const userId = '123e4567-e89b-12d3-a456-426614174000' 

      const resContent = await fetch(`${API_BASE}/api/generate/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic: foodTopic, 
          tone: activeTone, 
          projectId: userId,
          characterType,
          locationContext,
          numScenes,
          productImage 
        }),
      })
      const dataContent = await resContent.json()
      if (dataContent.error) throw new Error(dataContent.error)

      setScriptId(dataContent.scriptId)
      
      if (dataContent.warning) {
        showToast(dataContent.warning)
      }
      
      // Format script for human reading
      const formattedScript = dataContent.scenes.map((s: any) => 
        `CẢNH ${s.sceneOrder}: ${s.title}\n- Hình ảnh: ${s.visualDescription}\n- Lời thoại: ${s.audioScript}`
      ).join('\n\n')
      
      setScript(formattedScript)
      alert('✅ ĐÃ TẠO KỊCH BẢN THÀNH CÔNG!')
      setStatus('Kịch bản đã sẵn sàng.')
    } catch (err: any) {
      console.error(err)
      alert('⚠️ LỖI TẠO KỊCH BẢN:\n' + err.message)
      setStatus('Lỗi tạo kịch bản.')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateVideo = async () => {
    try {
      if (!script.trim()) {
        alert('Vui lòng nhập kịch bản hoặc nhấn tạo kịch bản trước.')
        return
      }
      setLoading(true)
      setStatus('Đang gửi lệnh tạo video tới hệ thống AI...')

      const resVideo = await fetch(`${API_BASE}/api/generate/video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scriptId: scriptId,
          manualScript: script, // Send current textarea content
          config: {
            resolution,
            aspectRatio,
            duration,
            style: activeStyle,
            motionIntensity,
            emotion,
            voiceGender,
            voiceSpeed,
            bgMusic,
            productImage
          }
        }),
      })
      const dataVideo = await resVideo.json()
      if (dataVideo.error) throw new Error(dataVideo.error)

      if (dataVideo.results && dataVideo.results.length > 0) {
        const rawVideo = dataVideo.results[0].videoClipUrl
        const rawAudio = dataVideo.results[0].audioUrl
        setVideoUrl(rawVideo ? toProxyUrl(rawVideo) : '')
        setAudioUrl(rawAudio || '')
      }

      const msg = dataVideo.partial ? (dataVideo.message || 'Đã tạo một phần.') : '🎉 HOÀN TẤT! Video đã sẵn sàng.'
      alert(msg)
      setStatus(msg)
    } catch (err: any) {
      console.error(err)
      alert('⚠️ LỖI TẠO VIDEO:\n' + err.message)
      setStatus('Lỗi tạo video.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: '0 var(--space-6) var(--space-8)' }}>
      <AppHeader />

      <main className="main-grid-responsive">
        {/* LEFT — Scrollable form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          
          <ContentSection 
            foodTopic={foodTopic} setFoodTopic={setFoodTopic}
            mainCharacter={mainCharacter} setMainCharacter={setMainCharacter}
            characterType={characterType} setCharacterType={setCharacterType}
            locationContext={locationContext} setLocationContext={setLocationContext}
            script={script} setScript={setScript}
            activeTone={activeTone} setActiveTone={setActiveTone}
            numScenes={numScenes} setNumScenes={setNumScenes}
            onSuggest={handleFillSamples}
            onGenerateScript={handleGenerateScript}
            onToggleReadingMode={() => setIsReadingMode(true)}
            loading={loading}
          />

          <VideoConfigSection 
            resolution={resolution} setResolution={setResolution}
            aspectRatio={aspectRatio} setAspectRatio={setAspectRatio}
            duration={duration} setDuration={setDuration}
          />

          <VisualAudioSection 
            emotion={emotion} setEmotion={setEmotion}
            activeStyle={activeStyle} setActiveStyle={setActiveStyle}
            motionIntensity={motionIntensity} setMotionIntensity={setMotionIntensity}
            transitions={transitions} setTransitions={setTransitions}
            charConsistency={charConsistency} setCharConsistency={setCharConsistency}
            voiceGender={voiceGender} setVoiceGender={setVoiceGender}
            language={language} setLanguage={setLanguage}
            voiceSpeed={voiceSpeed} setVoiceSpeed={setVoiceSpeed}
            bgMusic={bgMusic} setBgMusic={setBgMusic}
          />

          {/* Main Action Buttons — Compact & Clean */}
          <div className="main-actions-container">
            {status && <p style={{ marginRight: 'auto', color: '#6366f1', fontSize: '0.9rem' }}>{status}</p>}
            <button className="btn-secondary btn-draft" style={{ padding: '12px 24px', minWidth: 120 }}>
              Lưu nháp
            </button>
            <button 
              className="btn-generate" 
              onClick={handleGenerateVideo}
              disabled={loading || !script.trim()}
              style={{ width: 'auto', padding: '12px 32px', minWidth: 180, opacity: (loading || !script.trim()) ? 0.7 : 1 }}
            >
              <span>{loading ? 'Đang tạo...' : 'Tạo video'}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </button>
          </div>
        </div>

        {/* RIGHT — Preview & Summary */}
        <PreviewPanel 
          videoUrl={videoUrl}
          audioUrl={audioUrl}
          productImage={productImage}
          setProductImage={setProductImage}
          config={{
            resolution,
            aspectRatio,
            duration,
            voiceGender,
            activeStyle,
            activeTone
          }} 
          onReset={handleReset}
          onDownload={handleDownload}
        />
      </main>

      {/* Toast Notification - Right Side Slide-in (Orange Theme) */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '80px', // Near navbar
          right: '24px',
          zIndex: 9999,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: '360px',
          opacity: toast.hiding ? 0 : 1,
          transform: `translateX(${toast.hiding ? '100%' : '0'})`,
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div style={{
            background: '#ea580c', // Dark orange accent
            color: 'white',
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            pointerEvents: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              color: 'white',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <AlertCircle size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                Thông báo từ AI Studio
              </span>
              <p style={{ fontSize: '13px', opacity: 0.9, lineHeight: 1.4, margin: 0 }}>
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Reading Mode Modal Overlay */}
      {isReadingMode && (
        <div className="reading-mode-overlay" onClick={() => setIsReadingMode(false)}>
          <div className="reading-mode-paper" onClick={e => e.stopPropagation()}>
            <div className="reading-mode-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="section-title-dot" />
                <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.1rem' }}>CHẾ ĐỘ ĐỌC KỊCH BẢN</span>
              </div>
              <button 
                className="btn-icon-small" 
                onClick={() => setIsReadingMode(false)}
                style={{ background: '#f1f5f9', color: '#64748b', border: 'none' }}
              >
                Đóng ×
              </button>
            </div>
            <div className="reading-mode-body">
              <textarea 
                className="reading-mode-textarea"
                value={script}
                onChange={e => setScript(e.target.value)}
                placeholder="Nhập hoặc chỉnh sửa kịch bản của bạn tại đây..."
                autoFocus
              />
            </div>
            <div style={{ padding: '16px 32px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', textAlign: 'right' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Gợi ý: Bạn có thể chỉnh sửa trực tiếp trên trang giấy này.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
