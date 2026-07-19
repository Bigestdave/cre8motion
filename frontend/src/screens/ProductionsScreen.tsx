import { useState } from 'react'
import { Link } from 'react-router-dom'
import { WorkspaceShell } from '../components/WorkspaceShell'
import { SearchIcon } from '../components/icons2'
import { Thumb } from '../components/ShotStrip'
import { Ellipsis } from '../components/icons'

type StatusType = 'active' | 'warning' | 'review' | 'failed' | 'complete'

interface ProductionItem {
  id: string
  showTitle: string
  episodeCode: string
  episodeTitle: string
  version: string
  thumbId: string
  stage: string
  stageDetail: string
  statusType: StatusType
  progress: number
  budgetUsed: number
  budgetTotal: number
  updatedAt: string
  actionLabel: string
  actionTo: string
}

const mockProductions: ProductionItem[] = [
  {
    id: 'fruitful-secrets-v2',
    showTitle: 'Fruitful Secrets',
    episodeCode: 'E04',
    episodeTitle: 'The Dinner Guest',
    version: 'Production v2',
    thumbId: 'S02',
    stage: 'Animation',
    stageDetail: 'Shot 6 of 8',
    statusType: 'active',
    progress: 72,
    budgetUsed: 64,
    budgetTotal: 100,
    updatedAt: '2m ago',
    actionLabel: 'Continue',
    actionTo: '/brief',
  },
  {
    id: 'tiny-kingdom-v1',
    showTitle: 'Tiny Kingdom',
    episodeCode: 'E02',
    episodeTitle: 'The Broken Crown',
    version: 'Production v1',
    thumbId: 'S04',
    stage: 'Needs attention',
    stageDetail: 'Shot 07 failed both animation attempts.',
    statusType: 'warning',
    progress: 61,
    budgetUsed: 78,
    budgetTotal: 100,
    updatedAt: '8m ago',
    actionLabel: 'Review',
    actionTo: '/keyframes',
  },
  {
    id: 'last-seed-v1',
    showTitle: 'Last Seed',
    episodeCode: 'E01',
    episodeTitle: 'First Rain',
    version: 'Production v1',
    thumbId: 'S01',
    stage: 'Final review',
    stageDetail: '',
    statusType: 'review',
    progress: 100,
    budgetUsed: 82,
    budgetTotal: 100,
    updatedAt: '1h ago',
    actionLabel: 'Review',
    actionTo: '/final-review',
  },
  {
    id: 'tiny-kingdom-e01',
    showTitle: 'Tiny Kingdom',
    episodeCode: 'E01',
    episodeTitle: 'The Hidden Door',
    version: 'Production v1',
    thumbId: 'S03',
    stage: 'Failed during assembly',
    stageDetail: 'Seven approved clips remain available.',
    statusType: 'failed',
    progress: 88,
    budgetUsed: 74,
    budgetTotal: 90,
    updatedAt: 'Yesterday',
    actionLabel: 'Details',
    actionTo: '#',
  },
]

const statusColors: Record<StatusType, string> = {
  active: 'bg-accent',
  warning: 'bg-warn',
  review: 'bg-info',
  failed: 'bg-danger',
  complete: 'bg-ink-4',
}

export function ProductionsScreen() {
  const [filter, setFilter] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')

  const counts = {
    all: mockProductions.length + 12, // mock some completed
    active: mockProductions.filter((p) => p.statusType === 'active').length,
    warning: mockProductions.filter((p) => p.statusType === 'warning').length,
    review: mockProductions.filter((p) => p.statusType === 'review').length,
    complete: 12,
    failed: mockProductions.filter((p) => p.statusType === 'failed').length,
  }

  const filters = [
    { label: 'All', count: counts.all },
    { label: 'Active', count: counts.active },
    { label: 'Needs attention', count: counts.warning },
    { label: 'Review', count: counts.review },
    { label: 'Complete', count: counts.complete },
    { label: 'Failed', count: counts.failed },
  ]

  const filtered = mockProductions.filter((p) => {
    if (filter === 'Active' && p.statusType !== 'active') return false
    if (filter === 'Needs attention' && p.statusType !== 'warning') return false
    if (filter === 'Review' && p.statusType !== 'review') return false
    if (filter === 'Complete' && p.statusType !== 'complete') return false
    if (filter === 'Failed' && p.statusType !== 'failed') return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        p.showTitle.toLowerCase().includes(q) ||
        p.episodeTitle.toLowerCase().includes(q)
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

        {/* Filters + Search (Underline tabs & premium input box with inline counts) */}
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
            <span className="rounded border border-line-soft px-1.5 py-0.5 text-[11.5px] text-ink-4">⌘K</span>
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
          {filtered.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-[minmax(350px,2.5fr)_minmax(200px,1.5fr)_minmax(100px,1fr)_minmax(100px,1fr)_120px] items-center gap-4 border-b border-line-soft bg-surface px-5 py-4 transition-colors last:border-none hover:bg-selected"
            >
              {/* Production info (Clean alignment: dot on left of text block) */}
              <div className="flex items-center gap-4">
                <Thumb shotId={p.thumbId} className="h-[56px] w-[84px] shrink-0 rounded-lg" />
                <div className="flex items-start gap-2.5">
                  <span 
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${statusColors[p.statusType]}`} 
                    title={p.stage} 
                  />
                  <div>
                    <p className="text-[15px] font-semibold tracking-tight">{p.showTitle}</p>
                    <p className="pt-0.5 text-[13px] text-ink-3">
                      {p.episodeCode} · {p.episodeTitle}
                    </p>
                    <p className="pt-0.5 text-[12px] text-ink-4">{p.version}</p>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-3">
                <span className="w-10 text-[14px] tabular-nums text-ink">{p.progress}%</span>
                <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-raised-2">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>

              {/* Budget */}
              <span className="text-[14px] tabular-nums">
                <span className="text-accent">{p.budgetUsed}</span>
                <span className="text-ink-4">/{p.budgetTotal}</span>
              </span>

              {/* Updated */}
              <span className="text-[13px] text-ink-3">{p.updatedAt}</span>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2">
                <Link
                  to={`${p.actionTo}?productionId=${p.id}`}
                  className={`rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                    p.statusType === 'failed'
                      ? 'border border-line bg-raised text-ink hover:bg-selected'
                      : 'bg-ink text-app hover:bg-ink-2'
                  }`}
                >
                  {p.actionLabel}
                </Link>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-raised hover:text-ink">
                  <Ellipsis size={16} />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="flex h-[200px] items-center justify-center bg-surface text-[14.5px] text-ink-3">
              No productions match your filter.
            </div>
          )}
        </div>
      </div>
    </WorkspaceShell>
  )
}
