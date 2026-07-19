import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { WorkspaceShell } from '../components/WorkspaceShell'
import { Thumb } from '../components/ShotStrip'
import { Ellipsis, CheckCircle } from '../components/icons'
import { PlusIcon, SearchIcon } from '../components/icons2'
import { getShows, type Show } from '../data/api'

const filters = ['All', 'In production', 'Complete'] as const

const heroThumbs = ['S06', 'S02', 'S04', 'S01', 'S03', 'S05']

function showStatus(show: Show): { label: string; kind: 'producing' | 'complete' | 'draft' } {
  const latest = show.latest_episode
  if (!latest) return { label: 'No episodes yet', kind: 'draft' }
  const status = latest.status?.toLowerCase() || ''
  if (status === 'in_production' || status === 'planning' || status === 'needs_review') {
    return { label: `Producing Episode ${String(latest.episode_number).padStart(2, '0')}`, kind: 'producing' }
  }
  if (status === 'approved' || status === 'published' || status === 'complete') {
    return { label: 'Complete', kind: 'complete' }
  }
  return { label: `Episode ${String(latest.episode_number).padStart(2, '0')} · Draft`, kind: 'draft' }
}

export function ShowsHomeScreen() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('All')
  const [shows, setShows] = useState<Show[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getShows()
      .then((data) => {
        setShows(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const visibleShows = shows.filter((s) => {
    if (filter === 'All') return true
    const kind = showStatus(s).kind
    return filter === 'In production' ? kind === 'producing' : kind === 'complete'
  })

  // Feature the show that is actively producing, otherwise the most recent one.
  const heroShow =
    shows.find((s) => showStatus(s).kind === 'producing') || (shows.length ? shows[shows.length - 1] : null)
  const heroStatus = heroShow ? showStatus(heroShow) : null

  return (
    <WorkspaceShell>
      <div className="mx-auto max-w-[1280px] px-8 pb-12">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[30px] font-semibold tracking-tight">Shows</h1>
            <p className="pt-1.5 text-[15px] text-ink-2">Build and continue your animated series.</p>
          </div>
          <Link
            to="/create-show"
            className="rounded-lg bg-ink px-5 py-2.5 text-[14px] font-medium text-app transition-colors hover:bg-ink-2"
          >
            Create show
          </Link>
        </div>

        <div className="flex items-center justify-between pt-7">
          <div className="flex rounded-lg border border-line-soft bg-raised p-1">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-3.5 py-1.5 text-[14px] transition-colors ${
                  filter === f ? 'bg-selected font-medium text-ink' : 'text-ink-2 hover:text-ink'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex w-[300px] items-center gap-2.5 rounded-lg border border-line bg-raised px-3.5 py-2 text-[14px] text-ink-3">
            <SearchIcon size={15} />
            <span className="flex-1">Search shows</span>
            <span className="rounded border border-line-soft px-1.5 py-0.5 text-[11.5px] text-ink-4">⌘K</span>
          </div>
        </div>

        {heroShow && (
          <>
            <p className="pb-3 pt-9 text-[11.5px] font-semibold tracking-[0.12em] text-ink-3">
              CONTINUE PRODUCTION
            </p>
            <div className="grid grid-cols-[1fr_380px] overflow-hidden rounded-xl border border-line-soft bg-surface">
              <Thumb shotId="S06" className="h-[248px] w-full rounded-none" />
              <div className="flex flex-col justify-center px-8 py-6">
                <p className="text-[22px] font-semibold tracking-tight">{heroShow.title}</p>
                <p className="pt-1 text-[14.5px] text-ink-2">
                  {heroShow.latest_episode
                    ? `Episode ${String(heroShow.latest_episode.episode_number).padStart(2, '0')} · ${heroShow.latest_episode.title}`
                    : 'No episodes yet'}
                </p>

                <p className="pt-5 text-[13.5px] text-ink-2">
                  {heroStatus?.kind === 'producing' ? 'Production in progress' : 'Ready to begin production'}
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-raised-2">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: heroStatus?.kind === 'producing' ? '72%' : '0%' }}
                    />
                  </div>
                  <span className="text-[13.5px] tabular-nums text-ink-2">
                    {heroStatus?.kind === 'producing' ? '72%' : '0%'}
                  </span>
                </div>

                <div className="pt-5">
                  <Link
                    to={
                      heroShow.latest_episode
                        ? `/show/${heroShow.id}`
                        : `/new-episode?showId=${heroShow.id}`
                    }
                    className="inline-block rounded-lg bg-ink px-6 py-2.5 text-[14px] font-semibold text-app transition-colors hover:bg-ink-2"
                  >
                    Continue
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}

        <p className="pb-3 pt-9 text-[11.5px] font-semibold tracking-[0.12em] text-ink-3">YOUR SHOWS</p>
        <div className="grid grid-cols-3 gap-5">
          {loading ? (
            <div className="p-4 text-ink-2">Loading shows...</div>
          ) : (
            visibleShows.map((s, index) => {
              const status = showStatus(s)
              return (
                <Link
                  key={s.id}
                  to={`/show/${s.id}`}
                  className="group overflow-hidden rounded-xl border border-line-soft bg-surface transition-colors hover:border-line"
                >
                  <div className="relative">
                    <Thumb
                      shotId={heroThumbs[index % heroThumbs.length]}
                      className="aspect-[16/10] w-full rounded-none"
                    />
                    <button
                      className="absolute right-3 top-3 rounded-md bg-app/60 p-1.5 text-ink-2 opacity-0 backdrop-blur transition-opacity hover:text-ink group-hover:opacity-100"
                      aria-label="More"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Ellipsis size={16} />
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="text-[17px] font-semibold tracking-tight">{s.title}</p>
                    <p className="pt-1 text-[13.5px] text-ink-2">
                      {s.episode_count === 1 ? '1 episode' : `${s.episode_count || 0} episodes`}
                    </p>
                    <div className="flex items-center gap-2 pt-2.5 text-[13.5px]">
                      {status.kind === 'producing' && <span className="h-2 w-2 rounded-full bg-accent" />}
                      {status.kind === 'complete' && <CheckCircle size={14} className="text-accent" />}
                      {status.kind === 'draft' && <span className="h-2 w-2 rounded-full bg-raised-2" />}
                      <span className={status.kind === 'draft' ? 'text-ink-3' : 'text-ink-2'}>{status.label}</span>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
          <Link
            to="/create-show"
            className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-line px-8 text-center transition-colors hover:border-line-strong"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-line text-accent">
              <PlusIcon size={22} />
            </span>
            <span className="pt-4 text-[16px] font-semibold text-ink">Create show</span>
            <span className="pt-2 text-[13.5px] leading-relaxed text-ink-3">
              Start a new animated series. Our AI showrunner will plan, produce, and bring it to life.
            </span>
          </Link>
        </div>
      </div>
    </WorkspaceShell>
  )
}
