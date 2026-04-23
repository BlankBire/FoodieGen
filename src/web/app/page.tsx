'use client'

import React, { useState, useEffect } from 'react'
import { AppHeader } from '../components/features/AppHeader'
import { VideoConfigSection } from '../components/features/VideoConfigSection'
import { ContentSection } from '../components/features/ContentSection'
import { VisualAudioSection } from '../components/features/VisualAudioSection'
import { PreviewPanel } from '../components/features/PreviewPanel'
import { SettingsModal } from '../components/features/SettingsModal'
import { ResolutionType, AspectRatioType, DurationType, AIModelType } from '../types'
import { TONES, CHARACTERS } from '../constants'
import { AlertCircle } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function toAssetUrl(relative: string) {
  if (!relative) return ''
  if (relative.startsWith('http')) return relative
  return `${API_BASE}${relative}`
}

export default function Home() {
  // State: Video Config
  const [resolution,     setResolution]     = useState<ResolutionType>('720p')
  const [aspectRatio,    setAspectRatio]    = useState<AspectRatioType>('9:16')
  const [duration,       setDuration]       = useState<DurationType>('15s')
  const [model,          setModel]          = useState<AIModelType>('runway_manual')
  const [activeStyle,    setActiveStyle]    = useState('cinematic')
  const [activeTone,     setActiveTone]     = useState(TONES[0])
  const [emotion,        setEmotion]        = useState('Vui tươi')
  const [motionIntensity,setMotionIntensity]= useState(50)
  const [transitions,    setTransitions]    = useState(true)
  const [charConsistency,setCharConsistency]= useState(true)

  // State: Audio Config
  const [voiceGender,    setVoiceGender]    = useState('leminh')
  const [language,       setLanguage]       = useState('vi')
  const [voiceSpeed,     setVoiceSpeed]     = useState(50)
  const [voiceOver,      setVoiceOver]      = useState(true)
  const [bgMusic,        setBgMusic]        = useState(false)

  // State: Content
  const [foodTopic,      setFoodTopic]      = useState('')
  const [characterId,    setCharacterId]    = useState('male_chef')
  const [characterType,  setCharacterType]  = useState('Nam')
  const [locationContext,setLocationContext]= useState('Tại cửa hàng')
  const [mainCharacter,  setMainCharacter]  = useState('Nam đầu bếp mặc đồng phục trắng sạch sẽ, mũ cao, tay nghề điêu luyện, gương mặt tập trung nhưng hiền hậu, đam mê nấu nướng và luôn chú trọng đến sự hoàn mỹ trong từng món ăn.')
  const [videoGenre,     setVideoGenre]     = useState('Giới thiệu món ăn')
  const [numScenes,      setNumScenes]      = useState('2 cảnh')

  const [scriptId,       setScriptId]       = useState('')
  const [projectId,      setProjectId]      = useState('123e4567-e89b-12d3-a456-426614174000')
  const [script,         setScript]         = useState('')
  const [videoUrl,       setVideoUrl]       = useState('')
  const [audioUrl,       setAudioUrl]       = useState('')
  const [videoScenes,    setVideoScenes]    = useState<any[]>([])
  const [rawScenes,      setRawScenes]      = useState<any[]>([])
  const [productImage,   setProductImage]   = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [toast, setToast] = useState<{ message: string; hiding: boolean } | null>(null)
  const [isReadingMode, setIsReadingMode] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isReadingMode) setIsReadingMode(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isReadingMode])

  useEffect(() => {
    const saved = localStorage.getItem('foodiegen_draft')
    if (saved) {
      try {
        const d = JSON.parse(saved)
        if (d.resolution) setResolution(d.resolution)
        if (d.aspectRatio) setAspectRatio(d.aspectRatio)
        if (d.duration) setDuration(d.duration)
        if (d.model) setModel(d.model)
        if (d.activeStyle) setActiveStyle(d.activeStyle)
        if (d.activeTone) setActiveTone(d.activeTone)
        if (d.emotion) setEmotion(d.emotion)
        if (d.motionIntensity) setMotionIntensity(d.motionIntensity)
        if (d.transitions !== undefined) setTransitions(d.transitions)
        if (d.charConsistency !== undefined) setCharConsistency(d.charConsistency)
        if (d.voiceGender) setVoiceGender(d.voiceGender)
        if (d.language) setLanguage(d.language)
        if (d.voiceSpeed) setVoiceSpeed(d.voiceSpeed)
        if (d.voiceOver !== undefined) setVoiceOver(d.voiceOver)
        if (d.bgMusic !== undefined) setBgMusic(d.bgMusic)
        if (d.foodTopic) setFoodTopic(d.foodTopic)
        if (d.characterType) setCharacterType(d.characterType)
        if (d.locationContext) setLocationContext(d.locationContext)
        if (d.mainCharacter) setMainCharacter(d.mainCharacter)
        if (d.videoGenre) setVideoGenre(d.videoGenre)
        if (d.script) setScript(d.script)
        if (d.videoScenes) setVideoScenes(d.videoScenes)
        if (d.productImage) setProductImage(d.productImage)
      } catch (e) {}
    }
  }, [])

  const showToast = (message: string) => {
    setToast({ message, hiding: false })
    setTimeout(() => {
      setToast(prev => prev ? { ...prev, hiding: true } : null)
      setTimeout(() => setToast(null), 500)
    }, 3000)
  }

  const handleReset = () => {
    // Reset Video Config
    setResolution('720p')
    setAspectRatio('9:16')
    setDuration('15s')
    setModel('runway_manual')
    setActiveStyle('cinematic')
    setActiveTone(TONES[0])
    setEmotion('Vui tươi')
    setMotionIntensity(50)
    setTransitions(true)
    setCharConsistency(true)

    // Reset Audio Config
    setVoiceGender('Nam')
    setLanguage('vi')
    setVoiceSpeed(50)
    setVoiceOver(true)
    setBgMusic(false)

    // Reset Content
    const defaultChar = CHARACTERS.find(c => c.id === 'male_chef') || CHARACTERS[1]
    setCharacterId(defaultChar.id)
    setMainCharacter(defaultChar.defaultDescription)
    setCharacterType(defaultChar.gender)
    // Default to Le Minh for Male chef
    setVoiceGender('leminh')
    
    setFoodTopic('')
    setVideoGenre('Giới thiệu món ăn')
    setScript('')
    setVideoUrl('')
    setAudioUrl('')
    setVideoScenes([])
    setProductImage(null)
    setStatus('')
    
    localStorage.removeItem('foodiegen_draft')
    showToast('Đã làm mới toàn bộ cài đặt.')
  }

  const handleDownload = async () => {
    if (!videoUrl) return showToast('Chưa có video để tải.')
    try {
      showToast('Đang chuẩn bị tải xuống...')
      const res = await fetch(videoUrl)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `foodiegen_video_${Date.now()}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Download failed:', err)
      showToast('Tải xuống thất bại. Vui lòng thử lại.')
    }
  }

  const handleSaveDraft = async () => {
    try {
      setLoading(true)
      setStatus('Đang lưu bản nháp...')
      
      const payload = {
        name: foodTopic || 'Kịch bản chưa đặt tên',
        projectId: projectId,
        content: {
          scenes: [], // Nếu có parser kịch bản thì đưa vào đây
          config: {
            resolution, aspectRatio, duration, model, activeStyle, activeTone,
            emotion, motionIntensity, transitions, charConsistency,
            voiceGender, language, voiceSpeed, voiceOver, bgMusic,
            characterId, characterType, locationContext, mainCharacter, numScenes, 
            script, foodTopic, videoGenre, productImage, videoUrl, audioUrl
          }
        }
      }

      const res = await fetch(`${API_BASE}/api/projects/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      
      if (data.success) {
        setScriptId(data.id)
        localStorage.setItem('foodiegen_draft', JSON.stringify({
          resolution, aspectRatio, duration, model, activeStyle, activeTone,
          emotion, motionIntensity, transitions, charConsistency,
          voiceGender, language, voiceSpeed, voiceOver, bgMusic,
          foodTopic, characterType, locationContext, mainCharacter, videoGenre,
          script, videoScenes, productImage
        }))
        showToast('Đã lưu kịch bản vào bộ nhớ tạm thời.')
        setStatus('Đã lưu nháp.')
      } else {
        throw new Error(data.error || 'Lưu thất bại')
      }
    } catch (err: any) {
      console.error(err)
      alert('Lỗi khi lưu bản nháp: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateScript = async () => {
    if (!foodTopic.trim()) return alert('Vui lòng nhập món ăn/chủ đề.')
    
    try {
      setLoading(true)
      setStatus('AI đang sáng tạo kịch bản...')
      
      const res = await fetch(`${API_BASE}/api/generate/content`, { 
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-google-api-key': localStorage.getItem('foodiegen_google_api_key') || ''
        },
        body: JSON.stringify({
          topic: foodTopic,
          isMarketingMode: false,
          referenceDoc: '',
          tone: activeTone,
          projectId: projectId,
          characterId,
          characterType,
          mainCharacter,
          locationContext,
          videoGenre,
          numScenes,
          productImage
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      if (data.fullAudioScript || data.scenes) {
        // Compose format hiển thị từ dữ liệu có sẵn
        let displayParts: string[] = []

        if (data.fullAudioScript) {
          displayParts.push(`[LỜI THOẠI TOÀN BỘ VIDEO]\n${data.fullAudioScript}`)
        }

        if (data.scenes && data.scenes.length > 0) {
          displayParts.push(`[CHI TIẾT PHÂN CẢNH]`)
          for (const scene of data.scenes) {
            displayParts.push(
              `CẢNH ${scene.sceneOrder}: ${scene.title}\n- Hình ảnh: ${scene.visualDescription}`
            )
          }
        }

        setScript(displayParts.join('\n\n'))
        if (data.scenes) setRawScenes(data.scenes)
        if (data.scriptId) setScriptId(data.scriptId)
        setStatus('Kịch bản đã sẵn sàng. Hãy nhấn "Tạo video" để bắt đầu dựng phim!')
      }
    } catch (err: any) {
      console.error(err)
      alert('Lỗi tạo kịch bản: ' + err.message)
      setStatus('Lỗi tạo kịch bản.')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateVideo = async () => {
    if (!script.trim()) return alert('Vui lòng tạo hoặc nhập kịch bản trước.')
    
    try {
      setLoading(true)
      setStatus('Đang khởi tạo Pipeline AI...')
      
      // Map workflow model → backend engine
      const backendModel = (model === 'runway_manual' || model === 'runway_ai') ? 'runway' : (model === 'veo3' ? 'veo' : 'kling');

      // 1. Gửi request generate video
      const resVideo = await fetch(`${API_BASE}/api/generate/video`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-runway-api-key': localStorage.getItem('foodiegen_runway_api_key') || '',
          'x-google-api-key': localStorage.getItem('foodiegen_google_api_key') || '',
          'x-fpt-api-key': localStorage.getItem('foodiegen_fpt_api_key') || '',
          'x-kling-access-key': localStorage.getItem('foodiegen_kling_access_key') || '',
          'x-kling-secret-key': localStorage.getItem('foodiegen_kling_secret_key') || '',
        },
        body: JSON.stringify({ 
          scriptId: scriptId,
          manualScript: script, // Nội dung kịch bản ngôn ngữ tự nhiên
          scenes: rawScenes,   // DỮ LIỆU PHÂN CẢNH NHÁP (ẨN DƯỚI GIAO DIỆN)
          config: {
            resolution,
            aspectRatio,
            duration,
            model: backendModel,
            style: activeStyle,
            motionIntensity,
            emotion,
            voiceGender,
            voiceSpeed,
            voiceOver,
            bgMusic,
            productImage
          }
        }),
      })
      const dataVideo = await resVideo.json()
      if (dataVideo.error) throw new Error(dataVideo.error)

      if (dataVideo.success && dataVideo.results?.length > 0) {
        const finalScene = dataVideo.results[0]
        const finalVideoUrl = toAssetUrl(finalScene.videoClipUrl)
        
        setVideoUrl(finalVideoUrl)
        if (finalScene.audioUrl) setAudioUrl(toAssetUrl(finalScene.audioUrl))
        
        // Hiển thị video đã ghép hoàn chỉnh lên Preview
        setVideoScenes([{
          videoClipUrl: finalVideoUrl,
          audioUrl: finalScene.audioUrl ? toAssetUrl(finalScene.audioUrl) : '',
          sceneOrder: 1
        }])
        
        showToast('HOÀN TẤT! Video đã sẵn sàng trên màn hình Preview.')
        setStatus('Đồ ăn đã sẵn sàng phục vụ!')
      } else {
        const msg = dataVideo.partial ? (dataVideo.message || 'Đã tạo một phần.') : 'Có lỗi xảy ra khi tạo video.'
        showToast(msg)
        setStatus(msg)
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.message.includes('API Key')
        ? 'Không thể tạo video. Vui lòng đảm bảo bạn đã nhập đầy đủ API Key (Runway, Google, FPT) trong phần Cài đặt.'
        : 'Quá trình tạo video gặp lỗi (có thể do hệ thống AI quá tải hoặc hết credit). Vui lòng thử lại sau.'
      showToast(msg)
      setStatus('Lỗi tạo video.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: '0 var(--space-6) var(--space-8)' }}>
      <AppHeader onOpenSettings={() => setIsSettingsOpen(true)} />

      <main className="main-grid-responsive">
        {/* LEFT — Scrollable form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>

          <VideoConfigSection 
            resolution={resolution} setResolution={setResolution}
            aspectRatio={aspectRatio} setAspectRatio={setAspectRatio}
            duration={duration} setDuration={setDuration}
            model={model} setModel={setModel}
          />

          
          <ContentSection 
            foodTopic={foodTopic} setFoodTopic={setFoodTopic}
            mainCharacter={mainCharacter} setMainCharacter={setMainCharacter}
            characterId={characterId} setCharacterId={setCharacterId}
            characterType={characterType} setCharacterType={setCharacterType}
            locationContext={locationContext} setLocationContext={setLocationContext}
            script={script} setScript={setScript}
            videoScenes={videoScenes}
            activeTone={activeTone} setActiveTone={setActiveTone}
            numScenes={numScenes} setNumScenes={setNumScenes}
            onGenerateScript={handleGenerateScript}
            onToggleReadingMode={() => setIsReadingMode(true)}
            videoGenre={videoGenre}
            setVideoGenre={setVideoGenre}
            loading={loading}
            setVoiceGender={setVoiceGender}
            model={model}
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
            voiceOver={voiceOver} setVoiceOver={setVoiceOver}
            bgMusic={bgMusic} setBgMusic={setBgMusic}
          />

          {/* Main Action Buttons — Compact & Clean */}
          <div className="main-actions-container">
            {status && <p style={{ marginRight: 'auto', color: '#6366f1', fontSize: '0.9rem' }}>{status}</p>}
            <button 
              className="btn-secondary btn-draft" 
              onClick={handleSaveDraft}
              disabled={loading}
              style={{ padding: '12px 24px', minWidth: 120 }}
            >
              {loading && status === 'Đang lưu bản nháp...' ? 'Đang lưu...' : 'Lưu nháp'}
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

        {/* RIGHT — Preview & Metadata */}
        <PreviewPanel 
          scenes={videoScenes}
          productImage={productImage}
          setProductImage={setProductImage}
          config={{
            resolution,
            aspectRatio,
            duration,
            model,
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
                Thông báo từ FoodieGen
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
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        model={model}
      />
    </div>
  )
}
