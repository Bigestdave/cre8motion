import { AppShell } from '../components/AppShell'
import { RightPanel, KV } from '../components/RightPanel'
import { ThumbShotStrip, Thumb, type StripStatuses } from '../components/ShotStrip'
import { Waveform } from '../components/Waveform'
import { Checklist } from '../components/Checklist'
import { MusicNote, ChevronRight, DocIcon } from '../components/icons'
import { shots } from '../data/shots'

const statuses: StripStatuses = Object.fromEntries(shots.map((s) => [s.id, 'approved'])) as StripStatuses

export function AssemblyScreen() {
  return (
    <AppShell
      active="Assembly"
      panel={
        <RightPanel
          render={(tab) =>
            tab === 'Details' ? (
              <div>
                <h2 className="pb-4 text-[18px] font-semibold">Output</h2>
                <KV label="Resolution" value="1080 × 1920" />
                <KV label="Frame rate" value="24 fps" />
                <KV label="Format" value={<>MP4 <span className="px-1 text-ink-3">·</span> H.264</>} />
                <KV label="Duration" value="00:45" />
                <KV label="Audio" value={<>AAC <span className="px-1 text-ink-3">·</span> Stereo</>} />
                <KV label="Estimated size" value="62 MB" />

                <button className="mt-9 flex w-full items-center justify-between rounded-xl border border-line px-4 py-3.5 text-[15px] transition-colors hover:bg-raised">
                  <span className="flex items-center gap-3">
                    <DocIcon className="text-ink-2" />
                    View encoding details
                  </span>
                  <ChevronRight className="text-ink-3" />
                </button>
              </div>
            ) : null
          }
        />
      }
      strip={<ThumbShotStrip statuses={statuses} variant="name-time" />}
    >
      <div className="p-8">
        <h1 className="text-[32px] font-bold tracking-tight">Assembling final episode</h1>
        <p className="pt-2 text-[15px] text-ink-2">Cre8Motion is combining the approved video and audio.</p>

        <div className="mt-7 flex items-end justify-between">
          <p className="text-[13px] font-semibold tracking-[0.1em] text-ink-3">VIDEO</p>
          <p className="text-[14.5px] font-medium">00:45 total</p>
        </div>

        <div className="mt-3 flex overflow-hidden rounded-lg border border-line-soft">
          {shots.map((s) => (
            <div key={s.id} className="relative min-w-0 border-r border-line-soft last:border-r-0" style={{ flex: s.sec }}>
              <Thumb shotId={s.id} className="h-[104px] w-full rounded-none" />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-4">
                <p className="text-[12.5px] font-semibold">{s.id}</p>
                <p className="text-[11.5px] text-ink-2">{s.time}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[13px] text-ink-3">
          <span>00:00</span><span>00:15</span><span>00:30</span><span>00:45</span>
        </div>

        <p className="pt-6 text-[13px] font-semibold tracking-[0.1em] text-ink-3">AUDIO</p>
        <div className="relative mt-3 rounded-xl border border-line-soft bg-raised px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex w-[130px] shrink-0 items-center gap-3">
              <MusicNote size={16} className="text-ink-2" />
              <span className="text-[14.5px]">Master mix</span>
            </div>
            <div className="min-w-0 flex-1">
              <Waveform seed={31} height={42} bars={200} />
            </div>
          </div>
          {/* playhead at 00:22 (~49%) */}
          <span className="absolute top-[-10px] bottom-[-4px] left-[49%] w-px bg-ink">
            <span className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-ink" />
          </span>
        </div>
        <p className="pt-2 text-center text-[13px] text-ink-2" style={{ paddingRight: '2%' }}>00:22</p>

        <div className="mt-6 grid grid-cols-2 gap-8 border-t border-line-soft pt-6">
          <Checklist
            items={[
              { label: 'Video clips normalized', state: 'done' },
              { label: 'Sound effects aligned', state: 'done' },
              { label: 'Episode audio mixed', state: 'done' },
            ]}
          />
          <Checklist
            items={[
              { label: 'Encoding final MP4', state: 'active' },
              { label: 'Running final technical review', state: 'todo' },
            ]}
          />
        </div>
      </div>
    </AppShell>
  )
}
