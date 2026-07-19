import { Link } from 'react-router-dom'
import { WorkspaceShell } from '../components/WorkspaceShell'
import { CheckCircle, ChevronDown, DocIcon } from '../components/icons'
import { InfoCircle } from '../components/icons2'
import { shots } from '../data/shots'

const readiness = [
  { label: 'Duration', value: '45 seconds' },
  { label: 'Shots', value: '8' },
  { label: 'Characters', value: '2' },
  { label: 'Locations', value: '2' },
  { label: 'Estimated budget', value: '86 units', accent: true },
  { label: 'Retry reserve', value: '14 units' },
]

const readyChecks = [
  'Episode analyzed',
  'Required references found',
  'Eight shots planned',
  'Budget allocated',
]

export function PreflightScreen() {
  return (
    <WorkspaceShell
      breadcrumb={<><span>Fruitful Secrets</span><span className="px-2 text-ink-3">/</span><span>Episode 05</span></>}
      backTo="/new-episode"
    >
      <div className="mx-auto max-w-[1280px] px-8 pb-8">
        <h1 className="text-[30px] font-semibold tracking-tight">Production plan ready</h1>
        <p className="pt-1.5 text-[15px] text-ink-2">Cre8Motion has prepared an eight-shot production plan.</p>

        <div className="grid grid-cols-2 gap-x-14 pt-7">
          {/* Left column */}
          <div>
            <h2 className="pb-3 text-[16px] font-semibold">Readiness summary</h2>
            <div className="rounded-xl border border-line-soft bg-surface px-5 py-2">
              {readiness.map((r) => (
                <div key={r.label} className="flex items-center justify-between border-b border-line-soft py-2.5 last:border-b-0">
                  <span className={`text-[14.5px] ${r.accent ? 'font-medium text-accent' : 'text-ink-2'}`}>{r.label}</span>
                  <span className={`text-[14.5px] ${r.accent ? 'font-semibold text-accent' : ''}`}>{r.value}</span>
                </div>
              ))}
            </div>

            <h2 className="pb-3 pt-7 text-[16px] font-semibold">Shot plan</h2>
            <div className="rounded-xl border border-line-soft bg-surface px-5 py-2">
              {shots.map((s) => (
                <div key={s.id} className="flex items-center gap-4 border-b border-line-soft py-2.5 last:border-b-0">
                  <span className="w-7 text-[14.5px] font-semibold text-ink-2">{s.num}</span>
                  <span className="flex-1 text-[14.5px]">{s.name}</span>
                  <span className="text-[14px] text-ink-2">{s.sec} sec</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="border-l border-line-soft pl-14">
            <h2 className="pb-4 text-[16px] font-semibold">Ready for production</h2>
            <ul className="flex flex-col gap-3.5">
              {readyChecks.map((c) => (
                <li key={c} className="flex items-center gap-3 text-[14.5px] text-ink-2">
                  <CheckCircle size={18} />
                  {c}
                </li>
              ))}
            </ul>

            <h2 className="pb-3 pt-8 text-[16px] font-semibold">Production consideration</h2>
            <div className="rounded-xl border border-[color-mix(in_srgb,var(--color-warn)_38%,transparent)] bg-[color-mix(in_srgb,var(--color-warn)_7%,transparent)] p-5">
              <p className="flex items-center gap-2.5 text-[15px] font-medium text-warn">
                <InfoCircle size={17} />
                One production consideration
              </p>
              <p className="pt-2.5 text-[14.5px] leading-relaxed text-ink-2">
                Shot 07 includes two characters and complex movement.
                Cre8Motion has allocated additional retry budget to this shot.
              </p>
            </div>

            <button className="mt-5 flex w-full items-center justify-between rounded-xl border border-line px-4 py-3.5 text-[15px] transition-colors hover:bg-raised">
              <span className="flex items-center gap-3">
                <DocIcon className="text-ink-2" />
                Review planning details
              </span>
              <ChevronDown className="text-ink-3" />
            </button>
            <p className="pt-3 text-[13.5px] leading-relaxed text-ink-3">
              See scene breakdown, required references, shot descriptions,
              budget allocation, and continuity assumptions.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between border-t border-line-soft pt-5">
          <Link
            to="/new-episode"
            className="rounded-lg border border-line bg-raised px-5 py-2.5 text-[14.5px] font-medium transition-colors hover:bg-raised-2"
          >
            Back to episode
          </Link>
          <div className="text-right">
            <Link
              to="/brief"
              className="inline-flex items-center gap-2.5 rounded-lg bg-ink px-6 py-3 text-[15px] font-medium text-app transition-colors hover:bg-ink-2"
            >
              Start production
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M4 10h12M11 4.5L16.5 10 11 15.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <p className="pt-2.5 text-[13px] leading-snug text-ink-3">
              Production will continue automatically unless<br />Cre8Motion needs a creative decision.
            </p>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  )
}
