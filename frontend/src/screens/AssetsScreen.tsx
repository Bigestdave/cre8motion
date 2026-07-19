import { useState, useRef, useEffect } from 'react'
import { WorkspaceShell } from '../components/WorkspaceShell'
import { SearchIcon } from '../components/icons2'
import { WarnTriangle, CloseIcon } from '../components/icons'

interface Asset {
  id: string
  name: string
  show: string
  type: 'character' | 'location' | 'prop' | 'style'
  status: 'ready' | 'incomplete' | 'generating'
  statusText: string
  details: string
  details2?: string
  referencesCount?: number
  usedEpisodes: number
}

const mockAssets: Asset[] = [
  {
    id: 'lumi',
    name: 'Lumi',
    show: 'Fruitful Secrets',
    type: 'character',
    status: 'ready',
    statusText: 'Ready',
    details: '6 references · Used in 4 episodes',
    usedEpisodes: 4,
    referencesCount: 6,
  },
  {
    id: 'kai',
    name: 'Kai',
    show: 'Fruitful Secrets',
    type: 'character',
    status: 'ready',
    statusText: 'Ready',
    details: '5 references · Used in 3 episodes',
    usedEpisodes: 3,
    referencesCount: 5,
  },
  {
    id: 'mara',
    name: 'Mara',
    show: 'Fruitful Secrets',
    type: 'character',
    status: 'incomplete',
    statusText: 'Incomplete',
    details: '4 references · Used in 1 episode',
    usedEpisodes: 1,
    referencesCount: 4,
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    show: 'Fruitful Secrets',
    type: 'location',
    status: 'ready',
    statusText: 'Ready',
    details: '4 camera views · 2 lighting variants',
    details2: 'Used in 4 episodes',
    usedEpisodes: 4,
  },
  {
    id: 'garden',
    name: 'Garden',
    show: 'Fruitful Secrets',
    type: 'location',
    status: 'generating',
    statusText: 'Generating',
    details: '3 camera views · Evening view generating',
    details2: 'Used in 2 episodes',
    usedEpisodes: 2,
  },
]

const filters = ['All', 'Characters', 'Locations', 'Props', 'Styles'] as const
const showsList = ['All shows', 'Fruitful Secrets', 'Tiny Kingdom'] as const

