import { useState } from 'react'
import { AppShell } from '../components/AppShell'
import { RightPanel, KV, ScoreBar } from '../components/RightPanel'
import { ThumbShotStrip, type StripStatuses } from '../components/ShotStrip'
import { VideoPlayer } from '../components/VideoPlayer'
import { ExportModal } from '../components/ExportModal'
import { shots } from '../data/shots'

const statuses: StripStatuses = Object.fromEntries(shots.map((s) => [s.id, 'approved'])) as StripStatuses

export function FinalReviewScreen() {
  const [selected, setSelected] = useState('S06')
  const [exportOpen, setExportOpen] = useState(false)

  return (
    <>
      <AppShell
        active="Final review"
        topBarStatus="Ready for review"
        showElapsed={false}
        showPause={false}
        panel={
          <RightPanel
            tabs={['Overview', 'Quality', 'Continuity', 'Production']}
            render={(tab) =>
              tab === 'Overview' ? (
                <div>
                  <p className="pb-1 text-[16px] font-semibold">Final quality</p>
                  <ScoreBar label="" score={91} />
                  <ScoreBar label="Character consistency" score={94} />
                  <ScoreBar label="Motion accuracy" score={87} />
                  <ScoreBar label="Technical quality" score={96} />

                  <h3 className="border-t border-line-soft pb-2 pt-6 text-[16px] font-semibold">Production summary</h3>
                  <KV label="Duration" value="00:45" />
                  <KV label="Budget used" value={<span><span className="font-medium text-accent">84</span>/100</span>} />
                  <KV label="Retries" value="2" />
                  <KV label="Format" value={<>1080 × 1920 <span className="px-1 text-ink-3">·</span> MP4</>} />

                  <div className="mt-7 flex flex-col gap-3">
                    <button className="w-full rounded-xl border border-line py-3.5 text-[15px] font-medium transition-colors hover:bg-raised">
                      Request changes
                    </button>
                    <button
                      onClick={() => setExportOpen(true)}
                      className="w-full rounded-xl bg-ink py-3.5 text-[15px] font-semibold text-app transition-colors hover:bg-ink-2"
                    >
                      Approve episode
                    </button>
                  </div>
                </div>
              ) : null
            }
          />
        }
        strip={<ThumbShotStrip statuses={statuses} selected={selected} onSelect={setSelected} variant="name-time" />}
      >
        <div className="p-8">
          <h1 className="text-[32px] font-bold tracking-tight">Final review</h1>
          <p className="pt-2 text-[15px] text-ink-2">Review the complete episode before approval.</p>

          <div className="mt-6">
            <VideoPlayer shotId={selected} current="00:28" total="00:45" progress={62} />
          </div>

          <div className="mt-6 grid grid-cols-8 gap-3">
            {shots.map((s) => {
              const isSel = s.id === selected
              return (
                <button
                  key={s.id}
                  onClick={() => setSelected(s.id)}
                  className={`flex flex-col items-center gap-2 rounded-xl border py-4 transition-colors ${
                    isSel ? 'border-accent' : 'border-line-soft bg-raised hover:border-line'
                  }`}
                >
                  <span className="text-[16px] font-semibold">{s.num}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                </button>
              )
            })}
          </div>
        </div>
      </AppShell>

      {exportOpen && <ExportModal onClose={() => setExportOpen(false)} />}
    </>
  )
}
