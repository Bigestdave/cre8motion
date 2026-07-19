import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { WorkspaceShell } from '../components/WorkspaceShell'
import { Thumb } from '../components/ShotStrip'
import { CheckCircleSolid, Ellipsis } from '../components/icons'
import { PeopleIcon, LoopIcon, GridIcon } from '../components/icons2'
import { getShow } from '../data/api'

const tabs = ['Episodes', 'Characters', 'Style', 'Continuity'] as const

export function ShowOverviewScreen() {
  const { id } = useParams()
  const [tab, setTab] = useState<(typeof tabs)[number]>('Episodes')
  const [show, setShow] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getShow(id).then(data => {
      setShow(data)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <WorkspaceShell breadcrumb="Shows" backTo="/shows">
        <div className="flex h-[300px] items-center justify-center text-ink-2">Loading show...</div>
      </WorkspaceShell>
    )
  }

  return (
    <WorkspaceShell breadcrumb="Shows" backTo="/shows">
      <div className="mx-auto max-w-[1280px] px-8 pb-12">
        {/* Header */}
        <div className="flex items-start gap-6">
          <Thumb shotId="S02" className="h-[150px] w-[210px] shrink-0 rounded-xl" />
          <div className="flex-1 pt-2">
            <h1 className="text-[30px] font-semibold tracking-tight">{show?.title || 'Show Title'}</h1>
            <p className="pt-1.5 text-[15px] text-ink-2">{show?.premise || 'Show premise'}</p>
            <p className="pt-3 text-[14px] text-ink-2">
              <span className="px-1.5 text-ink-3">·</span> {show?.default_style_id || 'Polished 3D'}
              <span className="px-1.5 text-ink-3">·</span> {show?.default_duration_seconds || '45'}-second default
            </p>
          </div>
          <div className="flex items-center gap-3 pt-3">
            <Link
              to={`/new-episode?showId=${id}`}
              className="rounded-lg bg-ink px-5 py-2.5 text-[14px] font-medium text-app transition-colors hover:bg-ink-2"
            >
              Create episode
            </Link>
            <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink-2 transition-colors hover:bg-raised" aria-label="More">
              <Ellipsis />
            </button>
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
              {tab === t && <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-t bg-accent" />}
            </button>
          ))}
        </div>

        {tab === 'Episodes' && (
          <>
            <h2 className="pb-3 pt-7 text-[18px] font-semibold">Start production</h2>
            <div className="flex items-center gap-5 overflow-hidden rounded-xl border border-line-soft bg-surface">
              <Thumb shotId="S08" className="h-[130px] w-[220px] shrink-0 rounded-none" />
              <div className="flex-1 py-4">
                <p className="text-[16px] font-semibold">
                  Episode 01 <span className="px-1 text-ink-3">·</span> Draft
                </p>
                <p className="pt-1.5 text-[14px] text-ink-2">Ready to plan</p>
                <div className="flex items-center gap-3 pt-3">
                  <div className="relative h-[5px] w-[340px] overflow-hidden rounded-full bg-raised-2">
                    <div className="h-full rounded-full bg-accent" style={{ width: '0%' }} />
                  </div>
                  <span className="text-[13.5px] text-ink-2">0%</span>
                </div>
              </div>
              <Link
                to={`/new-episode?showId=${id}`}
                className="mr-6 shrink-0 rounded-lg bg-ink px-5 py-2.5 text-[14px] font-medium text-app transition-colors hover:bg-ink-2"
              >
                Create Episode
              </Link>
            </div>
            
            {/* Health summary row */}
            <div className="mt-8 flex items-center justify-center gap-8 rounded-xl border border-line-soft bg-surface px-6 py-3.5 text-[14px]">
              <span className="flex items-center gap-2.5 text-ink-2">
                <PeopleIcon size={16} /> Characters
                <span className="rounded-md bg-raised px-2 py-0.5 text-[13px] text-ink">3</span>
              </span>
              <span className="h-4 w-px bg-line" />
              <span className="flex items-center gap-2.5 text-ink-2">
                <CheckCircleSolid size={15} /> Approved episodes
                <span className="rounded-md bg-raised px-2 py-0.5 text-[13px] text-ink">0</span>
              </span>
              <span className="h-4 w-px bg-line" />
              <span className="flex items-center gap-2.5 text-ink-2">
                <LoopIcon size={16} /> Continuity
                <span className="rounded-md bg-raised px-2 py-0.5 text-[13px] text-ink">v1</span>
              </span>
            </div>
          </>
        )}

        {tab !== 'Episodes' && (
          <div className="flex h-[300px] items-center justify-center text-[14.5px] text-ink-3">
            <GridIcon size={16} className="mr-2.5" />
            The "{tab}" tab design has not been provided yet.
          </div>
        )}
      </div>
    </WorkspaceShell>
  )
}
