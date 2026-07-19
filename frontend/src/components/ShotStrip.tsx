import { useEffect, useState, type ReactNode } from 'react'

import { getArtifactDownloadUrl } from '../data/api'
import { shots as fixtureShots, shotGradients, type ShotStatus } from '../data/shots'
import { StatusIcon } from './StatusIcon'

export interface StripShot {
  id: string
  sequence_number?: number
  story_function?: string
  duration_seconds?: number
  approved_storyboard_artifact_id?: string | null
  approved_keyframe_artifact_id?: string | null
  approved_video_artifact_id?: string | null
}

const fallbackShots: StripShot[] = fixtureShots.map((shot, index) => ({
  id: shot.id,
  sequence_number: index + 1,
  story_function: shot.name,
  duration_seconds: shot.sec,
}))

function shotLabel(shot: StripShot) {
  return shot.sequence_number ? `S${String(shot.sequence_number).padStart(2, '0')}` : shot.id
}

function shotTime(shot: StripShot) {
  return `00:${String(Math.round(shot.duration_seconds || 0)).padStart(2, '0')}`
}

export function Thumb({
  shotId,
  artifactId,
  className = '',
}: {
  shotId: string
  artifactId?: string | null
  className?: string
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const artifactUrl = getArtifactDownloadUrl(artifactId)

  useEffect(() => setImageFailed(false), [artifactUrl])

  return (
    <div
      className={`overflow-hidden rounded-md ${className}`}
      style={{ background: shotGradients[shotId] ?? shotGradients.S01 }}
      role="img"
      aria-label={`${shotId} thumbnail`}
    >
      {artifactUrl && !imageFailed && (
        <img
          src={artifactUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      )}
    </div>
  )
}

export type StripStatuses = Record<string, ShotStatus>

interface TextStripProps {
  shots?: StripShot[]
  statuses: StripStatuses
  selected?: string
  onSelect?: (id: string) => void
}

/** Text-only strip cards (Plan screen): shot / narrative function / duration. */
export function TextShotStrip({ shots = fallbackShots, statuses, selected, onSelect }: TextStripProps) {
  return (
    <div className="grid grid-cols-8 gap-3">
      {shots.map((shot) => {
        const isSelected = selected === shot.id
        return (
          <button
            key={shot.id}
            onClick={() => onSelect?.(shot.id)}
            className={`rounded-lg border p-4 text-left transition-all ${
              isSelected ? 'border-accent bg-selected' : 'border-line-soft bg-surface hover:border-line'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-semibold">{shotLabel(shot)}</span>
              <StatusIcon status={statuses[shot.id] ?? 'pending'} size={16} />
            </div>
            <p className="mt-3 truncate text-[13.5px] text-ink-2">{shot.story_function || 'Untitled shot'}</p>
            <p className="mt-1 text-[13.5px] text-ink-3">{shot.duration_seconds || 0} sec</p>
          </button>
        )
      })}
    </div>
  )
}

interface ThumbStripProps {
  shots?: StripShot[]
  statuses: StripStatuses
  selected?: string
  onSelect?: (id: string) => void
  /** 'name-time': label + 00:0X · 'time': 00:0X · 'name-sec': label + N sec · 'plain': duration only */
  variant?: 'name-time' | 'time' | 'name-sec' | 'plain'
  footer?: (shotId: string) => ReactNode
  caption?: (shotId: string) => ReactNode
}

/** Thumbnail strip cards used by production stages. Uses API shots when supplied. */
export function ThumbShotStrip({ shots = fallbackShots, statuses, selected, onSelect, variant = 'name-time', footer, caption }: ThumbStripProps) {
  return (
    <div className="grid grid-cols-8 gap-3">
      {shots.map((shot) => {
        const isSelected = selected === shot.id
        const artifactId = shot.approved_video_artifact_id || shot.approved_keyframe_artifact_id || shot.approved_storyboard_artifact_id
        return (
          <button
            key={shot.id}
            onClick={() => onSelect?.(shot.id)}
            className={`relative rounded-lg border p-[5px] pb-2 text-left transition-all ${
              isSelected
                ? 'border-2 border-accent bg-selected'
                : 'border border-line-soft bg-surface hover:border-line'
            }`}
          >
            <Thumb
              shotId={shotLabel(shot)}
              artifactId={artifactId}
              className="mb-2.5 aspect-[16/10] w-full rounded-md border border-line-soft"
            />

            <div className="flex items-center justify-between px-1">
              <span className="text-[15px] font-normal text-ink">{shotLabel(shot)}</span>
              <StatusIcon status={statuses[shot.id] ?? 'pending'} size={14} />
            </div>

            <div className="px-1 pt-1 text-[13px] leading-tight text-ink-4">
              {variant === 'name-time' && (
                <>
                  <p className="truncate text-ink-3">{shot.story_function || 'Untitled shot'}</p>
                  <p className="pt-0.5">{shotTime(shot)}</p>
                </>
              )}
              {variant === 'time' && <p>{shotTime(shot)}</p>}
              {variant === 'name-sec' && (
                <>
                  <p className="truncate text-ink-3">{shot.story_function || 'Untitled shot'}</p>
                  <p className="pt-0.5">{shot.duration_seconds || 0} sec</p>
                </>
              )}
              {variant === 'plain' && <p>{shot.duration_seconds || 0} sec</p>}
            </div>
            {caption?.(shot.id)}
            {footer?.(shot.id)}
          </button>
        )
      })}
    </div>
  )
}

