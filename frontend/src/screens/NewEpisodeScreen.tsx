import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { WorkspaceShell } from '../components/WorkspaceShell'
import { CheckCircle, ChevronDown } from '../components/icons'
import { ClockIcon } from '../components/icons2'
import { generateEpisodeDraft, createEpisode, startProduction } from '../data/api'

const inherited = [
  'Polished 3D style',
  'Character references v3',
  'Vertical · 9:16',
  'Continuity through Episode 03',
  '45-second default',
]

export function NewEpisodeScreen() {
  const [searchParams] = useSearchParams()
  const showId = searchParams.get('showId') || 'show_123'
  const navigate = useNavigate()
  
  const [ideaSeed, setIdeaSeed] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePlanEpisode = async () => {
    if (!ideaSeed) return
    setLoading(true)
    try {
      // 1. Generate autonomous draft
      const draft = await generateEpisodeDraft(showId, ideaSeed)
      
      // 2. Create the episode
      const episode = await createEpisode(showId, draft)
      
      // 3. Start production
      const production = await startProduction(episode.id)
      
      // 4. Navigate to planning workspace
      navigate(`/plan?productionId=${production.production_id}`)
    } catch (err) {
      console.error(err)
      alert("Failed to plan episode")
      setLoading(false)
    }
  }

  return (
    <WorkspaceShell
      breadcrumb={<><span>Show</span><span className="px-2 text-ink-3">/</span><span>New episode</span></>}
      backTo="/shows"
    >
      <div className="mx-auto max-w-[1280px] px-8 pb-8">
        <div className="grid grid-cols-[1fr_400px] gap-10">
          {/* Left: form */}
          <div>
            <h1 className="text-[30px] font-semibold tracking-tight">Create the next episode</h1>
            <p className="pt-1.5 text-[15px] text-ink-2">
              Provide an idea seed. Cre8Motion's AI will write the script and plan the production.
            </p>

            <p className="pb-2 pt-7 text-[14px] text-ink-2">Idea seed</p>
            <textarea
              rows={5}
              value={ideaSeed}
              onChange={(e) => setIdeaSeed(e.target.value)}
              placeholder="e.g. A character finds a mystery box and tries to open it..."
              className="w-full resize-y rounded-lg border border-line bg-transparent px-4 py-3 text-[15px] leading-relaxed outline-none transition-colors focus:border-accent-border"
            />

            <p className="pb-2 pt-6 text-[14px] text-ink-2">Episode duration</p>
            <button className="flex w-full items-center justify-between rounded-lg border border-line px-4 py-3 text-[15px] transition-colors hover:border-line-strong">
              <span className="flex items-center gap-3">
                <ClockIcon size={16} className="text-ink-2" />
                Use show default <span className="px-0.5 text-ink-3">·</span> 45 seconds
              </span>
              <ChevronDown className="text-ink-3" />
            </button>
          </div>

          {/* Right: inherited assets */}
          <aside className="pt-[72px]">
            <div className="rounded-xl border border-line-soft bg-surface p-6">
              <p className="pb-4 text-[16px] font-semibold">Inherited from Show</p>
              <ul className="flex flex-col gap-3.5">
                {inherited.map((i) => (
                  <li key={i} className="flex items-center gap-3 text-[14.5px] text-ink-2">
                    <CheckCircle size={17} />
                    {i}
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-line-soft pt-5">
                <button className="flex w-full items-center justify-between text-left">
                  <div>
                    <p className="text-[15px] font-medium">Production preferences</p>
                    <p className="pt-1 text-[13.5px] text-ink-3">Show defaults will be used</p>
                  </div>
                  <ChevronDown className="text-ink-3" />
                </button>
              </div>
            </div>
          </aside>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between border-t border-line-soft pt-5">
          <button className="text-[14.5px] text-ink-2 transition-colors hover:text-ink">Save draft</button>
          <div className="flex items-center gap-5">
            <p className="text-right text-[13.5px] leading-snug text-ink-3">
              Cre8Motion will write the script<br />and plan the full episode.
            </p>
            <button
              onClick={handlePlanEpisode}
              disabled={loading || !ideaSeed}
              className="flex items-center gap-2.5 rounded-lg bg-ink px-6 py-3 text-[15px] font-medium text-app transition-colors hover:bg-ink-2 disabled:opacity-50"
            >
              {loading ? 'Planning...' : 'Plan episode'}
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

