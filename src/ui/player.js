import * as faceapi from '@vladmandic/face-api'

const EMOJI = {
  angry: '😠',
  disgusted: '🤢',
  fearful: '😨',
  happy: '😊',
  neutral: '😐',
  sad: '😢',
  surprised: '😲',
}

const EMOTION_CODES = {
  angry: 1,
  disgusted: 2,
  fearful: 3,
  happy: 4,
  neutral: 5,
  sad: 6,
  surprised: 7,
}

const EMOTIONS = Object.keys(EMOJI)
const SEGMENT_COUNT = 5
const SAMPLE_INTERVAL_MS = 1500
const MODEL_URL = '/models'

let ytApiPromise = null
let modelsLoaded = false

const ensureYouTubeApi = () => {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT)
  }

  if (ytApiPromise) {
    return ytApiPromise
  }

  ytApiPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-youtube-api]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.YT))
      existing.addEventListener('error', reject)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    script.dataset.youtubeApi = 'true'

    script.onload = () => {
      if (window.YT?.Player) {
        resolve(window.YT)
      }
    }

    script.onerror = reject
    document.head.appendChild(script)

    window.onYouTubeIframeAPIReady = () => {
      resolve(window.YT)
    }
  })

  return ytApiPromise
}

const ensureModels = async () => {
  if (modelsLoaded) {
    return
  }

  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
  await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
  modelsLoaded = true
}

const createEmptyCounts = () =>
  EMOTIONS.reduce((acc, emotion) => {
    acc[emotion] = 0
    return acc
  }, {})

const pickTopEmotion = (counts) => {
  let top = null
  let topScore = -1

  for (const emotion of EMOTIONS) {
    if (counts[emotion] > topScore) {
      topScore = counts[emotion]
      top = emotion
    }
  }

  return topScore > 0 ? top : null
}

const emotionToCode = (emotion) => EMOTION_CODES[emotion] ?? 0

