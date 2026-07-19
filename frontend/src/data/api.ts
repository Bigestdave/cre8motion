const configuredApiUrl = import.meta.env.VITE_API_BASE_URL?.trim()

/** API base URL is configurable per environment; the local FastAPI server is the safe fallback. */
export const API_BASE_URL = (configuredApiUrl || 'http://localhost:8000/api').replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

export interface ShowEpisodeSummary {
  id: string
  episode_number: number
  title: string
  status: string
}

export interface Show {
  id: string
  title: string
  premise?: string | null
  status: string
  default_duration_seconds: number
  default_aspect_ratio: string
  default_style_profile_id?: string | null
  current_continuity_version: number
  episode_count?: number
  latest_episode?: ShowEpisodeSummary | null
}

export interface EpisodeDraft {
  title: string
  idea?: string
  script?: string
}

export interface Episode {
  id: string
  show_id: string
  title: string
  status: string
  target_duration_seconds: number
  aspect_ratio: string
  base_continuity_version: number
}

export interface ProductionRun {
  id: string
  episode_id: string
  version: number
  status: string
  current_stage: string
  budget_limit: number
  budget_used: number
  retry_reserve: number
  failure_reason?: string | null
}

export interface ProductionStartResponse {
  message: string
  production_id: string
}

export interface ProductionShot {
  id: string
  production_run_id: string
  sequence_number: number
  story_function: string
  duration_seconds: number
  status: string
  characters: Array<string | { id?: string; name?: string }>
  location_id?: string | null
  camera: { framing?: string; movement?: string; angle?: string }
  environment: { props?: string[] }
  keyframe_prompt?: string | null
  motion_prompt?: string | null
  approved_storyboard_artifact_id?: string | null
  approved_keyframe_artifact_id?: string | null
  approved_video_artifact_id?: string | null
}

function errorDetail(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const detail = (payload as { detail?: unknown }).detail
    return typeof detail === 'string' ? detail : JSON.stringify(detail)
  }
  return fallback
}

export async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
      ...options?.headers,
    },
  })

  if (!response.ok) {
    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      // A proxy or server may return an empty non-JSON failure response.
    }
    throw new ApiError(response.status, errorDetail(payload, `Request failed (${response.status})`))
  }

  return response.json() as Promise<T>
}

export function getArtifactDownloadUrl(artifactId?: string | null) {
  return artifactId ? `${API_BASE_URL}/artifacts/${encodeURIComponent(artifactId)}/download` : undefined
}

// Shows
export const getShows = () => fetchJson<Show[]>('/shows/')
export const getShow = (showId: string) => fetchJson<Show>(`/shows/${encodeURIComponent(showId)}`)

export async function generateShowProposal(params: {
  genre: string
  animation_style: string
  tone: string
  target_audience: string
  default_duration_seconds: number
  idea_seed: string
}) {
  const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]))
  return fetchJson(`/shows/proposal?${query}`, { method: 'POST' })
}

export function createShow(data: {
  title: string
  premise?: string
  visual_style?: { animation_style?: string; creative_direction?: { colors?: string } | string; negative_prompt?: string }
}) {
  const creativeDirection = data.visual_style?.creative_direction
  return fetchJson<Show>('/shows/', {
    method: 'POST',
    body: JSON.stringify({
      title: data.title,
      premise: data.premise,
      animation_style: data.visual_style?.animation_style || '3D',
      creative_direction: typeof creativeDirection === 'string' ? creativeDirection : creativeDirection?.colors || '',
      negative_constraints: data.visual_style?.negative_prompt || '',
    }),
  })
}

// Characters
export function createCharacter(showId: string, data: { name: string; canonical_description?: string }) {
  return fetchJson<{ id: string; name: string; canonical_description?: string }>(`/shows/${encodeURIComponent(showId)}/characters`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Episodes
export async function generateEpisodeDraft(showId: string, ideaSeed: string) {
  const query = new URLSearchParams({ idea_seed: ideaSeed })
  return fetchJson<EpisodeDraft>(`/shows/${encodeURIComponent(showId)}/episodes/draft?${query}`, { method: 'POST' })
}

export function createEpisode(showId: string, data: EpisodeDraft & { duration_seconds?: number }) {
  return fetchJson<Episode>('/episodes/', {
    method: 'POST',
    body: JSON.stringify({
      show_id: showId,
      title: data.title || 'Untitled',
      idea: data.idea,
      script: data.script,
      duration_seconds: data.duration_seconds || 45,
    }),
  })
}

// Productions
export const startProduction = (episodeId: string) =>
  fetchJson<ProductionStartResponse>(`/productions/${encodeURIComponent(episodeId)}`, { method: 'POST' })
export const getProduction = (productionId: string) =>
  fetchJson<ProductionRun>(`/productions/${encodeURIComponent(productionId)}`)
export const getProductionShots = (productionId: string) =>
  fetchJson<ProductionShot[]>(`/productions/${encodeURIComponent(productionId)}/shots`)
export const getShotAttempts = (shotId: string) =>
  fetchJson(`/shots/${encodeURIComponent(shotId)}/attempts`)
export const retryShot = (shotId: string) =>
  fetchJson(`/shots/${encodeURIComponent(shotId)}/retry`, { method: 'POST' })
export const approveAttempt = (shotId: string, attemptId: string) =>
  fetchJson(`/shots/${encodeURIComponent(shotId)}/approve-attempt?attempt_id=${encodeURIComponent(attemptId)}`, { method: 'POST' })
