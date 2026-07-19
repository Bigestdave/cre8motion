import { useState } from 'react'
import { WorkspaceShell } from '../components/WorkspaceShell'
import { WarnTriangle } from '../components/icons'

export function SettingsScreen() {
  const [activeTab, setActiveTab] = useState<'General' | 'Production' | 'Notifications' | 'Connections' | 'Storage'>('General')
  
  // General State
  const [workspaceName, setWorkspaceName] = useState("Dave's Studio")
  const [defaultWorkspace] = useState("Dave's Studio")
  const [timeZone, setTimeZone] = useState("Africa/Lagos")
  const [themeMode, setThemeMode] = useState("Dark")

  // Production State
  const [defaultDuration, setDefaultDuration] = useState("45 seconds")
  const [aspectRatio, setAspectRatio] = useState("Vertical · 9:16")
  const [defaultBudget, setDefaultBudget] = useState("100 units")
  const [retryReserve, setRetryReserve] = useState("16 units")
  const [maxAttempts, setMaxAttempts] = useState("2")
  const [humanCheckpoints, setHumanCheckpoints] = useState("Only when production is blocked")
  const [aiBehavior, setAiBehavior] = useState<"safe" | "pause">("safe")

  return (
    <WorkspaceShell>
      <div className="p-8 max-w-6xl mx-auto flex gap-12">
        {/* Left Side: Forms */}
        <div className="flex-1 max-w-[620px]">
          <h1 className="text-[28px] font-semibold text-ink leading-tight">Settings</h1>
          <p className="text-[15px] text-ink-3 mt-1.5">Manage workspace defaults and connections.</p>

          {/* Settings Tabs */}
          <div className="flex gap-6 border-b border-line-soft mt-6 mb-8">
            {(['General', 'Production', 'Notifications', 'Connections', 'Storage'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-[15px] transition-colors relative ${
                  activeTab === tab ? 'text-ink font-medium' : 'text-ink-3 hover:text-ink-2'
                }`}
              >
                {tab}
                {activeTab === tab && <span className="absolute bottom-0 inset-x-0 h-[2px] bg-accent" />}
              </button>
            ))}
          </div>

          {/* GENERAL Settings View */}
          {activeTab === 'General' && (
            <div className="space-y-8">
              {/* Workspace Section */}
              <div>
                <h3 className="text-[16px] font-medium text-ink border-b border-line-soft pb-2 mb-4">Workspace</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[13.5px] text-ink-3 mb-1.5">Workspace name</label>
                    <input
                      type="text"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      className="h-[38px] w-full bg-surface border border-line rounded-lg px-3.5 text-[14px] text-ink focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-[13.5px] text-ink-3 mb-1.5">Default workspace</label>
                    <input
                      type="text"
                      value={defaultWorkspace}
                      className="h-[38px] w-full bg-surface border border-line rounded-lg px-3.5 text-[14px] text-ink-3 focus:outline-none opacity-60 cursor-not-allowed"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Regional Section */}
              <div>
                <h3 className="text-[16px] font-medium text-ink border-b border-line-soft pb-2 mb-4">Regional settings</h3>
                <div>
                  <label className="block text-[13.5px] text-ink-3 mb-1.5">Time zone</label>
                  <select
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    className="h-[38px] w-full bg-surface border border-line rounded-lg px-3.5 text-[14px] text-ink focus:outline-none focus:border-accent"
                  >
                    <option value="Africa/Lagos">Africa/Lagos</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                  </select>
                  <p className="text-[12.5px] text-ink-4 mt-2">Your time zone is used for production history, notifications, and export timestamps.</p>
                </div>
              </div>

              {/* Interface Section */}
              <div>
                <h3 className="text-[16px] font-medium text-ink border-b border-line-soft pb-2 mb-4">Interface</h3>
                <div>
                  <label className="block text-[13.5px] text-ink-3 mb-1.5">Interface</label>
                  <select
                    value={themeMode}
                    onChange={(e) => setThemeMode(e.target.value)}
                    className="h-[38px] w-full bg-surface border border-line rounded-lg px-3.5 text-[14px] text-ink focus:outline-none focus:border-accent"
                  >
                    <option value="Dark">Dark</option>
                    <option value="Light">Light</option>
                    <option value="System">System</option>
                  </select>
                  <p className="text-[12.5px] text-ink-4 mt-2">Cre8Motion currently uses its established dark production theme.</p>
                </div>
              </div>

              <div className="pt-6 border-t border-line-soft">
                <button className="h-[42px] px-6 bg-ink text-app font-medium text-[14px] rounded-lg hover:bg-ink-2 transition-colors">
                  Save changes
                </button>
              </div>
            </div>
          )}

          {/* PRODUCTION Defaults View */}
          {activeTab === 'Production' && (
            <div className="space-y-8">
              {/* Production Defaults */}
              <div>
                <h3 className="text-[16px] font-medium text-ink border-b border-line-soft pb-2 mb-4">Production defaults</h3>
                <p className="text-[13px] text-ink-4 mb-4">Defaults applied when a show or episode does not provide its own value.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[13.5px] text-ink-3 mb-1.5">Default episode duration</label>
                    <select
                      value={defaultDuration}
                      onChange={(e) => setDefaultDuration(e.target.value)}
                      className="h-[38px] w-full bg-surface border border-line rounded-lg px-3.5 text-[14px] text-ink focus:outline-none focus:border-accent"
                    >
                      <option value="45 seconds">45 seconds</option>
                      <option value="60 seconds">60 seconds</option>
                      <option value="90 seconds">90 seconds</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13.5px] text-ink-3 mb-1.5">Default aspect ratio</label>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className="h-[38px] w-full bg-surface border border-line rounded-lg px-3.5 text-[14px] text-ink focus:outline-none focus:border-accent"
                    >
                      <option value="Vertical · 9:16">Vertical · 9:16</option>
                      <option value="Horizontal · 16:9">Horizontal · 16:9</option>
                      <option value="Square · 1:1">Square · 1:1</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13.5px] text-ink-3 mb-1.5">Default production budget</label>
                    <input
                      type="text"
                      value={defaultBudget}
                      onChange={(e) => setDefaultBudget(e.target.value)}
                      className="h-[38px] w-full bg-surface border border-line rounded-lg px-3.5 text-[14px] text-ink focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-[13.5px] text-ink-3 mb-1.5">Retry reserve</label>
                    <input
                      type="text"
                      value={retryReserve}
                      onChange={(e) => setRetryReserve(e.target.value)}
                      className="h-[38px] w-full bg-surface border border-line rounded-lg px-3.5 text-[14px] text-ink focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-[13.5px] text-ink-3 mb-1.5">Maximum automatic attempts per shot</label>
                    <select
                      value={maxAttempts}
                      onChange={(e) => setMaxAttempts(e.target.value)}
                      className="h-[38px] w-full bg-surface border border-line rounded-lg px-3.5 text-[14px] text-ink focus:outline-none focus:border-accent"
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13.5px] text-ink-3 mb-1.5">Human checkpoints</label>
                    <select
                      value={humanCheckpoints}
                      onChange={(e) => setHumanCheckpoints(e.target.value)}
                      className="h-[38px] w-full bg-surface border border-line rounded-lg px-3.5 text-[14px] text-ink focus:outline-none focus:border-accent"
                    >
                      <option value="Only when production is blocked">Only when production is blocked</option>
                      <option value="Always before production starts">Always before production starts</option>
                      <option value="Never (Fully autonomous)">Never (Fully autonomous)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* AI Behavior */}
              <div>
                <h3 className="text-[16px] font-medium text-ink border-b border-line-soft pb-2 mb-4">AI behavior</h3>
                <p className="text-[13px] text-ink-4 mb-4">When information is missing</p>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group text-[14.5px]">
                    <input
                      type="radio"
                      name="aiBehavior"
                      checked={aiBehavior === 'safe'}
                      onChange={() => setAiBehavior('safe')}
                      className="h-4 w-4 bg-surface border-line checked:bg-accent text-accent accent-accent focus:ring-0"
                    />
                    <span className="text-ink-2 group-hover:text-ink">Make a safe creative decision</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group text-[14.5px]">
                    <input
                      type="radio"
                      name="aiBehavior"
                      checked={aiBehavior === 'pause'}
                      onChange={() => setAiBehavior('pause')}
                      className="h-4 w-4 bg-surface border-line checked:bg-accent text-accent accent-accent focus:ring-0"
                    />
                    <span className="text-ink-2 group-hover:text-ink">Pause and ask me</span>
                  </label>
                </div>
              </div>

              {/* Warning box */}
              <div className="flex items-start gap-3 border border-line bg-raised rounded-xl p-4 text-[13.5px]">
                <span className="text-warn pt-0.5"><WarnTriangle size={16} /></span>
                <div>
                  <h4 className="font-semibold text-ink-2">These settings apply to new productions.</h4>
                  <p className="text-ink-4 mt-0.5">Active and completed productions will not change.</p>
                </div>
              </div>

              <div className="pt-6 border-t border-line-soft">
                <button className="h-[42px] px-6 bg-ink text-app font-medium text-[14px] rounded-lg hover:bg-ink-2 transition-colors">
                  Save production defaults
                </button>
              </div>
            </div>
          )}

          {/* OTHER Placeholder tabs */}
          {activeTab !== 'General' && activeTab !== 'Production' && (
            <div className="h-[300px] flex items-center justify-center border border-dashed border-line rounded-xl text-ink-4 text-[14.5px]">
              {activeTab} settings are under active configuration.
            </div>
          )}
        </div>

        {/* Right Side: Informative Sidebar */}
        <div className="w-[300px] shrink-0 pt-[110px] hidden lg:block">
          <div className="border border-line-soft rounded-xl p-5 bg-[#070707] text-[13.5px] leading-relaxed text-ink-3">
            {activeTab === 'General' ? (
              <p>Workspace settings affect all productions created in this workspace.</p>
            ) : (
              <p>Production defaults help maintain consistency and speed across your entire workspace.</p>
            )}
          </div>
        </div>
      </div>
    </WorkspaceShell>
  )
}
