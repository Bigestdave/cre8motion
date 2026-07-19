import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { WizardShell, WizardTitle } from '../components/WizardShell'
import { Ellipsis } from '../components/icons'
import { UploadCloud, PlusIcon } from '../components/icons2'
import { createShow, createCharacter } from '../data/api'

export function CreateShowCharactersScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  
  const initialProposal = location.state?.proposal || {}
  const [proposal, setProposal] = useState({
    ...initialProposal,
    characters: initialProposal.characters || []
  })

  const handleUpdateChar = (index: number, field: string, value: string) => {
    const chars = [...proposal.characters]
    chars[index] = { ...chars[index], [field]: value }
    setProposal({ ...proposal, characters: chars })
  }

  const handleCreateShow = async () => {
    setLoading(true)
    try {
      // 1. Create Show
      const show = await createShow(proposal)
      
      // 2. Create Characters
      for (const char of proposal.characters) {
        await createCharacter(show.id, char)
      }
      
      // 3. Navigate to show overview
      navigate(`/show/${show.id}`)
    } catch (err) {
      console.error(err)
      alert("Failed to create show")
      setLoading(false)
    }
  }

  return (
    <WizardShell
      step={3}
      footerLeft={
        <Link
          to="/create-show/style"
          state={{ proposal }}
          className="rounded-lg border border-line bg-raised px-6 py-3 text-[15px] font-medium transition-colors hover:bg-raised-2"
        >
          Back
        </Link>
      }
      footerRight={
        <button
          onClick={handleCreateShow}
          disabled={loading}
          className="flex items-center gap-2.5 rounded-lg bg-ink px-6 py-3 text-[15px] font-medium text-app transition-colors hover:bg-ink-2 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create show'}
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M4 10h12M11 4.5L16.5 10 11 15.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      }
    >
      <WizardTitle
        title="Introduce your main characters"
        subtitle="Strong references help Cre8Motion preserve identity across scenes and episodes."
      />
      <div className="mx-auto max-w-[1080px] px-6">
        
        {proposal.characters.map((char: any, idx: number) => (
          <div key={idx} className="rounded-xl border border-line-soft bg-surface p-6 mb-8">
            <div className="flex items-center justify-between pb-5">
              <p className="text-[16px] font-semibold">Character 0{idx + 1}</p>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-3 transition-colors hover:bg-raised" aria-label="More">
                <Ellipsis size={15} />
              </button>
            </div>

            <div className="grid grid-cols-[1fr_440px] gap-8">
              {/* Left: upload + reference thumbs */}
              <div>
                <button className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong py-9 transition-colors hover:border-accent-border">
                  <UploadCloud className="text-ink-2" />
                  <p className="text-[15px] font-medium">Upload references</p>
                  <p className="text-[13.5px] text-ink-2">
                    Drag images here or <span className="text-accent">choose files</span>
                  </p>
                  <p className="text-[12.5px] text-ink-3">JPG or PNG</p>
                </button>
              </div>

              {/* Right: name, description */}
              <div>
                <p className="pb-2 text-[14px] text-ink-2">Name</p>
                <input
                  value={char.name}
                  onChange={(e) => handleUpdateChar(idx, 'name', e.target.value)}
                  className="w-full rounded-lg border border-line bg-transparent px-4 py-3 text-[15px] outline-none transition-colors focus:border-accent-border"
                />

                <p className="pb-2 pt-5 text-[14px] text-ink-2">Description</p>
                <textarea
                  rows={5}
                  value={char.canonical_description}
                  onChange={(e) => handleUpdateChar(idx, 'canonical_description', e.target.value)}
                  className="w-full resize-y rounded-lg border border-line bg-transparent px-4 py-3 text-[15px] leading-relaxed outline-none transition-colors focus:border-accent-border"
                />
              </div>
            </div>
          </div>
        ))}

        <button 
          onClick={() => setProposal({...proposal, characters: [...proposal.characters, {name: '', canonical_description: ''}]})}
          className="mt-5 flex items-center gap-2.5 text-[14.5px] text-ink-2 transition-colors hover:text-ink"
        >
          <PlusIcon size={15} />
          <span className="border-b border-dashed border-ink-3 pb-0.5">Add another character</span>
        </button>
      </div>
    </WizardShell>
  )
}

