import { createAvatar } from '@dicebear/core'
import { funEmoji } from '@dicebear/collection'
import { authedTemplate, escapeHtml, headerTemplate } from './templates'
import { loadProfileForHeader, setupHeaderMenu } from './header'
import { setupOnboarding } from './onboarding'
import { setupVideoPlayer } from './player'
import { getVideos, getVideosPage } from '../services/youtube'

const FILTER_STORAGE_KEY = 'emojiboxd.videoFilter'
const QUERY_INDEX_STORAGE_KEY = 'emojiboxd.videoQueryIndex'
const SUGGESTED_QUERIES = [
  'video essay',
  'film analysis',
  'story breakdown',
  'cinematography',
  'screenwriting',
  'documentary',
  'media criticism',
  'editing breakdown',
]

const EMOTION_EMOJI = {
  0: '•',
  1: '😠',
  2: '🤢',
  3: '😨',
  4: '😊',
  5: '😐',
  6: '😢',
  7: '😲',
}

const isShortVideo = (video) => {
  const seconds = Number(video.durationSeconds || 0)
  return seconds > 0 && seconds <= 90
}

const fillToCount = (list, extras, targetCount) => {
  const seen = new Set(list.map((video) => video.id))
  for (const video of extras) {
    if (!video?.id || seen.has(video.id)) {
      continue
    }

    list.push(video)
    seen.add(video.id)
    if (list.length >= targetCount) {
      break
    }
  }

  return list
}

const getSavedFilter = () => {
  try {
    return localStorage.getItem(FILTER_STORAGE_KEY)
  } catch {
    return null
  }
}

const saveFilter = (value) => {
  try {
    localStorage.setItem(FILTER_STORAGE_KEY, value)
  } catch {
    // Ignore storage errors (private mode, etc.)
  }
}

const getNextQuery = (baseQuery) => {
  const queries = [baseQuery, ...SUGGESTED_QUERIES].filter(Boolean)
  const uniqueQueries = Array.from(new Set(queries))
  if (!uniqueQueries.length) {
    return baseQuery
  }

  let index = 0
  try {
    index = Number(localStorage.getItem(QUERY_INDEX_STORAGE_KEY) || 0)
    localStorage.setItem(
      QUERY_INDEX_STORAGE_KEY,
      String((index + 1) % uniqueQueries.length)
    )
  } catch {
    // Ignore storage errors and fall back to index 0
  }

  return uniqueQueries[index % uniqueQueries.length]
}

