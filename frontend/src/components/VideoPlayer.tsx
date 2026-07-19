import { useState } from 'react'

import { getArtifactDownloadUrl } from '../data/api'
import { Thumb } from './ShotStrip'
import { Play, Pause, VolumeIcon, FullscreenIcon } from './icons'

interface VideoPlayerProps {
  shotId: string
  artifactId?: string | null
  current?: string
  total?: string
  /** 0..100 played percentage */
  progress?: number
  overlayLabel?: string
  aspect?: string
}

export function VideoPlayer({
  shotId,
  artifactId,
  current = '00:02',
  total = '00:05',
  progress = 45,
  overlayLabel,
  aspect = 'aspect-[16/8.2]',
}: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const videoUrl = getArtifactDownloadUrl(artifactId)

  return (
    <div className="overflow-hidden rounded-xl bg-black">
      <div className={`relative ${aspect} w-full`}>
        {videoUrl && !videoFailed ? (
          <video
            src={videoUrl}
            controls
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setVideoFailed(true)}
          />
        ) : (
          <Thumb shotId={shotId} className="absolute inset-0 h-full w-full rounded-none" />
        )}
        {overlayLabel && (
          <p className="absolute left-5 top-4 text-[15px] font-semibold drop-shadow">{overlayLabel}</p>
        )}
      </div>
      <div className="flex items-center gap-4 px-4 py-3">
        <button
          onClick={() => setPlaying(!playing)}
          className="text-ink transition-colors hover:text-accent"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <span className="text-[13.5px] tabular-nums">
          <span className="text-accent">{current}</span>
          <span className="text-ink-3"> / {total}</span>
        </span>
        <div className="relative h-[5px] flex-1 rounded-full bg-raised-2">
          <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
          <span
            className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-ink"
            style={{ left: `calc(${progress}% - 7px)` }}
          />
        </div>
        <button className="text-ink-2 transition-colors hover:text-ink" aria-label="Volume"><VolumeIcon /></button>
        <button className="text-ink-2 transition-colors hover:text-ink" aria-label="Fullscreen"><FullscreenIcon /></button>
      </div>
    </div>
  )
}
