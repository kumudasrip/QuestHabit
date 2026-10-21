export const CATEGORIES = ['Health', 'Learning', 'Coding', 'Mindfulness', 'Productivity', 'Lifestyle'] as const
export type Category = (typeof CATEGORIES)[number]

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

export const THEMES = ['midnight', 'forest', 'ember', 'light'] as const
export type Theme = (typeof THEMES)[number]

export const FREQUENCIES = ['Daily', 'Weekdays', 'Weekly', 'Custom'] as const
export type Frequency = (typeof FREQUENCIES)[number]

export const QUEST_STATUSES = ['active', 'paused', 'archived'] as const
export type QuestStatus = (typeof QUEST_STATUSES)[number]

export const ACHIEVEMENT_IDS = [
  'first',
  'streak3',
  'collector',
  'xp1000',
  'explorer',
  'perfect',
] as const
export type AchievementId = (typeof ACHIEVEMENT_IDS)[number]

export const ACHIEVEMENTS: [AchievementId, string, string, string][] = [
  ['first', 'First Steps', 'Complete your first quest', '🌱'],
  ['streak3', 'Consistency', 'Maintain a 3-day streak', '🔥'],
  ['collector', 'Quest Collector', 'Create 10 quests', '🗺️'],
  ['xp1000', 'Century Club', 'Earn 1,000 lifetime XP', '💎'],
  ['explorer', 'Explorer', 'Complete quests across five categories', '🧭'],
  ['perfect', 'Perfect Day', 'Complete all eligible quests for a day', '⭐'],
]

