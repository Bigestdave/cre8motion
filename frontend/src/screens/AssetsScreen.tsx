import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { WorkspaceShell } from '../components/WorkspaceShell'
import { SearchIcon, UploadCloud } from '../components/icons2'
import { CloseIcon } from '../components/icons'
import {
  getShows,
  listCharacters,
  listCharacterReferences,
  getArtifactDownloadUrl,
  uploadCharacterReference,
  type Show,
} from '../data/api'
import { SkeletonShowCard } from '../components/Skeleton'

interface CharacterAsset {
  id: string
  name: string
  description: string
  showId: string
  showTitle: string
  imageUrl?: string
  referencesCount: number
}

const filters = ['All', 'Characters'] as const

export function AssetsScreen() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('All')
  const [selectedShow, setSelectedShow] = useState<string>('All shows')
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [assets, setAssets] = useState<CharacterAsset[]>([])
  const [shows, setShows] = useState<Show[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<CharacterAsset | null>(null)
  const [uploading, setUploading] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadAssets = async () => {
    try {
      const showList = await getShows()
      setShows(showList)
      const all: CharacterAsset[] = []
      await Promise.all(
        showList.map(async (show) => {
          try {
            const chars = await listCharacters(show.id)
            await Promise.all(
              chars.map(async (c) => {
                let imageUrl: string | undefined
                let refsCount = 0
                try {
                  const refs = await listCharacterReferences(c.id)
                  refsCount = refs.length
                  imageUrl = getArtifactDownloadUrl(refs[0]?.artifact_id)
                } catch {
                  /* character has no references */
                }
                all.push({
                  id: c.id,
                  name: c.name,
                  description: c.canonical_description || '',
                  showId: show.id,
                  showTitle: show.title,
                  imageUrl,
                  referencesCount: refsCount,
                })
              }),
            )
          } catch {
            /* show has no characters */
          }
        }),
      )
      all.sort((a, b) => a.showTitle.localeCompare(b.showTitle) || a.name.localeCompare(b.name))
      setAssets(all)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAssets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showsList = ['All shows', ...shows.map((s) => s.title)]

  const filtered = assets.filter((a) => {
    if (selectedShow !== 'All shows' && a.showTitle !== selectedShow) return false
    if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const handleUpload = async (files: FileList | null) => {
    if (!selectedAsset || !files?.length) return
    setUploading(true)
    try {
      for (const file of Array.from(files).filter((f) => f.type.startsWith('image/'))) {
        await uploadCharacterReference(selectedAsset.id, file)
      }
      await loadAssets()
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <WorkspaceShell>
      <div className="relative h-full">
        <div className={`mx-auto max-w-[1280px] px-8 pb-12 pt-8 transition-all ${selectedAsset ? 'mr-[440px]' : ''}`}>
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[30px] font-semibold tracking-tight">Assets</h1>
              <p className="pt-1.5 text-[15px] text-ink-2">
                Characters and references shared across your shows.
              </p>
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex h-[38px] items-center justify-between gap-2.5 rounded-lg border border-line bg-raised pl-4 pr-3.5 text-[14px] font-medium text-ink transition-colors hover:border-line-strong hover:bg-selected whitespace-nowrap"
              >
                <span>{selectedShow}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {showDropdown && (
                <div className="absolute right-0 top-11 z-30 w-[220px] rounded-lg border border-line bg-surface p-1.5 shadow-xl">
                  {showsList.map((show) => (
                    <button
                      key={show}
                      onClick={() => {
                        setSelectedShow(show)
                        setShowDropdown(false)
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[14px] transition-colors hover:bg-selected ${
                        selectedShow === show ? 'font-semibold text-accent' : 'text-ink-2'
                      }`}
                    >
                      {show}
                      {selectedShow === show && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Filters + Search */}
          <div className="flex flex-row items-center justify-between border-b border-line-soft pt-4">
            <div className="flex gap-2">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`relative px-4 py-3.5 text-[14.5px] transition-colors shrink-0 ${
                    filter === f ? 'font-semibold text-ink' : 'text-ink-3 hover:text-ink-2'
                  }`}
                >
                  {f}
                  {filter === f && <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-t bg-accent" />}
                </button>
              ))}
            </div>

            <div className="mb-2 flex w-[300px] items-center gap-2.5 rounded-lg border border-line bg-raised px-3.5 py-2 text-[14px] text-ink-3 focus-within:border-accent-border">
              <SearchIcon size={15} />
              <input
                type="text"
                placeholder="Search assets"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-ink placeholder-ink-4 outline-none text-[14px]"
              />
            </div>
          </div>

          {/* CHARACTERS grid */}
          {loading ? (
            <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
              <SkeletonShowCard />
              <SkeletonShowCard />
              <SkeletonShowCard />
              <SkeletonShowCard />
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-8 flex h-[240px] flex-col items-center justify-center gap-3 rounded-xl border border-line-soft bg-surface text-[14.5px] text-ink-3">
              <p>{assets.length === 0 ? 'No assets yet — characters appear here when you create a show.' : 'No assets match your filter.'}</p>
              {assets.length === 0 && (
                <Link
                  to="/create-show"
                  className="rounded-lg bg-ink px-5 py-2.5 text-[14px] font-medium text-app transition-colors hover:bg-ink-2"
                >
                  Create a show
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-8">
              <h2 className="mb-4 text-[12.5px] font-semibold tracking-[0.1em] uppercase text-ink-4">Characters</h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
                {filtered.map((char) => (
                  <div
                    key={char.id}
                    onClick={() => setSelectedAsset(char)}
                    className={`group cursor-pointer overflow-hidden rounded-xl border bg-surface transition-all ${
                      selectedAsset?.id === char.id
                        ? 'border-accent shadow-[0_0_0_3px_var(--color-accent-soft)]'
                        : 'border-line-soft hover:border-line'
                    }`}
                  >
                    <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden border-b border-line-soft bg-raised text-[13px] text-ink-4">
                      {char.imageUrl ? (
                        <img src={char.imageUrl} alt={char.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-tr from-surface to-raised-2 opacity-50" />
                          <span className="relative font-medium">No reference yet</span>
                        </>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-[16px] font-semibold tracking-tight text-ink">{char.name}</h3>
                      <p className="mt-0.5 text-[13.5px] text-ink-3">{char.showTitle}</p>
                      <p className="mt-2 text-[13px] text-ink-4">
                        {char.referencesCount} reference{char.referencesCount === 1 ? '' : 's'}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-[13px]">
                        {char.referencesCount > 0 ? (
                          <>
                            <span className="h-2 w-2 rounded-full bg-success" />
                            <span className="text-success">Ready</span>
                          </>
                        ) : (
                          <>
                            <span className="h-2 w-2 rounded-full bg-warn" />
                            <span className="text-warn">Needs references</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side Overlay Drawer */}
        {selectedAsset && (
          <div className="absolute bottom-0 right-0 top-0 z-40 flex w-[440px] shrink-0 flex-col border-l border-line bg-surface shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-line-soft p-8">
              <div>
                <h2 className="text-[22px] font-semibold leading-snug tracking-tight text-ink">{selectedAsset.name}</h2>
                <p className="mt-1 text-[14px] text-ink-3">{selectedAsset.showTitle}</p>
                <p className="mt-1 text-[13px] text-ink-4">
                  {selectedAsset.referencesCount} reference image{selectedAsset.referencesCount === 1 ? '' : 's'}
                </p>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-raised hover:text-ink"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex flex-1 flex-col justify-between overflow-y-auto p-8">
              <div className="flex-1">
                <div className="relative flex aspect-[9/13] w-full items-center justify-center overflow-hidden rounded-xl border border-line bg-raised text-[14px] text-ink-4">
                  {selectedAsset.imageUrl ? (
                    <img src={selectedAsset.imageUrl} alt={selectedAsset.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>No reference image uploaded yet</span>
                  )}
                </div>

                <div className="mt-8">
                  <h4 className="mb-3 text-[14px] font-semibold text-ink">Canonical description</h4>
                  <p className="text-[14px] leading-relaxed text-ink-2">
                    {selectedAsset.description || 'No canonical description yet.'}
                  </p>
                </div>
              </div>

              {/* Action buttons at bottom */}
              <div className="mt-8 flex flex-col gap-3 border-t border-line-soft pt-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  multiple
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files)}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex h-[44px] items-center justify-center gap-2.5 rounded-lg border border-accent-border text-[14px] font-semibold text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
                >
                  <UploadCloud size={16} />
                  {uploading ? 'Uploading...' : 'Add reference image'}
                </button>
                <Link
                  to={`/show/${selectedAsset.showId}`}
                  className="flex h-[44px] items-center justify-center rounded-lg bg-ink text-[14px] font-semibold text-app transition-colors hover:bg-ink-2"
                >
                  Open in show
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </WorkspaceShell>
  )
}
