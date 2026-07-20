import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { WorkspaceShell } from '../components/WorkspaceShell'
import { SearchIcon } from '../components/icons2'
import { Thumb } from '../components/ShotStrip'
import { listProductions, type ProductionListItem } from '../data/api'

type StatusType = 'active' | 'warning' | 'review' | 'failed' | 'complete'

const THUMBS = ['S02', 'S04', 'S01', 'S03', 'S05', 'S06']

const statusColors: Record<StatusType, string> = {
  active: 'bg-accent',
  warning: 'bg-warn',
  review: 'bg-info',
  failed: 'bg-danger',
  complete: 'bg-ink-4',
}

// Ordered pipeline stages → progress estimate and review screen
const STAGE_ORDER = [
  'QUEUED', 'CREATED', 'NORMALIZING_INPUT', 'PLANNING', 'PLAN_VALIDATION', 'REFERENCE_RESOLUTION',
  'SHOT_PLANNING', 'STORYBOARD_GENERATION', 'STORYBOARD_QC', 'KEYFRAME_GENERATION', 'KEYFRAME_QC',
  'VIDEO_GENERATION', 'VIDEO_QC', 'AUDIO_GENERATION', 'ASSEMBLY', 'FINAL_QC', 'READY_FOR_REVIEW',
]

function stageProgress(stage: string): number {
  const idx = STAGE_ORDER.indexOf((stage || '').toUpperCase())
  if (idx < 0) return 0
  return Math.round((idx / (STAGE_ORDER.length - 1)) * 100)
}

function stageScreen(stage: string): string {
  const s = (stage || '').toUpperCase()
  if (s.startsWith('STORYBOARD')) return '/storyboards'
  if (s.startsWith('KEYFRAME')) return '/keyframes'
  if (s.startsWith('VIDEO') || s === 'ANIMATION') return '/animation'
  if (s.startsWith('AUDIO')) return '/audio'
  if (s === 'ASSEMBLY') return '/assembly'
  if (s === 'FINAL_QC' || s === 'READY_FOR_REVIEW') return '/final-review'
  return '/plan'
}

function classify(p: ProductionListItem): { type: StatusType; label: string } {
  const status = (p.status || '').toLowerCase()
  const stage = (p.current_stage || '').toUpperCase()
  if (status === 'failed') return { type: 'failed', label: p.failure_reason || 'Failed' }
  if (status === 'paused') return { type: 'warning', label: 'Paused — needs attention' }
  if (stage === 'READY_FOR_REVIEW' || status === 'ready_for_review') return { type: 'review', label: 'Final review' }
  if (status === 'complete' || status === 'approved') return { type: 'complete', label: 'Complete' }
  return { type: 'active', label: prettyStage(stage) }
}

function prettyStage(stage: string): string {
  if (!stage) return 'Starting'
  return stage.charAt(0) + stage.slice(1).toLowerCase().replace(/_/g, ' ')
}

