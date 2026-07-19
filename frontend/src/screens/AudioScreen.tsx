import { AppShell } from '../components/AppShell'
import { RightPanel, KV } from '../components/RightPanel'
import { ThumbShotStrip, type StripStatuses } from '../components/ShotStrip'
import { Waveform } from '../components/Waveform'
import { Checklist } from '../components/Checklist'
import { MusicNote, LeafIcon, FaceIcon, BoltIcon, SlidersIcon, ChevronDown, Spinner } from '../components/icons'

const statuses: StripStatuses = {
  S01: 'approved', S02: 'approved', S03: 'approved', S04: 'approved',
  S05: 'approved', S06: 'active', S07: 'pending', S08: 'pending',
}

const tracks = [
  { icon: MusicNote, label: 'Music', wave: <Waveform seed={11} height={40} /> },
  { icon: LeafIcon, label: 'Environment', wave: <Waveform seed={23} height={40} color="#6d726b" envelope={false} /> },
  { icon: FaceIcon, label: 'Expressions', wave: <Waveform seed={37} height={40} mode="sparse" bars={120} /> },
  { icon: BoltIcon, label: 'Sound effects', wave: <Waveform seed={53} height={40} mode="sparse" bars={120} color="#f2f4f0" /> },
]

function LayerIcons() {
  return (
    <div className="mt-2 flex items-center justify-between border-t border-line-soft px-1 pt-2 text-ink-3">
      <MusicNote size={12} />
      <LeafIcon size={12} />
      <FaceIcon size={12} />
      <Spinner size={11} className="text-ink-3" />
      <BoltIcon size={12} />
    </div>
  )
}

export function AudioScreen() {
  return (
    <AppShell
      active="Audio"
      panel={
        <RightPanel
          render={(tab) =>
            tab === 'Details' ? (
              <div>
                <h2 className="pb-4 text-[18px] font-semibold">Audio profile</h2>
                <KV label="Mode" value="Non-verbal expression" />
                <KV label="Target loudness" value="-14 LUFS" />
                <KV label="Music ducking" value="Enabled" />
                <KV label="Dialogue" value="None" />
                <KV label="Duration" value="00:45" />

                <button className="mt-9 flex w-full items-center justify-between rounded-xl border border-line px-4 py-3.5 text-[15px] transition-colors hover:bg-raised">
                  <span className="flex items-center gap-3">
                    <SlidersIcon className="text-ink-2" />
                    Advanced audio details
                  </span>
                  <ChevronDown className="text-ink-3" />
                </button>
              </div>
            ) : null
          }
        />
      }
      strip={<ThumbShotStrip statuses={statuses} selected="S06" variant="time" footer={() => <LayerIcons />} />}
    >
      <div className="p-8">
        <h1 className="text-[32px] font-bold tracking-tight">Audio production</h1>
        <p className="pt-2 text-[15px] text-ink-2">Cre8Motion is preparing the episode mix.</p>

        <div className="mt-7 flex items-end justify-between">
          <p className="text-[16px] font-semibold">Episode mix</p>
          <p className="text-[14.5px] text-ink-2">00:45 total</p>
        </div>

        <div className="mt-3 flex justify-between border-b border-line-soft pb-2 text-[13px] text-ink-3">
          <span>00:00</span><span>00:15</span><span>00:30</span><span>00:45</span>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {tracks.map(({ icon: Icon, label, wave }) => (
            <div key={label} className="flex items-center gap-4 rounded-xl border border-line-soft bg-raised px-4 py-3">
              <div className="flex w-[150px] shrink-0 items-center gap-3">
                <Icon size={16} className="text-ink-2" />
                <span className="text-[14.5px]">{label}</span>
              </div>
              <div className="min-w-0 flex-1">{wave}</div>
            </div>
          ))}
        </div>

        <div className="mt-7 grid grid-cols-2 gap-8">
          <Checklist
            items={[
              { label: 'Music prepared', state: 'done' },
              { label: 'Environment track prepared', state: 'done' },
              { label: 'Sound effects aligned', state: 'done' },
            ]}
          />
          <Checklist
            items={[
              { label: 'Generating character expressions', state: 'active' },
              { label: 'Mixing episode audio', state: 'todo' },
              { label: 'Validating final loudness', state: 'todo' },
            ]}
          />
        </div>
      </div>
    </AppShell>
  )
}