const buildVideoCard = (video) => {
  const title = escapeHtml(video.title)
  const channel = escapeHtml(video.channelTitle)
  const duration = video.duration ? escapeHtml(video.duration) : ''
  const isShort = isShortVideo(video)
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
      data-video-is-short="${isShort ? 'true' : 'false'}"
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

const buildSearchListItem = (video) => {
  const title = escapeHtml(video.title)
  const channel = escapeHtml(video.channelTitle)
  const duration = video.duration ? escapeHtml(video.duration) : ''
  const isShort = isShortVideo(video)
  const media = video.thumbnail
    ? `<img class="h-full w-full object-cover" src="${escapeHtml(video.thumbnail)}" alt="${title}" />`
    : `<div class="h-full w-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950"></div>`

  return `
    <button
      class="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-left transition hover:border-white/30"
      type="button"
      data-video-card
      data-video-id="${video.id}"
      data-video-title="${title}"
      data-video-is-short="${isShort ? 'true' : 'false'}"
    >
      <div class="h-20 w-32 overflow-hidden rounded-xl border border-white/10 bg-slate-900/60">
        ${media}
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-semibold text-white">${title}</p>
        <p class="truncate text-xs text-slate-300">${channel}${duration ? ` • ${duration}` : ''}</p>
      </div>
    </button>
  `
}

const applyVideoFilter = (videos, filter) => {
  if (filter === 'shorts') {
    return videos.filter((video) => isShortVideo(video))
  }

  if (filter === 'long') {
    return videos.filter((video) => Number(video.durationSeconds || 0) > 90)
  }

  return videos
}

const renderVideoCards = (carousel, videos) => {
  carousel.innerHTML = videos.map(buildVideoCard).join('')
}

const buildReviewItem = (review) => {
  const title = escapeHtml(review.video_title || review.video_id || 'Untitled video')
  const date = review.created_at ? new Date(review.created_at).toLocaleDateString() : ''
  const videoId = String(review.video_id || '').trim()
  const thumbUrl = videoId
    ? `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`
    : ''
  const segments = Array.isArray(review.segment_emotions) ? review.segment_emotions : []
  const pills = (segments.length ? segments : [0, 0, 0, 0, 0])
    .map((code) => {
      const emoji = EMOTION_EMOJI[Number(code)] || '•'
      const tone = Number(code) === 0 ? 'text-slate-500' : 'text-slate-100'
      return `<span class="${tone}">${emoji}</span>`
    })
    .join('')

  return `
    <div class="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
      <div class="flex items-center gap-4">
        <div class="h-16 w-28 overflow-hidden rounded-xl border border-white/10 bg-slate-900/60">
          ${
            thumbUrl
              ? `<img class="h-full w-full object-cover" src="${thumbUrl}" alt="${title}" />`
              : `<div class="h-full w-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950"></div>`
          }
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold text-white">${title}</p>
          <p class="text-xs text-slate-400">${date}</p>
        </div>
        <div class="flex items-center gap-2 text-lg">${pills}</div>
      </div>
    </div>
  `
}

const renderReviewsList = (container, reviews) => {
  container.innerHTML = reviews.map(buildReviewItem).join('')
}

const renderSearchList = (list, videos) => {
  list.innerHTML = videos.map(buildSearchListItem).join('')
}

const loadSearchSuggestions = async (query) => {
  try {
    const videos = await getVideos({ query, maxResults: 4 })
    return videos
  } catch (error) {
    console.error('Failed to load search suggestions', error)
    return []
  }
}

const loadSearchPage = async ({ app, query, pageToken }) => {
  const status = app.querySelector('[data-video-status]')

  if (!status) {
    return { videos: [], nextPageToken: null }
  }

  try {
    if (!pageToken) {
      status.textContent = 'Searching...'
    }

    const { videos, nextPageToken } = await getVideosPage({
      query,
      maxResults: 5,
      pageToken,
    })

    if (!pageToken && !videos.length) {
      status.textContent = 'No videos found for that search.'
      return { videos: [], nextPageToken: null }
    }

    if (!pageToken) {
      status.textContent = ''
    }

    return { videos, nextPageToken }
  } catch (error) {
    console.error('Failed to search YouTube videos', error)
    if (!pageToken) {
      status.textContent = 'Could not load search results.'
    }
    return { videos: [], nextPageToken: null }
  }
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

  const query = getNextQuery(section.dataset.videoQuery || 'video essay')
  const shortQuery = `${query} shorts`
  const longQuery = query

  try {
    status.textContent = 'Loading suggestions...'
    const [longResults, shortResults] = await Promise.all([
      getVideos({ query: longQuery, maxResults: 25 }),
      getVideos({ query: shortQuery, maxResults: 25 }),
    ])

    let longVideos = longResults.filter((video) => !isShortVideo(video))
    let shortVideos = shortResults.filter((video) => isShortVideo(video))

    if (longVideos.length < 5) {
      const fallbackLong = await getVideos({
        query: 'long form video essay',
        maxResults: 25,
      })
      longVideos = fillToCount(
        longVideos,
        fallbackLong.filter((video) => !isShortVideo(video)),
        5
      )
    }

    if (shortVideos.length < 5) {
      const fallbackShorts = await getVideos({
        query: 'youtube shorts',
        maxResults: 25,
      })
      shortVideos = fillToCount(
        shortVideos,
        fallbackShorts.filter((video) => isShortVideo(video)),
        5
      )
    }

    longVideos = longVideos.slice(0, 5)
    shortVideos = shortVideos.slice(0, 5)

    const combined = [...shortVideos, ...longVideos]

    if (!combined.length) {
      status.textContent = 'No suggestions found.'
      carousel.innerHTML = ''
      return []
    }

    status.textContent = ''
    return combined
  } catch (error) {
    console.error('Failed to load YouTube videos', error)
    status.textContent = 'Could not load suggestions.'
    carousel.innerHTML = ''
    return []
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
  const filterSelect = app.querySelector('[data-video-filter]')
  const carousel = app.querySelector('[data-video-carousel]')
  const status = app.querySelector('[data-video-status]')
  const homeSection = app.querySelector('[data-section="home"]')
  const reviewsSection = app.querySelector('[data-section="reviews"]')
  const reviewsStatus = app.querySelector('[data-reviews-status]')
  const reviewsList = app.querySelector('[data-reviews-list]')
  const navItems = Array.from(app.querySelectorAll('[data-nav-item]'))
  const navLinks = Array.from(app.querySelectorAll('[data-nav]'))
  const suggestedCarousel = app.querySelector('[data-suggested-carousel]')
  const searchSection = app.querySelector('[data-search-results]')
  const searchList = app.querySelector('[data-video-list]')
  const searchLoading = app.querySelector('[data-search-loading]')
  const searchSentinel = app.querySelector('[data-search-sentinel]')
  const searchWrapper = app.querySelector('[data-header-search]')
  const searchForm = app.querySelector('[data-header-search-form]')
  const searchInput = app.querySelector('[data-header-search-input]')
  const searchDropdown = app.querySelector('[data-header-search-results]')
  let suggestedVideos = []
  let emptyStatusMessage = 'No suggestions found.'
  let onboardingCleanup = () => {}
  let searchTimer = null
  let searchSuggestions = []
  let searchResults = []
  let searchQuery = ''
  let searchNextToken = null
  let searchLoadingMore = false
  let searchActive = false
  let searchObserver = null
  let reviewsLoaded = false

  const renderSuggestedVideos = () => {
    if (!carousel || !status) {
      return
    }

    if (!suggestedVideos.length) {
      status.textContent = emptyStatusMessage
      carousel.innerHTML = ''
      return
    }

    const filter = filterSelect?.value || 'all'
    const filtered = applyVideoFilter(suggestedVideos, filter)

    if (!filtered.length) {
      status.textContent = 'No videos match this filter.'
      carousel.innerHTML = ''
      return
    }

    status.textContent = ''
    renderVideoCards(carousel, filtered)
  }

  const setSuggestedVideos = (videos, emptyMessage) => {
    suggestedVideos = videos
    emptyStatusMessage = emptyMessage
    renderSuggestedVideos()
  }

  const showSearchList = () => {
    searchActive = true
    searchSection?.classList.remove('hidden')
    suggestedCarousel?.classList.add('hidden')
  }

  const hideSearchList = () => {
    searchActive = false
    searchSection?.classList.add('hidden')
    suggestedCarousel?.classList.remove('hidden')
  }

  const setSearchLoading = (isLoading) => {
    if (!searchLoading) {
      return
    }

    searchLoading.classList.toggle('hidden', !isLoading)
  }

  const renderSearchResultsList = () => {
    if (!searchList || !status) {
      return
    }

    if (!searchResults.length) {
      status.textContent = 'No videos found for that search.'
      searchList.innerHTML = ''
      return
    }

    const filter = filterSelect?.value || 'all'
    const filtered = applyVideoFilter(searchResults, filter)

    if (!filtered.length) {
      status.textContent = 'No videos match this filter.'
      searchList.innerHTML = ''
      return
    }

    status.textContent = ''
    renderSearchList(searchList, filtered)
  }

  const resetSearchState = () => {
    searchResults = []
    searchQuery = ''
    searchNextToken = null
    searchLoadingMore = false
    setSearchLoading(false)
    if (searchList) {
      searchList.innerHTML = ''
    }
  }

  const loadMoreSearchResults = async () => {
    if (!searchQuery || !searchNextToken || searchLoadingMore) {
      return
    }

    searchLoadingMore = true
    setSearchLoading(true)
    const { videos, nextPageToken } = await loadSearchPage({
      app,
      query: searchQuery,
      pageToken: searchNextToken,
    })
    searchNextToken = nextPageToken
    if (videos.length) {
      searchResults = [...searchResults, ...videos]
      renderSearchResultsList()
    }
    searchLoadingMore = false
    setSearchLoading(false)
  }

  const startSearch = async (query) => {
    if (!query) {
      return
    }

    showSearchList()
    resetSearchState()
    searchQuery = query
    setSearchLoading(true)

    const { videos, nextPageToken } = await loadSearchPage({ app, query })
    searchResults = videos
    searchNextToken = nextPageToken
    setSearchLoading(false)
    renderSearchResultsList()
  }

  const hideSearchDropdown = () => {
    if (!searchDropdown) {
      return
    }

    searchDropdown.classList.add('hidden')
    searchDropdown.innerHTML = ''
  }

  const renderSearchDropdown = (videos) => {
    if (!searchDropdown) {
      return
    }

    if (!videos.length) {
      hideSearchDropdown()
      return
    }

    searchDropdown.innerHTML = `
      <div class="max-h-72 overflow-y-auto">
        ${videos
          .map((video, index) => {
            const title = escapeHtml(video.title)
            const channel = escapeHtml(video.channelTitle)
            const duration = video.duration ? escapeHtml(video.duration) : ''
            const thumb = video.thumbnail
              ? `<img class="h-10 w-16 rounded-lg border border-white/10 object-cover" src="${escapeHtml(video.thumbnail)}" alt="${title}" />`
              : `<div class="h-10 w-16 rounded-lg border border-white/10 bg-slate-900"></div>`

            return `
              <button
                class="flex w-full items-center gap-3 px-3 py-2 text-left text-slate-200 transition hover:bg-white/5"
                type="button"
                data-search-result
                data-search-index="${index}"
              >
                ${thumb}
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold text-white">${title}</p>
                  <p class="truncate text-xs text-slate-400">${channel}${duration ? ` • ${duration}` : ''}</p>
                </div>
              </button>
            `
          })
          .join('')}
      </div>
    `

    searchDropdown.classList.remove('hidden')
  }

  const handleFilterChange = () => {
    if (filterSelect) {
      saveFilter(filterSelect.value)
    }
    if (searchActive) {
      renderSearchResultsList()
    } else {
      renderSuggestedVideos()
    }
  }

  const handleSearchSubmit = async (event) => {
    event.preventDefault()
    const query = searchInput?.value.trim()

    if (!query) {
      hideSearchDropdown()
      resetSearchState()
      hideSearchList()
      renderSuggestedVideos()
      return
    }

    hideSearchDropdown()
    await startSearch(query)
  }

  const handleSearchInput = () => {
    if (!searchInput) {
      return
    }

    const query = searchInput.value.trim()
    if (!query) {
      hideSearchDropdown()
      return
    }

    if (searchTimer) {
      clearTimeout(searchTimer)
    }

    searchTimer = setTimeout(async () => {
      const videos = await loadSearchSuggestions(query)
      searchSuggestions = videos
      renderSearchDropdown(videos)
    }, 250)
  }

  const handleSearchResultClick = (event) => {
    const result = event.target.closest('[data-search-result]')
    if (!result) {
      return
    }

    const index = Number(result.dataset.searchIndex)
    const selected = searchSuggestions[index]
    if (!selected) {
      return
    }

    if (searchInput) {
      searchInput.value = selected.title || ''
    }

    hideSearchDropdown()
    const query = searchInput?.value.trim()
    if (query) {
      startSearch(query)
    }
  }

  const handleDocumentClick = (event) => {
    if (!searchWrapper || searchWrapper.contains(event.target)) {
      return
    }

    hideSearchDropdown()
  }

  const setActiveNav = (target) => {
    navItems.forEach((item) => {
      item.classList.toggle('bg-white/5', item.dataset.nav === target)
    })
  }

  const showSection = (target) => {
    homeSection?.classList.toggle('hidden', target !== 'home')
    reviewsSection?.classList.toggle('hidden', target !== 'reviews')
    setActiveNav(target)
  }

  const loadReviews = async () => {
    if (!reviewsList || !reviewsStatus || !user?.id) {
      return
    }

    reviewsStatus.textContent = 'Loading reviews...'
    const { data, error } = await supabase
      .from('video_emotion_segments')
      .select('video_id, video_title, segment_emotions, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to load reviews', error)
      reviewsStatus.textContent = 'Could not load reviews.'
      reviewsList.innerHTML = ''
      return
    }

    if (!data?.length) {
      reviewsStatus.textContent = 'No reviews yet.'
      reviewsList.innerHTML = ''
      return
    }

    reviewsStatus.textContent = ''
    renderReviewsList(reviewsList, data)
  }

  const handleNavClick = (event) => {
    const target = event.target.closest('[data-nav]')
    if (!target) {
      return
    }

    const view = target.dataset.nav
    if (!['home', 'reviews'].includes(view)) {
      return
    }

    event.preventDefault()
    showSection(view)

    if (view === 'reviews' && !reviewsLoaded) {
      reviewsLoaded = true
      loadReviews()
    }
  }

  setupOnboarding({ app, supabase, user }).then((cleanup) => {
    onboardingCleanup = cleanup || (() => {})
  })

  loadProfileForHeader({ app, supabase, user }).catch((error) => {
    console.error('Unable to load profile for header', error)
  })

  const savedFilter = getSavedFilter()
  if (filterSelect && savedFilter && ['all', 'long', 'shorts'].includes(savedFilter)) {
    filterSelect.value = savedFilter
  }

  showSection('home')

  loadSuggestedVideos({ app }).then((videos) => {
    setSuggestedVideos(videos, 'No suggestions found.')
  })

  filterSelect?.addEventListener('change', handleFilterChange)
  searchForm?.addEventListener('submit', handleSearchSubmit)
  searchInput?.addEventListener('input', handleSearchInput)
  searchInput?.addEventListener('focus', handleSearchInput)
  searchDropdown?.addEventListener('click', handleSearchResultClick)
  document.addEventListener('click', handleDocumentClick)
  navLinks.forEach((link) => link.addEventListener('click', handleNavClick))

  if (searchSentinel) {
    searchObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMoreSearchResults()
        }
      },
      { rootMargin: '200px' }
    )
    searchObserver.observe(searchSentinel)
  }

  return () => {
    headerCleanup?.()
    carouselCleanup?.()
    playerCleanup?.()
    onboardingCleanup?.()
    filterSelect?.removeEventListener('change', handleFilterChange)
    searchForm?.removeEventListener('submit', handleSearchSubmit)
    searchInput?.removeEventListener('input', handleSearchInput)
    searchInput?.removeEventListener('focus', handleSearchInput)
    searchDropdown?.removeEventListener('click', handleSearchResultClick)
    document.removeEventListener('click', handleDocumentClick)
    navLinks.forEach((link) => link.removeEventListener('click', handleNavClick))
    searchObserver?.disconnect()
    if (searchTimer) {
      clearTimeout(searchTimer)
    }
  }
}
