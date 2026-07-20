import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { WizardShell, WizardTitle } from '../components/WizardShell'
import { UploadCloud, PlusIcon } from '../components/icons2'
import {
  createShow,
  createCharacter,
  uploadCharacterReference,
  generateCharacterReference,
  generateShowPoster,
} from '../data/api'

export function CreateShowCharactersScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Reference image files selected per character index (uploaded after the character is created)
  const [refFiles, setRefFiles] = useState<Record<number, File[]>>({})
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({})

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

  const handleRemoveChar = (index: number) => {
    setProposal({ ...proposal, characters: proposal.characters.filter((_: unknown, i: number) => i !== index) })
    setRefFiles((prev) => {
      const next: Record<number, File[]> = {}
      Object.entries(prev).forEach(([k, v]) => {
        const i = Number(k)
        if (i < index) next[i] = v
        else if (i > index) next[i - 1] = v
      })
      return next
    })
  }

  const handleFiles = (index: number, files: FileList | null) => {
    if (!files?.length) return
    const images = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (images.length) setRefFiles((prev) => ({ ...prev, [index]: [...(prev[index] || []), ...images].slice(0, 4) }))
  }

  const handleCreateShow = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Create the show record
      setProgress('Creating show…')
      const show = await createShow(proposal)

      // 2. Create character records (fast, sequential to preserve order)
      const created: Array<{ id: string; name: string; index: number }> = []
      for (let i = 0; i < proposal.characters.length; i++) {
        const char = proposal.characters[i]
        if (!char.name) continue
        const c = await createCharacter(show.id, char)
        created.push({ id: c.id, name: c.name, index: i })
      }

      // 3. Generate/upload all artwork in PARALLEL (each is independent)
      const names = created.filter((c) => !(refFiles[c.index]?.length)).map((c) => c.name)
      setProgress(
        names.length
          ? `wan2.2 is drawing ${names.join(', ')} · qwen-image is painting the poster…`
          : 'Uploading references · qwen-image is painting the poster…',
      )
      const jobs: Promise<unknown>[] = created.map(async (c) => {
        const uploads = refFiles[c.index] || []
        if (uploads.length > 0) {
          for (const file of uploads) {
            await uploadCharacterReference(c.id, file).catch((e) => console.error('upload failed', e))
          }
        } else {
          await generateCharacterReference(c.id).catch((e) => console.error('generation failed', e))
        }
      })
      jobs.push(generateShowPoster(show.id).catch((e) => console.error('poster failed', e)))

      // Don't trap the user: navigate after 25s even if art is still rendering —
      // the show page will pick up images as they finish.
      await Promise.race([
        Promise.allSettled(jobs),
        new Promise((resolve) => setTimeout(resolve, 25000)),
      ])

      // 4. Navigate to show overview
      navigate(`/show/${show.id}`)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to create show. Please try again.')
      setLoading(false)
      setProgress(null)
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
        <div className="flex items-center gap-4">
          {error && <p className="text-[13.5px] text-red-400">{error}</p>}
          {loading && progress && <p className="text-[13.5px] text-accent">{progress}</p>}
          <button
            onClick={handleCreateShow}
            disabled={loading || proposal.characters.length === 0}
            className="flex items-center gap-2.5 rounded-lg bg-ink px-6 py-3 text-[15px] font-medium text-app transition-colors hover:bg-ink-2 disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create show'}
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12M11 4.5L16.5 10 11 15.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      }
    >
      <WizardTitle
        title="Introduce your main characters"
        subtitle="cre8motion will generate reference art for each character with wan2.7 — or upload your own to lock a specific look."
      />
      <div className="mx-auto max-w-[1080px] px-6">

        {proposal.characters.map((char: any, idx: number) => (
          <div key={idx} className="rounded-xl border border-line-soft bg-surface p-6 mb-8">
            <div className="flex items-center justify-between pb-5">
              <p className="text-[16px] font-semibold">Character 0{idx + 1}</p>
              <button
                onClick={() => handleRemoveChar(idx)}
                className="rounded-lg border border-line px-3 py-1.5 text-[13px] text-ink-3 transition-colors hover:bg-raised hover:text-ink"
              >
                Remove
              </button>
            </div>

            <div className="grid grid-cols-[1fr_440px] gap-8">
              {/* Left: upload + reference thumbs */}
              <div>
                <input
                  ref={(el) => { fileInputs.current[idx] = el }}
                  type="file"
                  accept="image/png,image/jpeg"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(idx, e.target.files)}
                />
                <button
                  onClick={() => fileInputs.current[idx]?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    handleFiles(idx, e.dataTransfer.files)
                  }}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong py-9 transition-colors hover:border-accent-border"
                >
                  <UploadCloud className="text-ink-2" />
                  <p className="text-[15px] font-medium">Upload references (optional)</p>
                  <p className="text-[13.5px] text-ink-2">
                    Drag images here or <span className="text-accent">choose files</span>
                  </p>
                  <p className="text-[12.5px] text-ink-3">Leave empty and wan2.7 will generate this character</p>
                </button>
                {(refFiles[idx]?.length ?? 0) > 0 && (
                  <div className="mt-4 flex gap-3">
                    {refFiles[idx].map((file, fi) => (
                      <div key={fi} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="h-20 w-20 rounded-lg border border-line object-cover"
                        />
                        <button
                          onClick={() =>
                            setRefFiles((prev) => ({ ...prev, [idx]: prev[idx].filter((_, i) => i !== fi) }))
                          }
                          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-line bg-surface text-[11px] text-ink-2 hover:text-ink"
                          aria-label="Remove image"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

        {proposal.characters.length === 0 && (
          <div className="mb-8 rounded-xl border border-line-soft bg-surface py-12 text-center text-[14.5px] text-ink-2">
            No characters were proposed. Add at least one character to continue.
          </div>
        )}

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
