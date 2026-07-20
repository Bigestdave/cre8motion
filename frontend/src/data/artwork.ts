// Show artwork: prefers backend-generated posters, falls back to bundled key art.
import { useEffect, useState } from 'react'
import { API_BASE_URL } from './api'
import posterFruitfulSecrets from '../assets/poster-fruitful-secrets.png'
import posterLuckyWallet from '../assets/poster-lucky-wallet.png'
import bannerFruitfulSecrets from '../assets/banner-fruitful-secrets.png'

const POSTERS: Record<string, string> = {
  'fruitful secrets': posterFruitfulSecrets,
  'the lucky wallet': posterLuckyWallet,
}

const BANNERS: Record<string, string> = {
  'fruitful secrets': bannerFruitfulSecrets,
  'the lucky wallet': posterLuckyWallet,
}

// Cache of showId -> generated poster URL. Only positive results are cached —
// a missing poster is re-checked on next mount (it may still be generating).
const generatedPosters = new Map<string, string>()

/** Resolve a show's poster: backend-generated first (async), bundled art as fallback. */
export async function resolvePoster(showId: string, title?: string | null): Promise<string | undefined> {
  const cached = generatedPosters.get(showId)
  if (cached) return cached
  try {
    const response = await fetch(`${API_BASE_URL}/shows/${encodeURIComponent(showId)}/poster`)
    if (response.ok) {
      const data = (await response.json()) as { download_url: string }
      const url = `${API_BASE_URL.replace(/\/api$/, '')}${data.download_url}`
      generatedPosters.set(showId, url)
      return url
    }
  } catch {
    /* backend unreachable — fall through to bundled art */
  }
  return showPoster(title)
}

export function showPoster(title?: string | null): string | undefined {
  return title ? POSTERS[title.trim().toLowerCase()] : undefined
}

export function showBanner(title?: string | null): string | undefined {
  return title ? BANNERS[title.trim().toLowerCase()] : undefined
}

/** React hook: poster for a show — backend-generated first, bundled art immediately as placeholder. */
export function usePoster(showId?: string | null, title?: string | null): string | undefined {
  const [url, setUrl] = useState<string | undefined>(() => showPoster(title))
  useEffect(() => {
    setUrl(showPoster(title))
    if (!showId) return
    let cancelled = false
    resolvePoster(showId, title).then((resolved) => {
      if (!cancelled && resolved) setUrl(resolved)
    })
    return () => {
      cancelled = true
    }
  }, [showId, title])
  return url
}
