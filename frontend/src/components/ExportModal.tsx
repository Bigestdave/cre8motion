import { useState } from 'react'
import { CloseIcon, ChevronDown, CheckCircleSolid } from './icons'

interface ExportModalProps {
  onClose: () => void
}

function Checkbox({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <button onClick={onChange} className="flex items-center gap-3 py-1.5 text-[15px]">
      <span
        className={`flex h-[18px] w-[18px] items-center justify-center rounded-[4px] border transition-colors ${
          checked ? 'border-accent bg-accent' : 'border-line bg-transparent'
        }`}
      >
        {checked && (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.2l2.4 2.4 4.6-5" stroke="#101300" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </button>
  )
}

function Select({ value }: { value: string }) {
  return (
    <button className="flex w-full items-center justify-between rounded-lg border border-line bg-raised px-4 py-2.5 text-[15px] transition-colors hover:border-ink-3">
      {value}
      <ChevronDown className="text-ink-3" />
    </button>
  )
}

export function ExportModal({ onClose }: ExportModalProps) {
  const [include, setInclude] = useState({ video: true, thumbnail: true, storyboard: false, report: false })
  const [exported, setExported] = useState(false)
  const toggle = (k: keyof typeof include) => setInclude((p) => ({ ...p, [k]: !p[k] }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={onClose}>
      <div className="flex w-[430px] flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        {!exported ? (
          <div className="rounded-2xl border border-line-soft bg-[#141514] p-7 shadow-2xl">
            <div className="flex items-start justify-between">
              <h2 className="text-[22px] font-bold">Export Episode 05</h2>
              <button onClick={onClose} className="mt-1 text-ink-2 transition-colors hover:text-ink" aria-label="Close">
                <CloseIcon />
              </button>
            </div>
            <p className="pt-1.5 text-[14.5px] text-ink-2">Choose what to include in your export.</p>

            <div className="flex items-center gap-4 pt-6">
              <span className="w-[90px] text-[14.5px] text-ink-2">Resolution</span>
              <Select value="1080 × 1920" />
            </div>
            <div className="flex items-center gap-4 pt-3">
              <span className="w-[90px] text-[14.5px] text-ink-2">Format</span>
              <Select value="MP4 · H.264" />
            </div>

            <p className="pt-5 text-[14.5px] text-ink-2">Include</p>
            <div className="flex flex-col pt-1">
              <Checkbox checked={include.video} label="Final video" onChange={() => toggle('video')} />
              <Checkbox checked={include.thumbnail} label="Thumbnail" onChange={() => toggle('thumbnail')} />
              <Checkbox checked={include.storyboard} label="Storyboard" onChange={() => toggle('storyboard')} />
              <Checkbox checked={include.report} label="Production report" onChange={() => toggle('report')} />
            </div>

            <button className="mt-5 flex w-full items-center justify-between rounded-xl border border-line px-4 py-3 text-[15px] transition-colors hover:bg-raised">
              Advanced export settings
              <ChevronDown className="text-ink-3" />
            </button>

            <div className="flex justify-end gap-3 pt-6">
              <button onClick={onClose} className="rounded-lg border border-line px-6 py-2.5 text-[15px] font-medium transition-colors hover:bg-raised">
                Cancel
              </button>
              <button
                onClick={() => setExported(true)}
                className="rounded-lg bg-ink px-7 py-2.5 text-[15px] font-semibold text-app transition-colors hover:bg-ink-2"
              >
                Export
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-line-soft bg-[#141514] p-7 text-center shadow-2xl">
            <div className="flex items-center justify-center gap-3">
              <CheckCircleSolid size={26} />
              <h2 className="text-[22px] font-bold">Export ready</h2>
            </div>
            <p className="pt-4 text-[15px]">fruitful-secrets-e05.mp4</p>
            <p className="pt-1 text-[14px] text-ink-2">1080 × 1920 <span className="px-1 text-ink-3">·</span> 62 MB</p>

            <button className="mt-6 flex w-full items-center justify-between rounded-xl border border-line px-4 py-3 text-[15px] transition-colors hover:bg-raised">
              Advanced export settings
              <ChevronDown className="text-ink-3" />
            </button>

            <div className="flex justify-center gap-3 pt-6">
              <button className="flex-1 rounded-lg border border-line px-5 py-2.5 text-[15px] font-medium transition-colors hover:bg-raised">
                Copy share link
              </button>
              <button onClick={onClose} className="flex-1 rounded-lg bg-ink px-5 py-2.5 text-[15px] font-semibold text-app transition-colors hover:bg-ink-2">
                Download
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