export const isValidCalendarDate = (str: unknown): str is string => {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false
  const [yStr, mStr, dStr] = str.split('-')
  const y = Number(yStr)
  const m = Number(mStr)
  const d = Number(dStr)
  if (m < 1 || m > 12 || d < 1 || d > 31) return false
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

export type Quest = {
  id: string; title: string; description: string; icon: string; category: Category
  difficulty: Difficulty; xp: number; duration: number; frequency: Frequency
  weekdays: number[]; startDate: string; endDate?: string; status: QuestStatus; createdAt: string
}
export type Completion = { id: string; questId: string; date: string; completedAt: string; xp: number }
export type Profile = { name: string; avatar: string; theme: Theme; onboarding: boolean; target: number; weekStart: 0 | 1; reducedMotion: boolean }
export type AppState = { profile: Profile; quests: Quest[]; completions: Completion[]; unlocked: string[] }

export const WEEKDAYS = [
  { day: 1, label: 'Monday', short: 'Mon' },
  { day: 2, label: 'Tuesday', short: 'Tue' },
  { day: 3, label: 'Wednesday', short: 'Wed' },
  { day: 4, label: 'Thursday', short: 'Thu' },
  { day: 5, label: 'Friday', short: 'Fri' },
  { day: 6, label: 'Saturday', short: 'Sat' },
  { day: 0, label: 'Sunday', short: 'Sun' },
] as const

export const isValidQuest = (quest: {
  title?: string
  frequency?: Quest['frequency']
  weekdays?: number[]
}): boolean => {
  if (!quest.title || !quest.title.trim()) return false
  if (quest.frequency === 'Custom') {
    return (
      Array.isArray(quest.weekdays) &&
      quest.weekdays.length > 0 &&
      quest.weekdays.every(d => Number.isInteger(d) && d >= 0 && d <= 6)
    )
  }
  return true
}

export const validateQuest = (quest: {
  title?: string
  frequency?: Quest['frequency']
  weekdays?: number[]
}): { valid: boolean; error?: string } => {
  if (!quest.title || !quest.title.trim()) {
    return { valid: false, error: 'Quest title is required.' }
  }
  if (quest.frequency === 'Custom' && (!Array.isArray(quest.weekdays) || quest.weekdays.length === 0)) {
    return { valid: false, error: 'Custom quests must repeat on at least one weekday.' }
  }
  if (quest.frequency === 'Custom' && Array.isArray(quest.weekdays) && !quest.weekdays.every(d => Number.isInteger(d) && d >= 0 && d <= 6)) {
    return { valid: false, error: 'Selected weekdays must be valid JavaScript day numbers (0-6).' }
  }
  return { valid: true }
}

export const today = () => {
  const date = new Date()
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10)
}
export const id = () => crypto.randomUUID()
export const starterQuests = (): Quest[] => [
  ['💧', 'Hydrate the hero', 'Drink 8 glasses of water', 'Health', 'Easy', 10, 5],
  ['📖', 'Read & reflect', 'Read for 20 minutes', 'Learning', 'Easy', 15, 20],
  ['🏋️', 'Train your strength', 'Move your body for 30 minutes', 'Health', 'Medium', 25, 30],
  ['💻', 'Code a little', 'Practice a coding concept', 'Coding', 'Medium', 25, 30],
].map(([icon, title, description, category, difficulty, xp, duration], i) => ({
  id: `starter-${i}`, icon: icon as string, title: title as string, description: description as string,
  category: category as Category, difficulty: difficulty as Difficulty, xp: xp as number, duration: duration as number,
  frequency: 'Daily', weekdays: [], startDate: today(), status: 'active', createdAt: new Date().toISOString(),
}))
export const blankState = (): AppState => ({
  profile: { name: '', avatar: '🧙', theme: 'midnight', onboarding: false, target: 3, weekStart: 1, reducedMotion: false },
  quests: [], completions: [], unlocked: [],
})
export const levelInfo = (xp: number) => {
  let level = 1; let remaining = Math.max(0, xp)
  while (remaining >= 100 + 50 * (level - 1)) { remaining -= 100 + 50 * (level - 1); level++ }
  const need = 100 + 50 * (level - 1)
  const rank = level >= 30 ? 'Legend' : level >= 20 ? 'Elite' : level >= 10 ? 'Adventurer' : level >= 5 ? 'Apprentice' : 'Novice'
  return { level, current: remaining, need, percent: Math.round((remaining / need) * 100), rank }
}
export const dueOn = (q: Quest, date: string) => {
  if (q.status !== 'active' || date < q.startDate || (q.endDate && date > q.endDate)) return false
  const day = new Date(`${date}T12:00:00`).getDay()
  return (
    q.frequency === 'Daily' ||
    (q.frequency === 'Weekdays' && day > 0 && day < 6) ||
    (q.frequency === 'Weekly' && day === (q.weekdays?.[0] ?? 1)) ||
    (q.frequency === 'Custom' && Boolean(q.weekdays?.includes(day)))
  )
}
export const streak = (completions: Completion[]) => {
  const days = [...new Set(completions.map(c => c.date))].sort().reverse()
  if (!days.length) return { current: 0, longest: 0 }
  let longest = 1; let run = 1
  for (let i = 1; i < days.length; i++) {
    const diff = (new Date(`${days[i - 1]}T12:00:00`).getTime() - new Date(`${days[i]}T12:00:00`).getTime()) / 86400000
    if (diff === 1) { run++; longest = Math.max(longest, run) } else run = 1
  }
  const gap = (new Date(`${today()}T12:00:00`).getTime() - new Date(`${days[0]}T12:00:00`).getTime()) / 86400000
  return { current: gap <= 1 ? [...days].findIndex((d, i) => i && (new Date(`${days[i - 1]}T12:00:00`).getTime() - new Date(`${d}T12:00:00`).getTime()) / 86400000 !== 1) || days.length : 0, longest }
}
export const templates = [
  ['🌿', 'Morning stretch', 'Wake up your body with a gentle stretch.', 'Health', 'Easy', 10, 10],
  ['🧘', 'Mindful minutes', 'Take five quiet minutes to breathe.', 'Mindfulness', 'Easy', 10, 5],
  ['✍️', 'Journal it out', 'Write three lines about your day.', 'Mindfulness', 'Easy', 10, 5],
  ['🎨', 'Make something', 'Spend time on a creative project.', 'Productivity', 'Medium', 20, 30],
  ['🎓', 'Learn a concept', 'Explore a topic you are curious about.', 'Learning', 'Medium', 20, 25],
  ['🌙', 'Sleep on time', 'Protect your rest and start tomorrow strong.', 'Lifestyle', 'Medium', 20, 10],
].map((x, i) => ({ id: `template-${i}`, icon: x[0] as string, title: x[1] as string, description: x[2] as string, category: x[3] as Category, difficulty: x[4] as Difficulty, xp: x[5] as number, duration: x[6] as number }))