function timeAgo(iso?: string | null): string {
  if (!iso) return '—'
  const then = new Date(iso.replace(' ', 'T') + (iso.includes('Z') ? '' : 'Z')).getTime()
  if (Number.isNaN(then)) return '—'
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export function ProductionsScreen() {
  const [filter, setFilter] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [productions, setProductions] = useState<ProductionListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = () =>
      listProductions()
        .then((data) => {
          setProductions(data)
          setLoading(false)
        })
        .catch((err) => {
          console.error(err)
          setLoading(false)
        })
    load()
    // Refresh periodically so running productions advance on screen
    const timer = setInterval(load, 15000)
    return () => clearInterval(timer)
  }, [])

  const withMeta = productions.map((p) => ({ ...p, meta: classify(p) }))

  const counts = {
    all: withMeta.length,
    active: withMeta.filter((p) => p.meta.type === 'active').length,
    warning: withMeta.filter((p) => p.meta.type === 'warning').length,
    review: withMeta.filter((p) => p.meta.type === 'review').length,
    complete: withMeta.filter((p) => p.meta.type === 'complete').length,
    failed: withMeta.filter((p) => p.meta.type === 'failed').length,
  }

  const filters = [
    { label: 'All', count: counts.all },
    { label: 'Active', count: counts.active },
    { label: 'Needs attention', count: counts.warning },
    { label: 'Review', count: counts.review },
    { label: 'Complete', count: counts.complete },
    { label: 'Failed', count: counts.failed },
  ]

  const filtered = withMeta.filter((p) => {
    if (filter === 'Active' && p.meta.type !== 'active') return false
    if (filter === 'Needs attention' && p.meta.type !== 'warning') return false
    if (filter === 'Review' && p.meta.type !== 'review') return false
    if (filter === 'Complete' && p.meta.type !== 'complete') return false
    if (filter === 'Failed' && p.meta.type !== 'failed') return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        (p.show_title || '').toLowerCase().includes(q) ||
        (p.episode_title || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <WorkspaceShell>
      <div className="mx-auto max-w-[1280px] px-8 pb-12 pt-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[30px] font-semibold tracking-tight">Productions</h1>
            <p className="pt-1.5 text-[15px] text-ink-2">
              Monitor every episode production in your workspace.
            </p>
          </div>
        </div>

        {/* Filters + Search */}
        <div className="mt-6 flex items-center justify-between border-b border-line-soft pt-4">
          <div className="flex gap-2">
            {filters.map((f) => (
              <button
                key={f.label}
                onClick={() => setFilter(f.label)}
                className={`relative px-4 py-3.5 text-[14.5px] transition-colors ${
                  filter === f.label ? 'font-semibold text-ink' : 'text-ink-3 hover:text-ink-2'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {f.label}
                  <span className={`text-[12px] px-1.5 py-0.5 rounded-full ${
                    filter === f.label ? 'bg-selected text-accent font-semibold' : 'bg-raised text-ink-4'
                  }`}>
                    {f.count}
                  </span>
                </span>
                {filter === f.label && (
                  <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-t bg-accent" />
                )}
              </button>
            ))}
          </div>

          <div className="mb-2 flex w-[300px] items-center gap-2.5 rounded-lg border border-line bg-raised px-3.5 py-2 text-[14px] text-ink-3 focus-within:border-accent-border">
            <SearchIcon size={15} />
            <input
              type="text"
              placeholder="Search productions"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-ink placeholder-ink-4 outline-none text-[14px]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-xl border border-line-soft bg-surface">
          {/* Table header */}
          <div className="grid grid-cols-[minmax(350px,2.5fr)_minmax(200px,1.5fr)_minmax(100px,1fr)_minmax(100px,1fr)_120px] items-center gap-4 border-b border-line-soft bg-raised px-5 py-3 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-ink-3">
            <span>Production</span>
            <span>Progress</span>
            <span>Budget</span>
            <span>Updated</span>
            <span className="text-right">Action</span>
          </div>

          {/* Rows */}
          {filtered.map((p, i) => {
            const progress = p.meta.type === 'complete' || p.meta.type === 'review' ? 100 : stageProgress(p.current_stage)
            return (
              <div
                key={p.id}
                className="grid grid-cols-[minmax(350px,2.5fr)_minmax(200px,1.5fr)_minmax(100px,1fr)_minmax(100px,1fr)_120px] items-center gap-4 border-b border-line-soft bg-surface px-5 py-4 transition-colors last:border-none hover:bg-selected"
              >
                <div className="flex items-center gap-4">
                  <Thumb shotId={THUMBS[i % THUMBS.length]} className="h-[56px] w-[84px] shrink-0 rounded-lg" />
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${statusColors[p.meta.type]}`}
                      title={p.meta.label}
                    />
                    <div>
                      <p className="text-[15px] font-semibold tracking-tight">{p.show_title || 'Unknown show'}</p>
                      <p className="pt-0.5 text-[13px] text-ink-3">
                        E{String(p.episode_number || 0).padStart(2, '0')} · {p.episode_title || 'Untitled'}
                      </p>
                      <p className="pt-0.5 text-[12px] text-ink-4">Production v{p.version} · {p.meta.label}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-10 text-[14px] tabular-nums text-ink">{progress}%</span>
                  <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-raised-2">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <span className="text-[14px] tabular-nums">
                  <span className="text-accent">{p.budget_used}</span>
                  <span className="text-ink-4">/{p.budget_limit}</span>
                </span>

                <span className="text-[13px] text-ink-3">{timeAgo(p.started_at)}</span>

                <div className="flex items-center justify-end">
                  <Link
                    to={`${stageScreen(p.current_stage)}?productionId=${p.id}`}
                    className={`rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                      p.meta.type === 'failed'
                        ? 'border border-line bg-raised text-ink hover:bg-selected'
                        : 'bg-ink text-app hover:bg-ink-2'
                    }`}
                  >
                    {p.meta.type === 'review' ? 'Review' : p.meta.type === 'failed' ? 'Details' : 'Open'}
                  </Link>
                </div>
              </div>
            )
          })}

          {loading && (
            <div className="flex h-[200px] items-center justify-center bg-surface text-[14.5px] text-ink-3">
              Loading productions...
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="flex h-[220px] flex-col items-center justify-center gap-3 bg-surface text-[14.5px] text-ink-3">
              <p>{productions.length === 0 ? 'No productions yet.' : 'No productions match your filter.'}</p>
              {productions.length === 0 && (
                <Link
                  to="/shows"
                  className="rounded-lg bg-ink px-5 py-2.5 text-[14px] font-medium text-app transition-colors hover:bg-ink-2"
                >
                  Start one from a show
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </WorkspaceShell>
  )
}
