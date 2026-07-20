import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { WorkspaceShell } from '../components/WorkspaceShell'
import { CheckCircle, ChevronDown } from '../components/icons'
import { ClockIcon } from '../components/icons2'
import { generateEpisodeDraft, createEpisode, startProduction, getShow, type Show } from '../data/api'

export function NewEpisodeScreen() {
  const [searchParams] = useSearchParams()
  const showId = searchParams.get('showId') || ''
  const navigate = useNavigate()

  const [show, setShow] = useState<Show | null>(null)
  const [ideaSeed, setIdeaSeed] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!showId) return
    getShow(showId).then(setShow).catch(console.error)
  }, [showId])

  const episodeCount = show?.episode_count || 0

  const inherited = show
    ? [
        `${show.title} style profile`,
        `${show.default_aspect_ratio} vertical format`,
        episodeCount > 0 ? `Continuity through Episode ${String(episodeCount).padStart(2, '0')}` : 'Fresh continuity (first episode)',
        `${show.default_duration_seconds}-second default`,
        'Character references inherited',
      ]
    : []

  const runPlan = async (seed: string) => {
    setLoading(true)
    setError(null)
    try {
      // 1. qwen-max writes the full silent-story script from the seed (or from pure continuity)
      setProgress(seed ? 'qwen-max is writing the script…' : 'qwen-max is reading show continuity and pitching the next episode…')
      const draft = await generateEpisodeDraft(showId, seed)

      // 2. Create the episode record
      setProgress(`Saving "${draft.title}"…`)
      const episode = await createEpisode(showId, draft)

      // 3. Kick off the autonomous production pipeline
      setProgress('Starting the production pipeline…')
      const production = await startProduction(episode.id)

      // 4. Navigate to planning workspace
      navigate(`/plan?productionId=${production.production_id}`)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Something went wrong planning the episode.')
      setLoading(false)
      setProgress(null)
    }
  }

  return (
    <WorkspaceShell
      breadcrumb={<><span>{show?.title || 'Show'}</span><span className="px-2 text-ink-3">/</span><span>New episode</span></>}
      backTo={showId ? `/show/${showId}` : '/shows'}
    >
      <div className="mx-auto max-w-[1280px] px-8 pb-8">
        <div className="grid grid-cols-[1fr_400px] gap-10">
          {/* Left: form */}
          <div>
            <h1 className="text-[30px] font-semibold tracking-tight">Create the next episode</h1>
            <p className="pt-1.5 text-[15px] text-ink-2">
              Give the showrunner a seed — or let it continue the story on its own.
            </p>

            <p className="pb-2 pt-7 text-[14px] text-ink-2">Idea seed (optional)</p>
            <textarea
              rows={5}
              value={ideaSeed}
              onChange={(e) => setIdeaSeed(e.target.value)}
              placeholder="e.g. A character finds a mystery box and tries to open it — or leave empty and the showrunner continues from where the story left off"
              className="w-full resize-y rounded-lg border border-line bg-transparent px-4 py-3 text-[15px] leading-relaxed outline-none transition-colors focus:border-accent-border"
            />

            <div className="mt-3 flex items-center justify-between">
              <p className="text-[13px] text-ink-4">
                No idea needed — the continuity engine knows what happened last episode.
              </p>
              <button
                type="button"
                onClick={() => runPlan('')}
                disabled={loading}
                className="flex shrink-0 items-center gap-2 rounded-lg border border-accent-border px-4 py-2 text-[14px] font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
              >
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2l1.8 4.6L16.5 8l-4.7 1.4L10 14l-1.8-4.6L3.5 8l4.7-1.4L10 2z" fill="currentColor" />
                </svg>
                Let the showrunner decide
              </button>
            </div>

            <p className="pb-2 pt-6 text-[14px] text-ink-2">Episode duration</p>
            <div className="flex w-full items-center justify-between rounded-lg border border-line px-4 py-3 text-[15px]">
              <span className="flex items-center gap-3">
                <ClockIcon size={16} className="text-ink-2" />
                Use show default <span className="px-0.5 text-ink-3">·</span> {show?.default_duration_seconds || 45} seconds
              </span>
            </div>
          </div>

          {/* Right: inherited assets */}
          <aside className="pt-[72px]">
            <div className="rounded-xl border border-line-soft bg-surface p-6">
              <p className="pb-4 text-[16px] font-semibold">Inherited from Show</p>
              <ul className="flex flex-col gap-3.5">
                {(inherited.length ? inherited : ['Loading show context…']).map((i) => (
                  <li key={i} className="flex items-center gap-3 text-[14.5px] text-ink-2">
                    <CheckCircle size={17} />
                    {i}
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-line-soft pt-5">
                <div className="flex w-full items-center justify-between text-left">
                  <div>
                    <p className="text-[15px] font-medium">Production preferences</p>
                    <p className="pt-1 text-[13.5px] text-ink-3">Show defaults will be used</p>
                  </div>
                  <ChevronDown className="text-ink-3" />
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between border-t border-line-soft pt-5">
          <span />
          <div className="flex items-center gap-5">
            {error && <p className="max-w-[400px] text-right text-[13.5px] text-red-400">{error}</p>}
            {loading && progress ? (
              <p className="text-right text-[13.5px] leading-snug text-accent">{progress}</p>
            ) : (
              <p className="text-right text-[13.5px] leading-snug text-ink-3">
                Cre8Motion will write the script<br />and plan the full episode.
              </p>
            )}
            <button
              onClick={() => runPlan(ideaSeed)}
              disabled={loading || !ideaSeed}
              className="flex items-center gap-2.5 rounded-lg bg-ink px-6 py-3 text-[15px] font-medium text-app transition-colors hover:bg-ink-2 disabled:opacity-50"
            >
              {loading ? 'Planning…' : 'Plan episode'}
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M4 10h12M11 4.5L16.5 10 11 15.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  )
}
