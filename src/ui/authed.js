import { createAvatar } from '@dicebear/core'
import { funEmoji } from '@dicebear/collection'
import { authedTemplate, escapeHtml, headerTemplate } from './templates'
import { loadProfileForHeader, setupHeaderMenu } from './header'
import { setupOnboarding } from './onboarding'
import { setupVideoPlayer } from './player'
import { getVideos } from '../services/youtube'

const buildVideoCard = (video) => {
  const title = escapeHtml(video.title)
  const channel = escapeHtml(video.channelTitle)
  const duration = video.duration ? escapeHtml(video.duration) : ''
  const media = video.thumbnail
    ? `<img class="h-full w-full object-cover" src="${escapeHtml(video.thumbnail)}" alt="${title}" />`
    : `<div class="h-full w-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950"></div>`

  return `
    <button
      class="relative min-w-[260px] overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 text-left transition hover:border-white/30"
      type="button"
      data-video-card
      data-video-id="${video.id}"
      data-video-title="${title}"
    >
      <div class="aspect-video w-full">
        ${media}
      </div>
      <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent"></div>
      <div class="absolute inset-x-0 bottom-0 space-y-1 px-4 pb-4">
        <p class="text-sm font-semibold text-white">${title}</p>
        <p class="text-xs text-slate-300">${channel}${duration ? ` • ${duration}` : ''}</p>
      </div>
    </button>
  `
}

const setupCarouselControls = ({ app }) => {
  const carousel = app.querySelector('[data-video-carousel]')
  const prevButton = app.querySelector('[data-carousel-prev]')
  const nextButton = app.querySelector('[data-carousel-next]')

  if (!carousel || !prevButton || !nextButton) {
    return () => {}
  }

  const scrollAmount = () => Math.min(320, carousel.clientWidth * 0.8)

  const handlePrev = () => {
    carousel.scrollBy({ left: -scrollAmount(), behavior: 'smooth' })
  }

  const handleNext = () => {
    carousel.scrollBy({ left: scrollAmount(), behavior: 'smooth' })
  }

  prevButton.addEventListener('click', handlePrev)
  nextButton.addEventListener('click', handleNext)

  return () => {
    prevButton.removeEventListener('click', handlePrev)
    nextButton.removeEventListener('click', handleNext)
  }
}

const loadSuggestedVideos = async ({ app }) => {
  const carousel = app.querySelector('[data-video-carousel]')
  const status = app.querySelector('[data-video-status]')
  const section = app.querySelector('[data-video-query]')

  if (!carousel || !status || !section) {
    return
  }

  const query = section.dataset.videoQuery || 'video essay'

  try {
    status.textContent = 'Loading suggestions...'
    const videos = await getVideos({ query, maxResults: 10 })

    if (!videos.length) {
      status.textContent = 'No suggestions found.'
      carousel.innerHTML = ''
      return
    }

    status.textContent = ''
    carousel.innerHTML = videos.map(buildVideoCard).join('')
  } catch (error) {
    console.error('Failed to load YouTube videos', error)
    status.textContent = 'Could not load suggestions.'
    carousel.innerHTML = ''
  }
}

export const renderAuthed = ({ app, supabase, session }) => {
  const user = session?.user
  const placeholderAvatar = createAvatar(funEmoji, {
    seed: user?.id || user?.email || 'emojiboxd',
    size: 64,
  }).toDataUri()

  app.innerHTML = authedTemplate(
    headerTemplate({
      username: user?.email?.split('@')[0] || 'Account',
      avatarUrl: placeholderAvatar,
    })
  )

  const headerCleanup = setupHeaderMenu({ app, supabase })
  const carouselCleanup = setupCarouselControls({ app })
  const playerCleanup = setupVideoPlayer({ app, supabase, user })
  let onboardingCleanup = () => {}

  setupOnboarding({ app, supabase, user }).then((cleanup) => {
    onboardingCleanup = cleanup || (() => {})
  })

  loadProfileForHeader({ app, supabase, user }).catch((error) => {
    console.error('Unable to load profile for header', error)
  })

  loadSuggestedVideos({ app })

  return () => {
    headerCleanup?.()
    carouselCleanup?.()
    playerCleanup?.()
    onboardingCleanup?.()
  }
}
