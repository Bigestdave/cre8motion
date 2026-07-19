import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WizardShell, WizardTitle, Field, TextArea, SelectInput } from '../components/WizardShell'
import { generateShowProposal } from '../data/api'

const GENRES = ['Relationship drama', 'Heist thriller', 'Family secrets', 'Underdog sports', 'Workplace comedy', 'Cozy mystery']
const TONES = ['Dramatic with comedic justice', 'Suspenseful and slick', 'Warm and nostalgic', 'Fast and chaotic', 'Deadpan and dry']
const STYLES = ['Polished 3D', 'Cinematic Stylized 3D', 'Painterly 2D', 'Retro cel animation']

const SPARKS: Record<string, string[]> = {
  'Relationship drama': [
    'A fruit character gets blamed for something they didn’t do, and the whole kitchen takes sides',
    'Two rival food-truck owners are forced to share one generator during a city blackout',
  ],
  'Heist thriller': [
    'Three broke animal workers plan to steal a supernatural golden coin from a billionaire bulldog’s vault',
    'A retired safecracker pigeon is pulled back for one last job: her own museum exhibit',
  ],
  'Family secrets': [
    'A curious child spends evenings with a quiet grandparent, uncovering what really happened to the old house',
    'A family recipe book has one page glued shut, and the youngest cousin wants to know why',
  ],
  'Underdog sports': [
    'The worst team in the snail-racing league hires a coach who has never seen a race',
    'A vending-machine robot trains in secret to enter the neighborhood dance-off',
  ],
  'Workplace comedy': [
    'The night shift at a cloud-storage warehouse discovers the boxes actually contain clouds',
    'An office plant gets promoted to manager and takes the job very seriously',
  ],
  'Cozy mystery': [
    'Every morning one item in the bakery display has been moved, and the new apprentice keeps a list',
    'A lighthouse keeper’s cat solves the mystery of the ships that never arrive',
  ],
}

export function CreateShowBasicsScreen() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [sparkIndex, setSparkIndex] = useState(0)
  const [formData, setFormData] = useState({
    genre: 'Relationship drama',
    animation_style: 'Polished 3D',
    tone: 'Dramatic with comedic justice',
    target_audience: 'Global short-form viewers',
    default_duration_seconds: 45,
    idea_seed: ''
  })

  const sparks = useMemo(() => SPARKS[formData.genre] ?? SPARKS['Relationship drama'], [formData.genre])

  const handleSpark = () => {
    const seed = sparks[sparkIndex % sparks.length]
    setSparkIndex(sparkIndex + 1)
    setFormData({ ...formData, idea_seed: seed })
  }

  const handleGenerate = async () => {
    if (!formData.idea_seed) return
    setLoading(true)
    try {
      const proposal = await generateShowProposal(formData)
      // Pass the generated proposal to the next screen
      navigate('/create-show/style', { state: { proposal } })
    } catch (err) {
      console.error(err)
      alert("Failed to generate proposal")
      setLoading(false)
    }
  }

  return (
    <WizardShell
      step={1}
      footerRight={
        <button
          onClick={handleGenerate}
          disabled={loading || !formData.idea_seed}
          className="flex items-center gap-2.5 rounded-lg bg-ink px-6 py-3 text-[15px] font-medium text-app transition-colors hover:bg-ink-2 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Continue'}
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M4 10h12M11 4.5L16.5 10 11 15.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      }
    >
      <WizardTitle title="Give your stories a world" subtitle="Provide a creative seed, and our AI will build the show universe for you." info />
      <div className="mx-auto max-w-[680px] px-6">
        <div className="grid grid-cols-2 gap-6">
          <Field label="Genre">
            <SelectInput
              value={formData.genre}
              options={GENRES}
              onChange={(v) => { setSparkIndex(0); setFormData({...formData, genre: v}) }}
            />
          </Field>
          <Field label="Tone">
            <SelectInput
              value={formData.tone}
              options={TONES}
              onChange={(v) => setFormData({...formData, tone: v})}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Field label="Animation Style">
            <SelectInput
              value={formData.animation_style}
              options={STYLES}
              onChange={(v) => setFormData({...formData, animation_style: v})}
            />
          </Field>
          <Field label="Default episode length">
            <SelectInput
              value={formData.default_duration_seconds.toString()}
              options={['30', '45', '60', '90']}
              onChange={(v) => setFormData({...formData, default_duration_seconds: parseInt(v)})}
            />
          </Field>
        </div>

        <Field label="Idea Seed">
          <TextArea
            value={formData.idea_seed}
            onChange={(v) => setFormData({...formData, idea_seed: v})}
            placeholder="e.g. A fruit character gets blamed for something they didn't do — or press Spark an idea below"
            rows={4}
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[13px] text-ink-4">No idea yet? Pick a genre and tone above, then let the showrunner pitch you one.</p>
            <button
              type="button"
              onClick={handleSpark}
              className="flex shrink-0 items-center gap-2 rounded-lg border border-accent-border px-4 py-2 text-[14px] font-medium text-accent transition-colors hover:bg-accent/10"
            >
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                <path d="M10 2l1.8 4.6L16.5 8l-4.7 1.4L10 14l-1.8-4.6L3.5 8l4.7-1.4L10 2z" fill="currentColor" />
                <path d="M15.5 12.5l.9 2.3 2.1.7-2.1.7-.9 2.3-.9-2.3-2.1-.7 2.1-.7.9-2.3z" fill="currentColor" opacity="0.7" />
              </svg>
              {formData.idea_seed ? 'Spark another' : 'Spark an idea'}
            </button>
          </div>
        </Field>
      </div>
    </WizardShell>
  )
}

