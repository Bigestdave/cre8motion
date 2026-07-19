import { WorkspaceShell } from '../components/WorkspaceShell'

export function UsageScreen() {
  return (
    <WorkspaceShell>
      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-[28px] font-semibold text-ink leading-tight">Usage</h1>
        <p className="text-[15px] text-ink-3 mt-1.5">Track your workspace credits, GPU rendering time, and AI generation usage.</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-6 mt-8">
          {/* Card 1 */}
          <div className="border border-line rounded-xl p-6 bg-surface">
            <h3 className="text-[14px] text-ink-3 uppercase tracking-wider">Generation Units</h3>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-[32px] font-semibold text-ink">342</span>
              <span className="text-ink-4">/ 1,000 monthly</span>
            </div>
            <div className="h-1.5 w-full bg-raised-2 overflow-hidden rounded-full mt-4">
              <div className="h-full bg-accent rounded-full" style={{ width: '34.2%' }} />
            </div>
            <p className="text-[12.5px] text-ink-4 mt-3">Resetting on August 1st, 2026</p>
          </div>

          {/* Card 2 */}
          <div className="border border-line rounded-xl p-6 bg-surface">
            <h3 className="text-[14px] text-ink-3 uppercase tracking-wider">GPU Render Time</h3>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-[32px] font-semibold text-ink">4.8h</span>
              <span className="text-ink-4">/ 20h limit</span>
            </div>
            <div className="h-1.5 w-full bg-raised-2 overflow-hidden rounded-full mt-4">
              <div className="h-full bg-accent rounded-full" style={{ width: '24%' }} />
            </div>
            <p className="text-[12.5px] text-ink-4 mt-3">Used for high-fidelity video assembly</p>
          </div>

          {/* Card 3 */}
          <div className="border border-line rounded-xl p-6 bg-surface">
            <h3 className="text-[14px] text-ink-3 uppercase tracking-wider">Active Storage</h3>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-[32px] font-semibold text-ink">8.2 GB</span>
              <span className="text-ink-4">/ 50 GB tier</span>
            </div>
            <div className="h-1.5 w-full bg-raised-2 overflow-hidden rounded-full mt-4">
              <div className="h-full bg-accent rounded-full" style={{ width: '16.4%' }} />
            </div>
            <p className="text-[12.5px] text-ink-4 mt-3">Includes models, caches, and keyframes</p>
          </div>
        </div>

        {/* Usage breakdown per show */}
        <div className="mt-10">
          <h2 className="text-[16px] font-semibold text-ink mb-4">Resource consumption by show</h2>
          <div className="border border-line rounded-xl bg-surface overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-line bg-[#0A0A0A] text-[12px] uppercase tracking-wider text-ink-3">
              <span>Show</span>
              <span>Units Consumed</span>
            </div>
            <div className="divide-y divide-line">
              {[
                { name: 'Fruitful Secrets', units: 154, percent: '45%' },
                { name: 'Tiny Kingdom', units: 122, percent: '36%' },
                { name: 'Last Seed', units: 66, percent: '19%' },
              ].map((show, idx) => (
                <div key={idx} className="flex justify-between items-center px-6 py-4 hover:bg-selected transition-colors text-[14.5px]">
                  <span className="font-medium text-ink">{show.name}</span>
                  <div className="flex items-center gap-6">
                    <span className="text-ink-2 font-medium">{show.units} units</span>
                    <div className="w-24 h-2 bg-raised rounded-full overflow-hidden hidden sm:block">
                      <div className="h-full bg-accent" style={{ width: show.percent }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  )
}
