export type ShotStatus = 'approved' | 'active' | 'warning' | 'generating' | 'pending'

export interface Shot {
  id: string          // S01
  num: string         // 01
  name: string
  description: string
  sec: number
  time: string        // 00:04
  characters: string
  location: string
  camera: string
  action: string
}

export const shots: Shot[] = [
  { id: 'S01', num: '01', name: 'Establishment', description: 'Kitchen exterior at dusk', sec: 4, time: '00:04', characters: 'None', location: 'Kitchen exterior', camera: 'Wide shot · Static', action: 'The kitchen exterior glows at dusk.' },
  { id: 'S02', num: '02', name: 'Relationship', description: 'Lumi searches beneath the table', sec: 5, time: '00:05', characters: 'Lumi', location: 'Kitchen', camera: 'Medium shot · Pan', action: 'Lumi searches beneath the table.' },
  { id: 'S03', num: '03', name: 'Disruption', description: 'The moon necklace is discovered', sec: 5, time: '00:05', characters: 'Lumi', location: 'Kitchen', camera: 'Close-up · Static', action: 'The moon necklace is discovered.' },
  { id: 'S04', num: '04', name: 'Discovery', description: 'Light reveals the damaged window', sec: 6, time: '00:06', characters: 'Lumi', location: 'Kitchen', camera: 'Wide frame · Character left', action: 'Light reveals the damaged window.' },
  { id: 'S05', num: '05', name: 'Reaction', description: 'Lumi hears Kai approaching', sec: 5, time: '00:05', characters: 'Lumi', location: 'Kitchen', camera: 'Medium close-up · Static', action: 'Lumi hears Kai approaching.' },
  { id: 'S06', num: '06', name: 'Decision', description: 'Lumi hides the necklace', sec: 5, time: '00:05', characters: 'Lumi', location: 'Kitchen', camera: 'Medium close-up · Slow push-in', action: 'Lumi lowers the necklace and steps backward as Kai approaches.' },
  { id: 'S07', num: '07', name: 'Reversal', description: 'Kai notices the broken glass', sec: 7, time: '00:07', characters: 'Kai', location: 'Kitchen', camera: 'Medium shot · Static', action: 'Kai notices the broken glass.' },
  { id: 'S08', num: '08', name: 'Resolution', description: 'Both characters look toward the window', sec: 8, time: '00:08', characters: 'Lumi · Kai', location: 'Kitchen', camera: 'Wide shot · Static', action: 'Both characters look toward the window.' },
]

/* Warm placeholder gradients per shot (swap for real thumbnails in /public/shots/sXX.jpg) */
export const shotGradients: Record<string, string> = {
  S01: 'linear-gradient(135deg, #3d2a1e 0%, #1a1410 55%, #573c1f 100%)',
  S02: 'linear-gradient(135deg, #2a1c12 0%, #402a16 60%, #14100c 100%)',
  S03: 'linear-gradient(135deg, #46301c 0%, #211710 50%, #33241a 100%)',
  S04: 'linear-gradient(135deg, #1e1a14 0%, #4a3421 65%, #191410 100%)',
  S05: 'linear-gradient(135deg, #382417 0%, #191210 45%, #443019 100%)',
  S06: 'linear-gradient(135deg, #241a12 0%, #503722 60%, #1c1510 100%)',
  S07: 'linear-gradient(135deg, #2e2015 0%, #17120e 50%, #3e2c1c 100%)',
  S08: 'linear-gradient(135deg, #42301d 0%, #241a12 55%, #191310 100%)',
}

export const sidebarSteps = [
  'Brief', 'Plan', 'References', 'Storyboards', 'Keyframes',
  'Animation', 'Audio', 'Assembly', 'Final review',
] as const

export type StepName = (typeof sidebarSteps)[number]
