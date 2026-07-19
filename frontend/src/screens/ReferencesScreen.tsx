import { AppShell } from '../components/AppShell'
import { RightPanel, KV } from '../components/RightPanel'
import { ThumbShotStrip, Thumb, type StripStatuses } from '../components/ShotStrip'
import { Checklist } from '../components/Checklist'
import { ChevronRight, Spinner } from '../components/icons'

const statuses: StripStatuses = {
  S01: 'approved', S02: 'approved', S03: 'approved', S04: 'approved',
  S05: 'approved', S06: 'approved', S07: 'generating', S08: 'generating',
}

interface RefCardProps {
  thumbId: string
  title: string
  subtitle: React.ReactNode
  selected?: boolean
  generating?: boolean
}

function RefCard({ thumbId, title, subtitle, selected, generating }: RefCardProps) {
  return (
    <button
      className={`flex w-full items-center gap-4 rounded-xl border p-3 text-left transition-colors ${
        selected ? 'border-accent bg-raised' : 'border-line-soft bg-raised hover:border-line'
      }`}
    >
      <Thumb shotId={thumbId} className="h-[72px] w-[104px] shrink-0" />
      <div className="flex-1">
        <p className="text-[16px] font-semibold">{title}</p>
        <p className="pt-1 text-[14px] text-ink-2">{subtitle}</p>
      </div>
      {generating ? <Spinner size={18} /> : <ChevronRight className="text-ink-3" />}
    </button>
  )
}

export function ReferencesScreen() {
  return (
    <AppShell
      active="References"
      panel={
        <RightPanel
          render={(tab) =>
            tab === 'Details' ? (
              <div>
                <h2 className="pb-4 text-[18px] font-semibold">
                  Garden <span className="px-1 text-ink-3">·</span> Evening view
                </h2>
                <KV label="Status" value={<span className="flex items-center gap-2 font-medium text-accent">Generating <Spinner size={15} /></span>} />
                <KV label="Required for" value="Shots 07 and 08" />
                <KV label="Source" value="Approved garden reference" />
                <KV label="Transformation" value="Evening lighting and wider camera angle" />

                <h3 className="pb-3 pt-6 text-[16px] font-semibold">Continuity constraints</h3>
                <ul className="flex flex-col gap-2.5">
                  {['Preserve stone pathway', 'Keep damaged west fence visible', 'Match Episode 03 vegetation'].map((c) => (
                    <li key={c} className="flex items-center gap-3 text-[14.5px] text-ink-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {c}
                    </li>
                  ))}
                </ul>

                <button className="mt-7 flex w-full items-center justify-between rounded-xl border border-line px-4 py-3.5 text-[15px] transition-colors hover:bg-raised">
                  View source details
                  <ChevronRight className="text-ink-3" />
                </button>
              </div>
            ) : null
          }
        />
      }
      strip={<ThumbShotStrip statuses={statuses} variant="plain" />}
    >
      <div className="p-8">
        <h1 className="text-[32px] font-bold tracking-tight">Preparing references</h1>
        <p className="pt-2 text-[15px] text-ink-2">11 of 12 references ready</p>
        <div className="mt-4 h-[6px] w-full overflow-hidden rounded-full bg-raised-2">
          <div className="h-full rounded-full bg-accent" style={{ width: `${(11 / 12) * 100}%` }} />
        </div>

        <div className="mt-8 grid grid-cols-[1fr_300px] gap-8">
          <div>
            <p className="pb-3 text-[12px] font-semibold tracking-[0.12em] text-ink-3">CHARACTERS</p>
            <div className="flex flex-col gap-3">
              <RefCard thumbId="S05" title="Lumi" subtitle={<>6 references <span className="px-1 text-ink-3">·</span> <span className="text-accent">Ready</span></>} />
              <RefCard thumbId="S07" title="Kai" subtitle={<>5 references <span className="px-1 text-ink-3">·</span> <span className="text-accent">Ready</span></>} />
            </div>

            <p className="pb-3 pt-7 text-[12px] font-semibold tracking-[0.12em] text-ink-3">LOCATIONS</p>
            <div className="flex flex-col gap-3">
              <RefCard thumbId="S02" title="Kitchen" subtitle={<>3 angles <span className="px-1 text-ink-3">·</span> <span className="text-accent">Ready</span></>} />
              <RefCard thumbId="S01" title="Garden" subtitle={<span className="text-accent">Generating evening view...</span>} selected generating />
            </div>

            <p className="pb-3 pt-7 text-[12px] font-semibold tracking-[0.12em] text-ink-3">PROPS</p>
            <RefCard thumbId="S03" title="Moon necklace" subtitle={<span className="text-accent">Ready</span>} />
          </div>

          <div className="pt-[260px]">
            <Checklist
              items={[
                { label: 'Existing references checked', state: 'done' },
                { label: 'Required views identified', state: 'done' },
                { label: 'Character references ready', state: 'done' },
                { label: 'Generating missing environment view', state: 'todo' },
              ]}
            />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
