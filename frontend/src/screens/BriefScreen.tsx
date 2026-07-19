import { AppShell } from '../components/AppShell'
import { RightPanel, KV } from '../components/RightPanel'
import { CheckCircle, ChevronDown, CircleOutline } from '../components/icons'
import { PeopleIcon, ClockIcon, PhoneIcon, WandIcon, LoopIcon, FramePlaceholder } from '../components/icons2'
import { shots } from '../data/shots'

const briefRows = [
  { icon: PeopleIcon, label: 'Characters', value: 'Lumi, Kai' },
  { icon: ClockIcon, label: 'Target duration', value: '45 seconds' },
  { icon: PhoneIcon, label: 'Format', value: 'Vertical · 9:16' },
  { icon: WandIcon, label: 'Inherited style', value: 'Polished 3D v2' },
  { icon: LoopIcon, label: 'Continuity', value: 'Version 4 · Through Episode 04' },
]

const inheritedAssets = [
  'Character references v3',
  'Polished 3D style v2',
  'Continuity v4',
  'Audio profile v1',
]

/** Estimated (empty) shot strip — dashed placeholder frames */
function EstimatedStrip() {
  return (
    <div className="grid grid-cols-8 gap-3">
      {shots.map((s) => (
        <div key={s.id} className="rounded-xl border border-line-soft bg-raised p-2 pb-2.5">
          <div className="mb-2 flex aspect-[16/10] w-full items-center justify-center rounded-md border border-dashed border-line-strong">
            <FramePlaceholder />
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-[13.5px] font-semibold">{s.id}</span>
            <CircleOutline size={15} />
          </div>
          <p className="px-1 pt-0.5 text-[12.5px] text-ink-3">Estimated</p>
        </div>
      ))}
    </div>
  )
}

export function BriefScreen() {
  return (
    <AppShell
      active="Brief"
      panel={
        <RightPanel
          render={(tab) =>
            tab === 'Details' ? (
              <div>
                <h2 className="pb-3 text-[17px] font-semibold">Production context</h2>
                <KV label="Show" value="Fruitful Secrets" />
                <KV label="Episode" value={<>05 <span className="px-1 text-ink-3">·</span> The Moon Necklace</>} />
                <KV label="Created" value="Today, 08:42" />
                <KV label="Last updated" value="Just now" />

                <h3 className="border-t border-line-soft pb-3 pt-6 text-[16px] font-semibold">Inherited assets</h3>
                <ul className="flex flex-col gap-3">
                  {inheritedAssets.map((a) => (
                    <li key={a} className="flex items-center gap-3 text-[14.5px] text-ink-2">
                      <CheckCircle size={17} />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          }
        />
      }
      strip={<EstimatedStrip />}
    >
      <div className="p-8">
        <div className="flex items-center gap-4">
          <h1 className="text-[32px] font-bold tracking-tight">Production brief</h1>
          <span className="flex items-center gap-2 rounded-full border border-accent-border bg-accent-soft px-3.5 py-1.5 text-[13.5px] font-medium text-accent">
            <CheckCircle size={15} className="text-accent" />
            Ready
          </span>
        </div>
        <p className="pt-2 text-[15px] text-ink-2">All required episode information is ready.</p>

        <h2 className="pt-7 text-[19px] font-semibold">
          Episode 05 <span className="px-1.5 text-ink-3">·</span> The Moon Necklace
        </h2>

        <p className="pt-5 text-[14.5px] text-ink-2">Story:</p>
        <p className="max-w-[560px] pt-1.5 text-[15px] leading-relaxed">
          Lumi discovers a moon-shaped necklace beneath the kitchen table.
          When Kai enters, Lumi hides it, but the damaged window reveals that
          someone else has been inside.
        </p>

        <div className="mt-6 max-w-[820px]">
          {briefRows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 border-b border-line-soft py-3.5 last:border-b-0">
              <Icon size={17} className="shrink-0 text-ink-2" />
              <span className="w-[220px] text-[14.5px] text-ink-2">{label}</span>
              <span className="text-[14.5px]">{value}</span>
            </div>
          ))}
        </div>

        <button className="mt-6 flex w-full max-w-[820px] items-center gap-3 rounded-xl border border-line px-4 py-3.5 text-[15px] transition-colors hover:bg-raised">
          <ChevronDown className="text-ink-3" />
          View original episode input
        </button>
      </div>
    </AppShell>
  )
}
