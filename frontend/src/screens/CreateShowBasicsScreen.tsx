import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WizardShell, WizardTitle, Field, TextInput, TextArea, SelectInput } from '../components/WizardShell'
import { generateShowProposal } from '../data/api'

export function CreateShowBasicsScreen() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    genre: 'Relationship drama',
    animation_style: 'Polished 3D',
    tone: 'Dramatic with comedic justice',
    target_audience: 'Global short-form viewers',
    default_duration_seconds: 45,
    idea_seed: ''
  })

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
        <Field label="Idea Seed">
          <TextArea 
            value={formData.idea_seed}
            onChange={(v) => setFormData({...formData, idea_seed: v})}
            placeholder="e.g. A fruit character gets blamed for something they didn't do" 
            rows={4} 
          />
        </Field>
        
        <div className="grid grid-cols-2 gap-6">
          <Field label="Genre">
            <TextInput 
              value={formData.genre} 
              onChange={(v) => setFormData({...formData, genre: v})} 
            />
          </Field>
          <Field label="Tone">
            <TextInput 
              value={formData.tone} 
              onChange={(v) => setFormData({...formData, tone: v})} 
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Field label="Animation Style">
            <TextInput 
              value={formData.animation_style} 
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
      </div>
    </WizardShell>
  )
}

