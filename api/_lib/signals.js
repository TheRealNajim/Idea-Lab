// Signal scan: mines real-world problems from public sources around a topic.
// Free, keyless sources (Reddit public JSON, Hacker News/Algolia,
// Stack Overflow, Medium RSS) always work from the server; paid or
// key-gated sources (YouTube, X/Twitter) activate when their env keys exist.
// Facebook and Instagram are intentionally absent: Meta's Graph API does not
// offer public content search without a reviewed partner app, so listing them
// would only ever render an error.

const TIMEOUT_MS = 8000
const USER_AGENT = 'idea-lab-signal-scan/2.0 (+https://github.com/)'

export class SourceNotConfigured extends Error {}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response
  } finally {
    clearTimeout(timer)
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetchWithTimeout(url, options)
  return response.json()
}

async function fetchText(url, options = {}) {
  const response = await fetchWithTimeout(url, options)
  return response.text()
}

function stripHtml(value, max = 300) {
  const text = String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

function decodeXml(value) {
  return String(value || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .trim()
}

// ---------------------------------------------------------------- Reddit ----

async function searchReddit(topic, limit) {
  // Strip quote characters so user-typed topics cannot break the search syntax.
  const cleanTopic = topic.replace(/["']/g, '').trim() || topic
  const query = `"${cleanTopic}" (problem OR struggle OR frustrating OR "wish there was")`
  const headers = { 'User-Agent': USER_AGENT, Accept: 'application/json' }

  // Prefer OAuth when credentials exist; the public .json endpoint works from
  // a server at low volume but is aggressively rate limited.
  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET
  let base = 'https://www.reddit.com/search.json'

  if (clientId && clientSecret) {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const tokenResponse = await fetchWithTimeout('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT,
      },
      body: 'grant_type=client_credentials',
    })
    if (tokenResponse.ok) {
      const token = (await tokenResponse.json()).access_token
      if (token) {
        headers.Authorization = `Bearer ${token}`
        base = 'https://oauth.reddit.com/search'
      }
    }
  }

  const url = `${base}?q=${encodeURIComponent(query)}&sort=top&t=year&limit=${limit}&type=link&raw_json=1`
  try {
    const data = await fetchJson(url, { headers })
    const posts = data?.data?.children || []

    return posts
      .map(({ data: post }) => ({
        id: `reddit-${post.id}`,
        source: 'Reddit',
        title: String(post.title || ''),
        url: `https://www.reddit.com${post.permalink || ''}`,
        snippet: stripHtml(post.selftext || ''),
        engagement: (post.score || 0) + (post.num_comments || 0) * 2,
        postedAt: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : null,
      }))
      .filter((signal) => signal.title && !signal.title.startsWith('[removed]') && !signal.title.startsWith('[deleted]'))
  } catch (error) {
    // Reddit increasingly 403s anonymous JSON access, especially from
    // datacenter IPs (Vercel). Surface an actionable hint rather than a bare
    // status code.
    if (error?.message?.includes('403')) {
      throw new Error('Reddit blocked the anonymous request (set REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET for reliable access)')
    }
    throw error
  }
}

// ---------------------------------------------------------- Hacker News ----

async function searchHackerNews(topic, limit) {
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(topic)}&tags=story&hitsPerPage=${limit}`
  const data = await fetchJson(url)

  return (data.hits || [])
    .map((hit) => ({
      id: `hn-${hit.objectID}`,
      source: 'Hacker News',
      title: String(hit.title || hit.story_title || ''),
      // The pain points live in the comment threads, so link the HN item
      // rather than the outbound article.
      url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
      snippet: stripHtml(hit.story_text || ''),
      engagement: (hit.points || 0) + (hit.num_comments || 0) * 2,
      postedAt: hit.created_at ? new Date(hit.created_at).toISOString() : null,
    }))
    .filter((signal) => signal.title)
}

// -------------------------------------------------------- Stack Overflow ----

async function searchStackOverflow(topic, limit) {
  const params = new URLSearchParams({
    order: 'desc',
    sort: 'relevance',
    q: topic,
    site: 'stackoverflow',
    pagesize: String(limit),
    filter: 'withbody',
  })
  if (process.env.STACKEXCHANGE_KEY) params.set('key', process.env.STACKEXCHANGE_KEY)

  const data = await fetchJson(`https://api.stackexchange.com/2.3/search/advanced?${params}`)
  return (data.items || [])
    .map((item) => ({
      id: `so-${item.question_id}`,
      source: 'Stack Overflow',
      title: stripHtml(item.title, 200),
      url: item.link,
      snippet: stripHtml(item.body),
      engagement: (item.score || 0) * 3 + (item.is_answered ? 0 : 10),
      postedAt: item.creation_timestamp ? new Date(item.creation_timestamp * 1000).toISOString() : null,
    }))
    .filter((signal) => signal.title && signal.url)
}

// ----------------------------------------------------------------- Medium ----

// Medium has no official search API. Tag RSS feeds are the stable public
// surface, so "search" becomes "latest writing on the topic's tag" — still a
// useful signal of what the community struggles with.
async function searchMedium(topic, limit) {
  const tag = topic
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9]/g, ''))
    .filter(Boolean)
    .slice(0, 2)
    .join('-')
  if (!tag) return []

  const xml = await fetchText(`https://medium.com/feed/tag/${tag}`)
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, limit)

  return items
    .map((match, index) => {
      const item = match[1]
      const title = decodeXml((item.match(/<title>([\s\S]*?)<\/title>/) || [])[1])
      const link = decodeXml((item.match(/<link>([\s\S]*?)<\/link>/) || [])[1])
      const description = stripHtml(decodeXml((item.match(/<description>([\s\S]*?)<\/description>/) || [])[1]))
      const pubDate = (item.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1]
      return {
        id: `medium-${tag}-${index}`,
        source: 'Medium',
        title,
        url: link,
        snippet: description,
        engagement: 0,
        postedAt: pubDate ? new Date(pubDate).toISOString() : null,
      }
    })
    .filter((signal) => signal.title && signal.url)
}