export function AssetsScreen() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('All')
  const [selectedShow, setSelectedShow] = useState<string>('All shows')
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(mockAssets[0])
  const [detailTab, setDetailTab] = useState<'Overview' | 'References' | 'Usage' | 'Versions'>('Overview')
  
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const filtered = mockAssets.filter((a) => {
    if (filter === 'Characters' && a.type !== 'character') return false
    if (filter === 'Locations' && a.type !== 'location') return false
    if (filter === 'Props' && a.type !== 'prop') return false
    if (filter === 'Styles' && a.type !== 'style') return false

    if (selectedShow !== 'All shows' && a.show !== selectedShow) return false

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return a.name.toLowerCase().includes(q) || a.show.toLowerCase().includes(q)
    }
    return true
  })

  const characters = filtered.filter((a) => a.type === 'character')
  const locations = filtered.filter((a) => a.type === 'location')

  return (
    <WorkspaceShell>
      <div className="relative flex h-full overflow-hidden">
        {/* Main Content Container with dynamic right margin to offset drawer overlay */}
        <div className={`flex-1 overflow-y-auto pb-12 transition-all duration-300 ${
          selectedAsset ? 'mr-[440px]' : 'mr-0'
        }`}>
          <div className="mx-auto max-w-[1280px] px-8 pt-8">
            {/* Responsive Header: stacks when drawer is open and squishing the container */}
            <div className={`flex gap-4 ${
              selectedAsset 
                ? 'flex-col items-start' 
                : 'flex-row items-start justify-between'
            }`}>
              <div className="min-w-0 flex-1">
                <h1 className="text-[30px] font-semibold tracking-tight">Assets</h1>
                <p className="pt-1.5 text-[15px] text-ink-2 leading-relaxed">Manage reusable references across your shows.</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
                {/* Custom Premium Show Filter Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex h-[38px] items-center justify-between gap-2.5 rounded-lg border border-line bg-raised pl-4 pr-3.5 text-[14px] font-medium text-ink transition-colors hover:border-line-strong hover:bg-selected whitespace-nowrap"
                  >
                    <span>{selectedShow}</span>
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="text-ink-3">
                      <path d="M4.5 7.5L10 13l5.5-5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 top-full mt-1.5 w-[180px] rounded-xl border border-line bg-surface p-1.5 shadow-2xl z-50">
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
                          <span>{show}</span>
                          {selectedShow === show && (
                            <span className="text-accent text-[12px]">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button className="rounded-lg bg-ink px-5 py-2.5 text-[14px] font-semibold text-app transition-colors hover:bg-ink-2 whitespace-nowrap">
                  Add asset
                </button>
              </div>
            </div>

            {/* Filters + Search (Underline tabs & premium input box) */}
            <div className={`flex border-b border-line-soft pt-4 ${
              selectedAsset 
                ? 'flex-col gap-3 items-stretch pb-3.5' 
                : 'flex-row items-center justify-between'
            }`}>
              <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`relative px-4 py-3.5 text-[14.5px] transition-colors shrink-0 ${
                      filter === f ? 'font-semibold text-ink' : 'text-ink-3 hover:text-ink-2'
                    }`}
                  >
                    {f}
                    {filter === f && (
                      <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-t bg-accent" />
                    )}
                  </button>
                ))}
              </div>

              <div className={`flex items-center gap-2.5 rounded-lg border border-line bg-raised px-3.5 py-2 text-[14px] text-ink-3 focus-within:border-accent-border ${
                selectedAsset ? 'w-full mb-0' : 'w-[300px] mb-2'
              }`}>
                <SearchIcon size={15} />
                <input
                  type="text"
                  placeholder="Search assets"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-ink placeholder-ink-4 outline-none text-[14px]"
                />
                <span className="rounded border border-line-soft px-1.5 py-0.5 text-[11.5px] text-ink-4">⌘K</span>
              </div>
            </div>

            {/* CHARACTERS grid */}
            {characters.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-4 text-[12.5px] font-semibold tracking-[0.1em] uppercase text-ink-4">Characters</h2>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
                  {characters.map((char) => (
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
                        <div className="absolute inset-0 bg-gradient-to-tr from-surface to-raised-2 opacity-50 transition-transform group-hover:scale-105" />
                        <span className="relative font-medium">{char.name} Photo</span>
                      </div>
                      <div className="p-5">
                        <h3 className="text-[16px] font-semibold tracking-tight text-ink">{char.name}</h3>
                        <p className="mt-0.5 text-[13.5px] text-ink-3">{char.show}</p>
                        <p className="mt-2 text-[13px] text-ink-4">{char.details}</p>
                        <div className="mt-4 flex items-center gap-2 text-[13px]">
                          {char.status === 'ready' && (
                            <>
                              <span className="h-2 w-2 rounded-full bg-success" />
                              <span className="text-success">{char.statusText}</span>
                            </>
                          )}
                          {char.status === 'incomplete' && (
                            <>
                              <span className="text-warn"><WarnTriangle size={14} /></span>
                              <span className="text-warn">{char.statusText}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LOCATIONS grid */}
            {locations.length > 0 && (
              <div className="mt-12">
                <h2 className="mb-4 text-[12.5px] font-semibold tracking-[0.1em] uppercase text-ink-4">Locations</h2>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-5">
                  {locations.map((loc) => (
                    <div
                      key={loc.id}
                      onClick={() => setSelectedAsset(loc)}
                      className={`group cursor-pointer overflow-hidden rounded-xl border bg-surface transition-all ${
                        selectedAsset?.id === loc.id
                          ? 'border-accent shadow-[0_0_0_3px_var(--color-accent-soft)]'
                          : 'border-line-soft hover:border-line'
                      }`}
                    >
                      <div className="relative flex aspect-[21/9] items-center justify-center overflow-hidden border-b border-line-soft bg-raised text-[13px] text-ink-4">
                        <div className="absolute inset-0 bg-gradient-to-tr from-surface to-raised-2 opacity-50 transition-transform group-hover:scale-105" />
                        <span className="relative font-medium">{loc.name} Preview</span>
                      </div>
                      <div className="p-5">
                        <h3 className="text-[16px] font-semibold tracking-tight text-ink">{loc.name}</h3>
                        <p className="mt-0.5 text-[13.5px] text-ink-3">{loc.show}</p>
                        <p className="mt-2 text-[13px] text-ink-4">
                          {loc.details} {loc.details2 && `· ${loc.details2}`}
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-[13px]">
                          {loc.status === 'ready' && (
                            <>
                              <span className="h-2 w-2 rounded-full bg-success" />
                              <span className="text-success">{loc.statusText}</span>
                            </>
                          )}
                          {loc.status === 'generating' && (
                            <>
                              <span className="h-2 w-2 animate-ping rounded-full bg-accent" />
                              <span className="text-accent">{loc.statusText}</span>
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
        </div>

        {/* Right Side Overlay Drawer */}
        {selectedAsset && (
          <div className="absolute bottom-0 right-0 top-0 z-40 flex w-[440px] shrink-0 flex-col border-l border-line bg-surface shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-line-soft p-8">
              <div>
                <h2 className="text-[22px] font-semibold leading-snug tracking-tight text-ink">{selectedAsset.name}</h2>
                <p className="mt-1 text-[14px] text-ink-3">{selectedAsset.show}</p>
                <p className="mt-1 text-[13px] text-ink-4">Used in {selectedAsset.usedEpisodes} episodes</p>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-raised hover:text-ink"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Inner Drawer Tabs */}
            <div className="flex gap-6 border-b border-line-soft px-8">
              {(['Overview', 'References', 'Usage', 'Versions'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`relative py-3.5 text-[14.5px] transition-colors ${
                    detailTab === tab ? 'font-medium text-ink' : 'text-ink-3 hover:text-ink-2'
                  }`}
                >
                  {tab}
                  {detailTab === tab && <span className="absolute bottom-0 inset-x-0 h-[2px] bg-accent" />}
                </button>
              ))}
            </div>

            {/* Drawer Content */}
            <div className="flex flex-1 flex-col justify-between overflow-y-auto p-8">
              {detailTab === 'Overview' && (
                <div className="flex-1">
                  {/* Portrait Asset Reference Image */}
                  <div className="relative flex aspect-[9/13] w-full items-center justify-center overflow-hidden rounded-xl border border-line bg-raised text-[14px] text-ink-4">
                    <div className="absolute inset-0 bg-gradient-to-tr from-surface to-raised-2 opacity-30" />
                    <span className="relative">Lumi portrait reference photo</span>
                  </div>

                  {/* Reference coverage */}
                  <div className="mt-8">
                    <h4 className="mb-4 text-[14px] font-semibold text-ink">Reference coverage</h4>
                    <div className="flex flex-col gap-3">
                      {[
                        { label: 'Front', has: true },
                        { label: 'Side', has: true },
                        { label: 'Three-quarter', has: true },
                        { label: 'Full body', has: true },
                        { label: 'Happy', has: true },
                        { label: 'Shocked expression missing', has: false },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-[14px]">
                          {item.has ? (
                            <>
                              <span className="text-accent">✓</span>
                              <span className="text-ink-2">{item.label}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-warn"><WarnTriangle size={14} /></span>
                              <span className="text-ink-3">{item.label}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {detailTab !== 'Overview' && (
                <div className="flex flex-1 items-center justify-center text-[14px] text-ink-3">
                  No {detailTab.toLowerCase()} data available yet.
                </div>
              )}

              {/* Action buttons at bottom */}
              <div className="mt-8 flex gap-3 border-t border-line-soft pt-6">
                <button className="flex h-[44px] flex-1 items-center justify-center rounded-lg border border-line text-[14px] font-semibold text-ink transition-colors hover:bg-raised">
                  Open in show
                </button>
                <button className="flex h-[44px] flex-1 items-center justify-center rounded-lg bg-ink text-[14px] font-semibold text-app transition-colors hover:bg-ink-2">
                  Edit asset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </WorkspaceShell>
  )
}
