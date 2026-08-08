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
  /** Override the outer wrapper — use to constrain width so the portrait aspect fits on screen */
  className?: string
}

export function VideoPlayer({
  shotId,
  artifactId,
  current = '00:02',
  total = '00:05',
  progress = 45,
  overlayLabel,
  aspect = 'aspect-[9/16]',
  className = '',
}: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const videoUrl = getArtifactDownloadUrl(artifactId)

  return (
    <div className={`overflow-hidden rounded-xl bg-black ${className}`}>
      <div className={`relative ${aspect} w-full`}>
        {videoUrl && !videoFailed ? (
          <video
            src={videoUrl}
            className="absolute inset-0 h-full w-full object-contain"
            onError={() => setVideoFailed(true)}
          />
        ) : (
          <Thumb shotId={shotId} className="absolute inset-0 h-full w-full rounded-none" />
        )}
        {overlayLabel && (
          <p className="absolute left-4 top-3 rounded-md bg-black/40 px-2.5 py-1 text-[13px] font-medium backdrop-blur-sm">{overlayLabel}</p>
        )}
      </div>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button
          onClick={() => setPlaying(!playing)}
          className="text-ink transition-colors hover:text-accent"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <span className="text-[12.5px] tabular-nums">
          <span className="text-accent">{current}</span>
          <span className="text-ink-3"> / {total}</span>
        </span>
        <div className="relative h-[4px] flex-1 rounded-full bg-raised-2">
          <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
          <span
            className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-ink"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>
        <button className="text-ink-2 transition-colors hover:text-ink" aria-label="Volume"><VolumeIcon /></button>
        <button className="text-ink-2 transition-colors hover:text-ink" aria-label="Fullscreen"><FullscreenIcon /></button>
      </div>
    </div>
  )
}
