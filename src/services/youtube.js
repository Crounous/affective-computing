const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search'
const DETAILS_URL = 'https://www.googleapis.com/youtube/v3/videos'

const formatDuration = (isoDuration) => {
  if (!isoDuration) {
    return ''
  }

  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) {
    return ''
  }

  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)
  const seconds = Number(match[3] || 0)

  const totalMinutes = hours * 60 + minutes
  const paddedSeconds = String(seconds).padStart(2, '0')

  if (hours > 0) {
    const paddedMinutes = String(minutes).padStart(2, '0')
    return `${hours}:${paddedMinutes}:${paddedSeconds}`
  }

  return `${totalMinutes}:${paddedSeconds}`
}

const parseDurationSeconds = (isoDuration) => {
  if (!isoDuration) {
    return 0
  }

  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) {
    return 0
  }

  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)
  const seconds = Number(match[3] || 0)

  return hours * 3600 + minutes * 60 + seconds
}

const fetchVideosPage = async ({ query, maxResults = 10, pageToken }) => {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY

  if (!apiKey) {
    throw new Error('Missing YouTube API key.')
  }

  const url = new URL(SEARCH_URL)
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('maxResults', String(maxResults))
  url.searchParams.set('q', query)
  url.searchParams.set('type', 'video')
  url.searchParams.set('key', apiKey)
  if (pageToken) {
    url.searchParams.set('pageToken', pageToken)
  }

  const res = await fetch(url.toString())

  if (!res.ok) {
    throw new Error('YouTube request failed.')
  }

  const data = await res.json()

  const videos = (data.items || [])
    .map((item) => ({
      id: item.id?.videoId,
      title: item.snippet?.title || 'Untitled video',
      channelTitle: item.snippet?.channelTitle || 'Unknown channel',
      thumbnail:
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url ||
        '',
    }))
    .filter((video) => Boolean(video.id))

  const ids = videos.map((video) => video.id).join(',')
  if (!ids) {
    return { videos, nextPageToken: data.nextPageToken || null }
  }

  try {
    const detailsUrl = new URL(DETAILS_URL)
    detailsUrl.searchParams.set('part', 'contentDetails')
    detailsUrl.searchParams.set('id', ids)
    detailsUrl.searchParams.set('key', apiKey)

    const detailsRes = await fetch(detailsUrl.toString())
    if (!detailsRes.ok) {
      return { videos, nextPageToken: data.nextPageToken || null }
    }

    const detailsData = await detailsRes.json()
    const durationMap = new Map(
      (detailsData.items || []).map((item) => {
        const isoDuration = item.contentDetails?.duration
        return [
          item.id,
          {
            duration: formatDuration(isoDuration),
            durationSeconds: parseDurationSeconds(isoDuration),
          },
        ]
      })
    )

    const enriched = videos.map((video) => {
      const details = durationMap.get(video.id)
      return {
        ...video,
        duration: details?.duration || '',
        durationSeconds: details?.durationSeconds || 0,
      }
    })

    return { videos: enriched, nextPageToken: data.nextPageToken || null }
  } catch {
    return { videos, nextPageToken: data.nextPageToken || null }
  }
}

export const getVideos = async ({ query, maxResults = 10 }) => {
  const { videos } = await fetchVideosPage({ query, maxResults })
  return videos
}

export const getVideosPage = fetchVideosPage
