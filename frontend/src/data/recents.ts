// Stateful "Recent shows" tracking, persisted in localStorage.
const KEY = 'cre8motion.recentShows'
const MAX = 3

export interface RecentShow {
  id: string
  title: string
}

export function getRecentShows(): RecentShow[] {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list.filter((r) => r && r.id && r.title).slice(0, MAX) : []
  } catch {
    return []
  }
}

export function pushRecentShow(show: RecentShow) {
  try {
    const list = getRecentShows().filter((r) => r.id !== show.id)
    list.unshift({ id: show.id, title: show.title })
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)))
  } catch {
    /* storage unavailable */
  }
}
