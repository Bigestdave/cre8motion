// Shared production pipeline metadata.
export const STAGE_ORDER = [
  'QUEUED', 'CREATED', 'NORMALIZING_INPUT', 'PLANNING', 'PLAN_VALIDATION', 'REFERENCE_RESOLUTION',
  'SHOT_PLANNING', 'STORYBOARD_GENERATION', 'STORYBOARD_QC', 'KEYFRAME_GENERATION', 'KEYFRAME_QC',
  'VIDEO_GENERATION', 'VIDEO_QC', 'AUDIO_GENERATION', 'ASSEMBLY', 'FINAL_QC', 'READY_FOR_REVIEW',
]

export function stageProgress(stage?: string | null): number {
  const idx = STAGE_ORDER.indexOf((stage || '').toUpperCase())
  if (idx < 0) return 0
  return Math.round((idx / (STAGE_ORDER.length - 1)) * 100)
}

export function stageScreen(stage?: string | null): string {
  const s = (stage || '').toUpperCase()
  if (s.startsWith('STORYBOARD')) return '/storyboards'
  if (s.startsWith('KEYFRAME')) return '/keyframes'
  if (s.startsWith('VIDEO') || s === 'ANIMATION') return '/animation'
  if (s.startsWith('AUDIO')) return '/audio'
  if (s === 'ASSEMBLY') return '/assembly'
  if (s === 'FINAL_QC' || s === 'READY_FOR_REVIEW') return '/final-review'
  return '/plan'
}

export function prettyStage(stage?: string | null): string {
  if (!stage) return 'Starting'
  return stage.charAt(0) + stage.slice(1).toLowerCase().replace(/_/g, ' ')
}
