import { useState, type ReactNode } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { PlusIcon, GridIcon, FilmIcon, FolderIcon, UsageIcon, GearIcon, BellIcon } from './icons2'
import { ArrowLeft, ChevronDown } from './icons'
import { Thumb } from './ShotStrip'
import logoUrl from '../assets/logo.png'
import { getRecentShows } from '../data/recents'

const workspaceNav = [
  { label: 'Shows', icon: GridIcon, to: '/shows' },
  { label: 'Productions', icon: FilmIcon, to: '/productions' },
  { label: 'Assets', icon: FolderIcon, to: '/assets' },
]

const RECENT_THUMBS = ['S02', 'S04', 'S01']

interface WorkspaceShellProps {
  children: ReactNode
  /** breadcrumb text next to the back arrow, e.g. "Shows" or "Fruitful Secrets / New episode" */
  breadcrumb?: ReactNode
  backTo?: string
}

export function WorkspaceShell({ children, breadcrumb, backTo = '/shows' }: WorkspaceShellProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const recents = getRecentShows()

  return (
    <div className="flex h-screen overflow-hidden bg-app">
      <aside className="flex w-[224px] shrink-0 flex-col border-r border-line-soft bg-sidebar">
        <div className="px-5 pt-6 pb-5">
          <Link to="/shows" className="flex items-center gap-2.5 text-[20px] font-semibold tracking-tight">
            <img src={logoUrl} alt="" className="h-7 w-7 rounded-md" />
            <span>Cre<span className="text-accent">8</span>Motion</span>
          </Link>
        </div>

        <div className="px-4 pb-5">
          <Link
            to="/create-show"
            className="flex w-full items-center gap-2.5 rounded-lg border border-line bg-raised px-4 py-2.5 text-[14px] font-medium transition-colors hover:bg-raised-2"
          >
            <PlusIcon size={15} />
            Create
          </Link>
        </div>

        <p className="px-5 pb-2 text-[11.5px] font-semibold tracking-[0.12em] text-ink-3">WORKSPACE</p>
        <nav className="flex flex-col gap-0.5 px-2.5">
          {workspaceNav.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-[14.5px] transition-colors ${
                  isActive ? 'bg-selected font-medium text-ink' : 'text-ink-2 hover:bg-raised hover:text-ink'
                }`
              }
            >
              <Icon size={17} className="shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {recents.length > 0 && (
          <>
            <p className="px-5 pb-2 pt-6 text-[11.5px] font-semibold tracking-[0.12em] text-ink-3">RECENT</p>
            <nav className="flex flex-col gap-0.5 px-2.5">
              {recents.map((r, i) => (
                <Link
                  key={r.id}
                  to={`/show/${r.id}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-[14.5px] text-ink-2 transition-colors hover:bg-raised hover:text-ink"
                >
                  <Thumb shotId={RECENT_THUMBS[i % RECENT_THUMBS.length]} className="h-7 w-7 shrink-0 rounded-md" />
                  <span className="min-w-0 flex-1 truncate">{r.title}</span>
                  {i === 0 && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />}
                </Link>
              ))}
            </nav>
          </>
        )}

        <div className="mt-auto border-t border-line-soft px-2.5 py-4">
          <NavLink
            to="/usage"
            className={({ isActive }) =>
              `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[14.5px] transition-colors ${
                isActive ? 'bg-selected font-medium text-ink' : 'text-ink-2 hover:bg-raised hover:text-ink'
              }`
            }
          >
            <UsageIcon size={17} />
            Usage
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[14.5px] transition-colors ${
                isActive ? 'bg-selected font-medium text-ink' : 'text-ink-2 hover:bg-raised hover:text-ink'
              }`
            }
          >
            <GearIcon size={17} />
            Settings
          </NavLink>
          <button className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[14.5px] transition-colors hover:bg-raised">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-accent-ink"
              style={{ background: 'linear-gradient(135deg, #9DFF00, #5a9400)' }}
            >
              D
            </span>
            <span className="flex-1 text-left">Dave</span>
            <ChevronDown size={14} className="text-ink-3" />
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-[64px] shrink-0 items-center justify-between px-8">
          <div className="flex items-center gap-4">
            {breadcrumb && (
              <>
                <Link to={backTo} className="text-ink-2 transition-colors hover:text-ink" aria-label="Back">
                  <ArrowLeft />
                </Link>
                <span className="text-[15.5px] font-medium">{breadcrumb}</span>
              </>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative text-ink-2 transition-colors hover:text-ink"
              aria-label="Notifications"
            >
              <BellIcon />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent" />
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 top-full mt-3 w-[360px] rounded-xl border border-line bg-surface shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between border-b border-line-soft p-4 bg-[#0A0A0A]">
                  <span className="font-semibold text-ink text-[14.5px]">Notifications</span>
                  <button className="text-[12.5px] text-accent hover:underline">Mark all read</button>
                </div>
                <div className="max-h-[400px] overflow-y-auto divide-y divide-line">
                  <div className="p-4 flex items-start gap-3 hover:bg-selected transition-colors bg-[#0E0E0E08] relative">
                    <span className="absolute left-2 top-5 h-2 w-2 rounded-full bg-accent" />
                    <div className="mt-0.5 text-warn ml-2">
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M10 2l8 14H2l8-14z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M10 8v4M10 15h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] font-semibold text-ink">Attention Required</h3>
                      <p className="text-[13px] text-ink-3 mt-0.5 leading-snug">Production 'Tiny Kingdom E02' requires attention: Storyboard QC failed.</p>
                      <span className="text-[11.5px] text-ink-4 block mt-1.5">12m ago</span>
                    </div>
                  </div>
                  <div className="p-4 flex items-start gap-3 hover:bg-selected transition-colors">
                    <div className="mt-0.5 text-success ml-4">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] font-medium text-ink-2">Style Profile Generated</h3>
                      <p className="text-[13px] text-ink-3 mt-0.5 leading-snug">Production 'Fruitful Secrets E04' style profile generated successfully.</p>
                      <span className="text-[11.5px] text-ink-4 block mt-1.5">5m ago</span>
                    </div>
                  </div>
                  <div className="p-4 flex items-start gap-3 hover:bg-selected transition-colors">
                    <div className="mt-0.5 text-success ml-4">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] font-medium text-ink-2">Compilation Completed</h3>
                      <p className="text-[13px] text-ink-3 mt-0.5 leading-snug">Video compilation completed for 'Last Seed E01'. Ready for review.</p>
                      <span className="text-[11.5px] text-ink-4 block mt-1.5">2h ago</span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-line-soft bg-raised p-2 text-center">
                  <Link to="/notifications" onClick={() => setShowNotifications(false)} className="text-[13px] font-medium text-ink-2 hover:text-ink transition-colors block py-1.5">
                    View all notifications
                  </Link>
                </div>
              </div>
            )}
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