// --------------------------------------------------------------- YouTube ----

async function searchYouTube(topic, limit) {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) throw new SourceNotConfigured('YouTube requires YOUTUBE_API_KEY on the server')

  const params = new URLSearchParams({
    part: 'snippet',
    q: `${topic} problems frustrating`,
    type: 'video',
    maxResults: String(limit),
    key,
  })
  const data = await fetchJson(`https://www.googleapis.com/youtube/v3/search?${params}`)

  return (data.items || [])
    .map((item) => ({
      id: `youtube-${item.id?.videoId}`,
      source: 'YouTube',
      title: String(item.snippet?.title || ''),
      url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
      snippet: stripHtml(item.snippet?.description),
      engagement: 0,
      postedAt: item.snippet?.publishedAt || null,
    }))
    .filter((signal) => signal.id !== 'youtube-undefined' && signal.title)
}

// ------------------------------------------------------------ X / Twitter ----

async function searchTwitter(topic, limit) {
  const token = process.env.TWITTER_BEARER_TOKEN
  if (!token) throw new SourceNotConfigured('X/Twitter requires TWITTER_BEARER_TOKEN on the server')

  const cleanTopic = topic.replace(/["']/g, '').trim() || topic
  const params = new URLSearchParams({
    query: `"${cleanTopic}" (problem OR struggle OR "wish there was") -is:retweet lang:en`,
    max_results: '25',
    'tweet.fields': 'public_metrics,created_at',
  })
  const data = await fetchJson(`https://api.twitter.com/2/tweets/search/recent?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  return (data.data || [])
    .map((tweet) => ({
      id: `x-${tweet.id}`,
      source: 'X',
      title: stripHtml(tweet.text, 140),
      url: `https://x.com/i/web/status/${tweet.id}`,
      snippet: stripHtml(tweet.text),
      engagement: (tweet.public_metrics?.like_count || 0) + (tweet.public_metrics?.reply_count || 0) * 3,
      postedAt: tweet.created_at || null,
    }))
    .filter((signal) => signal.title)
}

// ------------------------------------------------------------- aggregator ----

export const SIGNAL_SOURCES = {
  reddit: { label: 'Reddit', fetch: searchReddit },
  hackernews: { label: 'Hacker News', fetch: searchHackerNews },
  stackoverflow: { label: 'Stack Overflow', fetch: searchStackOverflow },
  medium: { label: 'Medium', fetch: searchMedium },
  youtube: { label: 'YouTube', fetch: searchYouTube },
  twitter: { label: 'X / Twitter', fetch: searchTwitter },
}

export const DEFAULT_SOURCES = ['reddit', 'hackernews', 'stackoverflow', 'medium']

// Runs every requested source in parallel and never lets one failure sink the
// scan: each source reports its own status alongside whatever it managed to
// collect.
export async function scanSources(topic, requested) {
  const keys = (requested && requested.length ? requested : DEFAULT_SOURCES)
    .filter((key) => SIGNAL_SOURCES[key])

  const settled = await Promise.allSettled(keys.map((key) => SIGNAL_SOURCES[key].fetch(topic, 8)))

  return keys.map((key, index) => {
    const definition = SIGNAL_SOURCES[key]
    const result = settled[index]
    if (result.status === 'fulfilled') {
      return { source: key, label: definition.label, status: 'ok', items: result.value }
    }
    const reason = result.reason
    if (reason instanceof SourceNotConfigured) {
      return { source: key, label: definition.label, status: 'not_configured', message: reason.message, items: [] }
    }
    return {
      source: key,
      label: definition.label,
      status: 'error',
      message: reason?.name === 'AbortError' ? 'timed out' : (reason?.message || 'unavailable'),
      items: [],
    }
  })
}
