import type { ReactNode } from 'react'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import type { StepName } from '../data/shots'

interface AppShellProps {
  active: StepName
  sidebarOverrides?: Parameters<typeof Sidebar>[0]['overrides']
  sidebarBadges?: Parameters<typeof Sidebar>[0]['badges']
  topBarStatus?: string
  showElapsed?: boolean
  showPause?: boolean
  /** Main content (left/center column) */
  children: ReactNode
  /** Right panel content */
  panel?: ReactNode
  /** Bottom shot strip */
  strip?: ReactNode
}

export function AppShell({ active, sidebarOverrides, sidebarBadges, topBarStatus, showElapsed, showPause, children, panel, strip }: AppShellProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-app">
      <TopBar status={topBarStatus} showElapsed={showElapsed} showPause={showPause} />
      <div className="flex min-h-0 flex-1">
        <Sidebar active={active} overrides={sidebarOverrides} badges={sidebarBadges} />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4 pb-0">
            <main className="min-w-0 flex-1 overflow-y-auto rounded-xl bg-surface">
              {children}
            </main>
            {panel && (
              <section className="w-[380px] shrink-0 overflow-y-auto rounded-xl bg-surface">
                {panel}
              </section>
            )}
          </div>
          {strip && <div className="shrink-0 p-4">{strip}</div>}
        </div>
      </div>
    </div>
  )
}
