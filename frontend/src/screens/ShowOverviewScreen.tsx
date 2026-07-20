import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { WorkspaceShell } from '../components/WorkspaceShell'
import { Thumb } from '../components/ShotStrip'
import { CheckCircleSolid } from '../components/icons'
import { PeopleIcon, LoopIcon, GridIcon } from '../components/icons2'
import {
  getShow,
  listCharacters,
  listCharacterReferences,
  getArtifactDownloadUrl,
  type Show,
  type CharacterSummary,
} from '../data/api'
import { pushRecentShow } from '../data/recents'
import { showPoster } from '../data/artwork'
import { SkeletonShowHeader, SkeletonEpisodeRow } from '../components/Skeleton'

const tabs = ['Episodes', 'Characters'] as const

const EPISODE_THUMBS = ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08']

function episodeStatusLabel(status: string): string {
  const s = (status || '').toLowerCase()
  if (s === 'draft') return 'Draft'
  if (s === 'in_production' || s === 'planning') return 'In production'
  if (s === 'needs_review') return 'Needs review'
  if (s === 'approved' || s === 'complete' || s === 'published') return 'Complete'
  return status || 'Draft'
}

export function ShowOverviewScreen() {
  const { id } = useParams()
  const [tab, setTab] = useState<(typeof tabs)[number]>('Episodes')
  const [show, setShow] = useState<Show | null>(null)
  const [characters, setCharacters] = useState<CharacterSummary[]>([])
  const [refImages, setRefImages] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    Promise.all([getShow(id), listCharacters(id).catch(() => [])])
      .then(async ([showData, charData]) => {
        if (cancelled) return
        setShow(showData)
        setCharacters(charData)
        setLoading(false)
        pushRecentShow({ id: showData.id, title: showData.title })
        // Load first canonical reference image per character (best-effort)
        const images: Record<string, string> = {}
        await Promise.all(
          charData.map(async (c) => {
            try {
              const refs = await listCharacterReferences(c.id)
              const url = getArtifactDownloadUrl(refs[0]?.artifact_id)
              if (url) images[c.id] = url
            } catch {
              /* no references yet */
            }
          }),
        )
        if (!cancelled) setRefImages(images)
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) {
          setError('This show could not be loaded. It may have been removed.')
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <WorkspaceShell breadcrumb="Shows" backTo="/shows">
        <div className="mx-auto max-w-[1280px] px-8 pb-12">
          <SkeletonShowHeader />
          <div className="mt-8 h-[46px] border-b border-line-soft" />
          <div className="mt-7 flex flex-col gap-4">
            <SkeletonEpisodeRow />
            <SkeletonEpisodeRow />
            <SkeletonEpisodeRow />
          </div>
        </div>
      </WorkspaceShell>
    )
  }

  if (error || !show) {
    return (
      <WorkspaceShell breadcrumb="Shows" backTo="/shows">
        <div className="flex h-[300px] flex-col items-center justify-center gap-4">
          <p className="text-[15px] text-ink-2">{error || 'Show not found.'}</p>
          <Link
            to="/shows"
            className="rounded-lg bg-ink px-5 py-2.5 text-[14px] font-medium text-app transition-colors hover:bg-ink-2"
          >
            Back to shows
          </Link>
        </div>
      </WorkspaceShell>
    )
  }

  const episodes = show.episodes ?? []
  const approvedCount = episodes.filter((e) =>
    ['approved', 'complete', 'published'].includes((e.status || '').toLowerCase()),
  ).length

  return (
    <WorkspaceShell breadcrumb="Shows" backTo="/shows">
      <div className="mx-auto max-w-[1280px] px-8 pb-12">
        {/* Header */}
        <div className="flex items-start gap-6">
          {showPoster(show.title) ? (
            <img src={showPoster(show.title)} alt={show.title} className="h-[150px] w-[210px] shrink-0 rounded-xl object-cover" />
          ) : (
            <Thumb shotId="S02" className="h-[150px] w-[210px] shrink-0 rounded-xl" />
          )}
          <div className="flex-1 pt-2">
            <h1 className="text-[30px] font-semibold tracking-tight">{show.title}</h1>
            <p className="pt-1.5 text-[15px] text-ink-2">{show.premise || 'No premise yet.'}</p>
            <p className="pt-3 text-[14px] text-ink-2">
              {episodes.length} episode{episodes.length === 1 ? '' : 's'}
              <span className="px-1.5 text-ink-3">·</span> {show.default_duration_seconds}-second default
              <span className="px-1.5 text-ink-3">·</span> {show.default_aspect_ratio}
            </p>
          </div>
          <div className="flex items-center gap-3 pt-3">
            <Link
              to={`/new-episode?showId=${id}`}
              className="rounded-lg bg-ink px-5 py-2.5 text-[14px] font-medium text-app transition-colors hover:bg-ink-2"
            >
              Create episode
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-1 border-b border-line-soft">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-4 py-3 text-[15px] transition-colors ${
                tab === t ? 'font-semibold text-ink' : 'text-ink-3 hover:text-ink-2'
              }`}
            >
              {t}
              {t === 'Characters' && characters.length > 0 && (
                <span className="ml-2 rounded-md bg-raised px-1.5 py-0.5 text-[12px] text-ink-2">
                  {characters.length}
                </span>
              )}
              {tab === t && <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-t bg-accent" />}
            </button>
          ))}
        </div>

        {tab === 'Episodes' && (
          <>
            {episodes.length === 0 ? (
              <div className="mt-7 flex flex-col items-center justify-center gap-4 rounded-xl border border-line-soft bg-surface py-14">
                <p className="text-[15px] text-ink-2">No episodes yet. Create the first one to start production.</p>
                <Link
                  to={`/new-episode?showId=${id}`}
                  className="rounded-lg bg-ink px-5 py-2.5 text-[14px] font-medium text-app transition-colors hover:bg-ink-2"
                >
                  Create Episode
                </Link>
              </div>
            ) : (
              <div className="mt-7 flex flex-col gap-4">
                {episodes.map((ep, i) => (
                  <div
                    key={ep.id}
                    className="flex items-center gap-5 overflow-hidden rounded-xl border border-line-soft bg-surface"
                  >
                    <Thumb
                      shotId={EPISODE_THUMBS[i % EPISODE_THUMBS.length]}
                      className="h-[110px] w-[190px] shrink-0 rounded-none"
                    />
                    <div className="flex-1 py-4">
                      <p className="text-[16px] font-semibold">
                        Episode {String(ep.episode_number).padStart(2, '0')}
                        <span className="px-1.5 text-ink-3">·</span>
                        {ep.title}
                      </p>
                      <p className="pt-1.5 text-[14px] text-ink-2">{episodeStatusLabel(ep.status)}</p>
                    </div>
                    <Link
                      to={`/new-episode?showId=${id}&episodeId=${ep.id}`}
                      className="mr-6 shrink-0 rounded-lg bg-ink px-5 py-2.5 text-[14px] font-medium text-app transition-colors hover:bg-ink-2"
                    >
                      {episodeStatusLabel(ep.status) === 'Draft' ? 'Start production' : 'Open'}
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {/* Health summary row */}
            <div className="mt-8 flex items-center justify-center gap-8 rounded-xl border border-line-soft bg-surface px-6 py-3.5 text-[14px]">
              <span className="flex items-center gap-2.5 text-ink-2">
                <PeopleIcon size={16} /> Characters
                <span className="rounded-md bg-raised px-2 py-0.5 text-[13px] text-ink">{characters.length}</span>
              </span>
              <span className="h-4 w-px bg-line" />
              <span className="flex items-center gap-2.5 text-ink-2">
                <CheckCircleSolid size={15} /> Approved episodes
                <span className="rounded-md bg-raised px-2 py-0.5 text-[13px] text-ink">{approvedCount}</span>
              </span>
              <span className="h-4 w-px bg-line" />
              <span className="flex items-center gap-2.5 text-ink-2">
                <LoopIcon size={16} /> Continuity
                <span className="rounded-md bg-raised px-2 py-0.5 text-[13px] text-ink">
                  v{show.current_continuity_version}
                </span>
              </span>
            </div>
          </>
        )}

        {tab === 'Characters' &&
          (characters.length === 0 ? (
            <div className="flex h-[300px] flex-col items-center justify-center gap-2 text-[14.5px] text-ink-3">
              <GridIcon size={16} />
              No characters yet — they are created with the show proposal.
            </div>
          ) : (
            <div className="mt-7 grid grid-cols-2 gap-5 lg:grid-cols-3">
              {characters.map((c) => (
                <div key={c.id} className="overflow-hidden rounded-xl border border-line-soft bg-surface">
                  {refImages[c.id] ? (
                    <img src={refImages[c.id]} alt={c.name} className="h-[210px] w-full object-cover" />
                  ) : (
                    <div className="flex h-[210px] w-full items-center justify-center bg-raised text-[13px] text-ink-3">
                      No reference image yet
                    </div>
                  )}
                  <div className="px-5 py-4">
                    <p className="text-[16px] font-semibold">{c.name}</p>
                    <p className="pt-1 text-[13.5px] leading-relaxed text-ink-2">
                      {c.canonical_description || 'No canonical description.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))}
      </div>
    </WorkspaceShell>
  )
}
