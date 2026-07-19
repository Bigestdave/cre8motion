import { useState } from 'react'
import { WorkspaceShell } from '../components/WorkspaceShell'
import { WarnTriangle } from '../components/icons'

interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  read: boolean
  type: 'success' | 'warning' | 'info'
}

const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    title: 'Style Profile Generated',
    description: "Production 'Fruitful Secrets E04' style profile generated successfully.",
    time: '5m ago',
    read: true,
    type: 'success'
  },
  {
    id: '2',
    title: 'Attention Required',
    description: "Production 'Tiny Kingdom E02' requires attention: Storyboard QC failed on Shot 07.",
    time: '12m ago',
    read: false,
    type: 'warning'
  },
  {
    id: '3',
    title: 'Budget Alert',
    description: "Dave's Studio workspace has consumed 80% of current monthly generation units.",
    time: '1h ago',
    read: true,
    type: 'warning'
  },
  {
    id: '4',
    title: 'Compilation Completed',
    description: "Video compilation completed successfully for 'Last Seed E01'. Ready for final review.",
    time: '2h ago',
    read: true,
    type: 'success'
  }
]

export function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications)

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <WorkspaceShell>
      <div className="p-8 max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-[28px] font-semibold text-ink leading-tight">Notifications</h1>
            <p className="text-[15px] text-ink-3 mt-1.5">Stay updated on your production runs and pipeline activities.</p>
          </div>
          <button
            onClick={markAllRead}
            className="text-[13px] font-medium text-accent hover:underline focus:outline-none"
          >
            Mark all as read
          </button>
        </div>

        {/* Notifications list */}
        <div className="border border-line rounded-xl bg-surface divide-y divide-line overflow-hidden">
          {notifications.length > 0 ? (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`p-5 flex items-start gap-4 transition-colors hover:bg-selected relative ${
                  !item.read ? 'bg-[#0E0E0E08]' : ''
                }`}
              >
                {/* Unread blue dot / indicator */}
                {!item.read && (
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-accent" />
                )}

                {/* Left icon depending on notification type */}
                <div className="mt-0.5">
                  {item.type === 'warning' ? (
                    <span className="text-warn"><WarnTriangle size={18} /></span>
                  ) : (
                    <span className="text-accent">✓</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className={`text-[15px] font-medium ${!item.read ? 'text-ink font-semibold' : 'text-ink-2'}`}>
                      {item.title}
                    </h3>
                    <span className="text-[12.5px] text-ink-4 whitespace-nowrap shrink-0">{item.time}</span>
                  </div>
                  <p className="text-[14px] text-ink-3 mt-1 leading-relaxed">{item.description}</p>
                </div>

                {/* Actions */}
                <button
                  onClick={() => deleteNotification(item.id)}
                  className="text-ink-4 hover:text-ink transition-colors text-[13px] ml-2"
                >
                  Dismiss
                </button>
              </div>
            ))
          ) : (
            <div className="h-[200px] flex items-center justify-center text-ink-4 text-[14.5px]">
              No notifications yet.
            </div>
          )}
        </div>
      </div>
    </WorkspaceShell>
  )
}
