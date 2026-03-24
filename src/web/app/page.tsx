'use client'

import { useState } from 'react'

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
  const [duration,       setDuration]       = useState<DurationType>('15s')
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
  const [numScenes,      setNumScenes]      = useState('2 cảnh')
  const [videoUrl,       setVideoUrl]       = useState('')
  const [productImage,   setProductImage]   = useState<string | null>(null)

  // State: UI
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  const handleFillSamples = () => {
    const randomIdx = Math.floor(Math.random() * RANDOM_TOPICS.length)
    const item = RANDOM_TOPICS[randomIdx]
    setFoodTopic(item.topic)
    setMainCharacter(item.character)
    setScript(item.script)
  }

  const handleGenerate = async () => {
    try {
      setLoading(true)
      setStatus('Khởi tạo dự án...')

      // 0. Create Project (Mock/Simple)
      // In real app, we might check if a project exists or create a new one
      // For now, let's assume we have a simple internal user ID
      const userId = '123e4567-e89b-12d3-a456-426614174000' // Mock UUID

      setStatus('Đang phác thảo kịch bản...')

      // 1. Generate Content (Script)
      const resContent = await fetch('http://localhost:3001/api/generate/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic: foodTopic, 
          tone: activeTone, 
          projectId: userId,
          characterType,
          locationContext,
          numScenes
        }),
      })
      const dataContent = await resContent.json()
      if (dataContent.error) throw new Error(dataContent.error)

      setScript(JSON.stringify(dataContent.scenes, null, 2))
      setStatus('Đang gửi lệnh tạo video tới Veo3...')

      // 2. Generate Video
      const resVideo = await fetch('http://localhost:3001/api/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scriptId: dataContent.scriptId,
          generationId: undefined,
          config: {
            resolution,
            aspectRatio,
            duration,
            style: activeStyle,
            motionIntensity,
          }
        }),
      })
      const dataVideo = await resVideo.json()
      if (dataVideo.error) throw new Error(dataVideo.error)

      // Get the first clip URL as preview (use proxy for Google URLs - they need API key)
      if (dataVideo.results && dataVideo.results.length > 0) {
        const raw = dataVideo.results[0].videoClipUrl
        setVideoUrl(raw ? toProxyUrl(raw) : '')
      }

      setStatus(dataVideo.partial ? (dataVideo.message || 'Đã tạo một phần.') : 'Hoàn tất! Video đã sẵn sàng.')
    } catch (err: any) {
      console.error(err)
      setStatus('Lỗi: ' + err.message)
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
            onGenerateScript={handleGenerate}
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
              onClick={handleGenerate}
              disabled={loading}
              style={{ width: 'auto', padding: '12px 32px', minWidth: 180, opacity: loading ? 0.7 : 1 }}
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
        />
      </main>
    </div>
  )
}
