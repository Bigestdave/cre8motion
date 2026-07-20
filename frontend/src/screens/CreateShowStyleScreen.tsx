import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { WizardShell, WizardTitle, Field, TextInput, TextArea } from '../components/WizardShell'
import { Thumb } from '../components/ShotStrip'

const styles = [
  {
    id: '3d',
    title: 'Polished 3D',
    lines: ['Soft cinematic lighting', 'Expressive characters'],
    thumbId: 'S06',
    recommended: true,
  },
  {
    id: 'storybook',
    title: 'Illustrated Storybook',
    lines: ['Textured, expressive', 'hand-crafted feeling'],
    thumbId: 'S01',
    recommended: false,
  },
]

/** creative_direction may arrive as a string or an object like {colors: "..."} — render it as text either way. */
function creativeDirectionText(cd: unknown): string {
  if (!cd) return ''
  if (typeof cd === 'string') return cd
  if (typeof cd === 'object') {
    const vals = Object.values(cd as Record<string, unknown>).filter((v) => typeof v === 'string')
    return vals.join('. ')
  }
  return ''
}

export function CreateShowStyleScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  
  // The proposal object from the previous screen
  const initialProposal = location.state?.proposal || {}
  
  const [selectedStyle, setSelectedStyle] = useState('3d')
  const [proposal, setProposal] = useState({
    title: initialProposal.title || '',
    premise: initialProposal.premise || '',
    visual_style: initialProposal.visual_style || { creative_direction: {} },
    characters: initialProposal.characters || []
  })

  // Preselect style if it matches
  useEffect(() => {
    if (proposal.visual_style?.animation_style?.toLowerCase().includes('storybook')) {
      setSelectedStyle('storybook')
    }
  }, [proposal])

  const handleContinue = () => {
    // Merge the selected base style into the proposal before passing it on.
    const styleTitle = styles.find((s) => s.id === selectedStyle)?.title || 'Polished 3D'
    const merged = {
      ...proposal,
      visual_style: { ...proposal.visual_style, animation_style: styleTitle },
    }
    navigate('/create-show/characters', { state: { proposal: merged } })
  }

  return (
    <WizardShell
      step={2}
      footerLeft={
        <Link
          to="/create-show"
          className="rounded-lg border border-line bg-raised px-6 py-3 text-[15px] font-medium transition-colors hover:bg-raised-2"
        >
          Back
        </Link>
      }
      footerRight={
        <button
          onClick={handleContinue}
          className="flex items-center gap-2.5 rounded-lg bg-ink px-6 py-3 text-[15px] font-medium text-app transition-colors hover:bg-ink-2"
        >
          Continue
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M4 10h12M11 4.5L16.5 10 11 15.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      }
    >
      <WizardTitle title="Review show concept" subtitle="The AI has drafted your show universe. You can edit the details below." />
      <div className="mx-auto max-w-[820px] px-6">
        
        <div className="mx-auto max-w-[680px] pb-8">
          <Field label="Show Title">
            <TextInput 
              value={proposal.title}
              onChange={(v) => setProposal({...proposal, title: v})}
            />
          </Field>
          <Field label="Premise">
            <TextArea 
              value={proposal.premise}
              onChange={(v) => setProposal({...proposal, premise: v})}
              rows={4}
            />
          </Field>
          <Field label="Creative Direction">
            <TextArea
              value={creativeDirectionText(proposal.visual_style?.creative_direction)}
              onChange={(v) => setProposal({
                ...proposal,
                visual_style: { ...proposal.visual_style, creative_direction: v }
              })}
              rows={3}
            />
          </Field>
        </div>

        <p className="pb-4 text-[14px] text-ink-2 font-medium text-center">Visual Base Style</p>
        <div className="grid grid-cols-2 gap-5 pb-8">
          {styles.map((s) => {
            const isSel = selectedStyle === s.id
            return (
              <button
                key={s.id}
                onClick={() => setSelectedStyle(s.id)}
                className={`relative overflow-hidden rounded-xl border text-left transition-all ${
                  isSel
                    ? 'border-accent shadow-[0_0_0_3px_var(--color-accent-soft)]'
                    : 'border-line-soft bg-surface hover:border-line'
                }`}
              >
                {s.recommended && (
                  <span className="absolute left-3 top-3 z-10 rounded-md bg-accent-medium px-2.5 py-1 text-[12px] font-medium text-accent">
                    Recommended
                  </span>
                )}
                <Thumb shotId={s.thumbId} className="aspect-video w-full rounded-none" />
                <div className="flex items-start justify-between p-5">
                  <div>
                    <p className="text-[17px] font-semibold">{s.title}</p>
                    <p className="pt-1.5 text-[14px] leading-relaxed text-ink-2">
                      {s.lines[0]}<br />{s.lines[1]}
                    </p>
                  </div>
                  <span
                    className={`mt-1 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border transition-colors ${
                      isSel ? 'border-accent bg-accent' : 'border-line-strong'
                    }`}
                  >
                    {isSel && (
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                        <path d="M3.2 7.3l2.6 2.6 5-5.4" stroke="#050505" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </WizardShell>
  )
}