export const setupVideoPlayer = ({ app, supabase, user }) => {
  const modal = app.querySelector('#video-player-modal')
  const frameShell = app.querySelector('[data-player-shell]')
  const frameContainer = app.querySelector('#video-player-frame')
  const titleEl = app.querySelector('#video-player-title')
  const carousel = app.querySelector('[data-video-carousel]')
  const videoList = app.querySelector('[data-video-list]')
  const dots = Array.from(app.querySelectorAll('[data-emotion-dot]'))
  const cameraVideo = app.querySelector('#emotion-video')

  if (!modal || !frameContainer || !cameraVideo) {
    return () => {}
  }

  let player = null
  let playerReady = false
  let trackingActive = false
  let cameraStream = null
  let sampleTimer = null
  let detecting = false
  let activeSegment = 0
  let segmentCounts = []
  let currentVideo = null
  let hasSaved = false

  const resetTimeline = () => {
    activeSegment = 0
    segmentCounts = Array.from({ length: SEGMENT_COUNT }, () => createEmptyCounts())
    dots.forEach((dot) => {
      dot.textContent = '•'
      dot.classList.remove('text-emerald-300', 'text-amber-200')
      dot.classList.add('text-slate-400')
    })
  }

  const finalizeSegment = (index) => {
    if (!dots[index]) {
      return
    }

    const top = pickTopEmotion(segmentCounts[index])
    if (!top) {
      dots[index].textContent = '•'
      return
    }

    dots[index].textContent = EMOJI[top]
    dots[index].classList.remove('text-slate-400')
    dots[index].classList.add('text-amber-200')
  }

  const finalizeAllSegments = () => {
    for (let index = 0; index < SEGMENT_COUNT; index += 1) {
      finalizeSegment(index)
    }
  }

  const startCamera = async () => {
    if (cameraStream) {
      return
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false,
    })

    cameraVideo.srcObject = stream
    await cameraVideo.play()
    cameraStream = stream
  }

  const stopCamera = () => {
    if (!cameraStream) {
      return
    }

    cameraStream.getTracks().forEach((track) => track.stop())
    cameraVideo.srcObject = null
    cameraStream = null
  }

  const stopSampling = () => {
    if (sampleTimer) {
      clearInterval(sampleTimer)
      sampleTimer = null
    }
  }

  const tick = async () => {
    if (!playerReady || !player) {
      return
    }

    const duration = player.getDuration?.() || 0
    const current = player.getCurrentTime?.() || 0

    if (duration > 0) {
      const segment = Math.min(
        SEGMENT_COUNT - 1,
        Math.floor((current / duration) * SEGMENT_COUNT)
      )

      if (segment !== activeSegment) {
        finalizeSegment(activeSegment)
        activeSegment = segment
      }
    }

    if (!trackingActive || !cameraStream || detecting) {
      return
    }

    if (cameraVideo.readyState < 2) {
      return
    }

    detecting = true
    try {
      const result = await faceapi
        .detectSingleFace(cameraVideo, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions()

      const expressions = result?.expressions
      if (!expressions) {
        return
      }

      const topEmotion = pickTopEmotion(expressions)
      if (topEmotion) {
        segmentCounts[activeSegment][topEmotion] += 1
      }
    } finally {
      detecting = false
    }
  }

  const startSampling = () => {
    if (sampleTimer) {
      return
    }

    sampleTimer = setInterval(tick, SAMPLE_INTERVAL_MS)
  }

  const applyOrientation = (isShort) => {
    const target = frameShell || frameContainer
    if (!target) {
      return
    }

    target.classList.remove('aspect-video', 'aspect-portrait')
    target.classList.add(isShort ? 'aspect-portrait' : 'aspect-video')
  }

  const startTracking = async () => {
    if (trackingActive) {
      startSampling()
      return true
    }

    try {
      await ensureModels()
      await startCamera()
      trackingActive = true
      startSampling()
      return true
    } catch (error) {
      console.error('Emotion tracking failed', error)
      trackingActive = false
      stopSampling()
      stopCamera()
      return false
    }
  }

  const stopTracking = () => {
    trackingActive = false
    stopSampling()
    stopCamera()
  }

  const buildSegmentEmotions = () =>
    segmentCounts.map((counts) => {
      const top = pickTopEmotion(counts)
      return top ? emotionToCode(top) : 0
    })

  const saveResults = async () => {
    if (hasSaved || !supabase || !user?.id || !currentVideo?.id) {
      return
    }

    finalizeAllSegments()
    const payload = {
      user_id: user.id,
      video_id: currentVideo.id,
      video_title: currentVideo.title || null,
      segment_emotions: buildSegmentEmotions(),
    }

    const { error } = await supabase
      .from('video_emotion_segments')
      .upsert(payload, { onConflict: 'user_id,video_id' })

    if (error) {
      console.error('Failed to save emotion segments', error)
      return
    }

    hasSaved = true
  }

  const handlePlayerState = (event) => {
    if (event.data === window.YT?.PlayerState?.PLAYING) {
      if (trackingActive) {
        startSampling()
      }
    } else if (event.data === window.YT?.PlayerState?.ENDED) {
      stopTracking()
      saveResults()
    } else if (event.data !== window.YT?.PlayerState?.BUFFERING) {
      stopSampling()
    }
  }

  const createPlayer = async (videoId) => {
    await ensureYouTubeApi()

    if (!player) {
      await new Promise((resolve) => {
        player = new window.YT.Player(frameContainer, {
          videoId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
            autoplay: 0,
          rel: 0,
          modestbranding: 1,
            playsinline: 1,
        },
        events: {
          onReady: () => {
            playerReady = true
              resolve()
          },
          onStateChange: handlePlayerState,
        },
        })
      })
      return
    }

    player.cueVideoById?.(videoId)
    playerReady = true
  }

  const openPlayer = async ({ videoId, title, isShort }) => {
    resetTimeline()
    hasSaved = false
    currentVideo = { id: videoId, title, isShort }
    stopTracking()

    if (titleEl) {
      titleEl.textContent = title || 'Now playing'
    }

    modal.classList.remove('hidden')
    applyOrientation(Boolean(isShort))
    await createPlayer(videoId)

    const ready = await startTracking()
    if (!ready) {
      if (titleEl) {
        titleEl.textContent = 'Camera permission required to play'
      }
      return
    }

    player?.playVideo?.()
  }

  const closePlayer = () => {
    modal.classList.add('hidden')
    void saveResults()
    stopTracking()
    if (player?.stopVideo) {
      player.stopVideo()
    }
  }

  const handleVideoClick = (event) => {
    const card = event.target.closest('[data-video-card]')
    if (!card) {
      return
    }

    openPlayer({
      videoId: card.dataset.videoId,
      title: card.dataset.videoTitle,
      isShort: card.dataset.videoIsShort === 'true',
    }).catch((error) => {
      console.error('Unable to open player', error)
    })
  }

  const handleModalClick = (event) => {
    if (event.target.closest('[data-player-close]')) {
      closePlayer()
    }
  }

  const handleKeydown = (event) => {
    if (event.key === 'Escape') {
      closePlayer()
    }
  }

  carousel?.addEventListener('click', handleVideoClick)
  videoList?.addEventListener('click', handleVideoClick)
  modal.addEventListener('click', handleModalClick)
  document.addEventListener('keydown', handleKeydown)

  resetTimeline()

  return () => {
    carousel?.removeEventListener('click', handleVideoClick)
    videoList?.removeEventListener('click', handleVideoClick)
    modal.removeEventListener('click', handleModalClick)
    document.removeEventListener('keydown', handleKeydown)
    closePlayer()
    player?.destroy?.()
    player = null
    playerReady = false
  }
}
