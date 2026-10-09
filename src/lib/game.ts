export type Category = 'Health' | 'Learning' | 'Coding' | 'Mindfulness' | 'Productivity' | 'Lifestyle'
export type Difficulty = 'Easy' | 'Medium' | 'Hard'
export type Theme = 'midnight' | 'forest' | 'ember' | 'light'
export type Quest = {
  id: string; title: string; description: string; icon: string; category: Category
  difficulty: Difficulty; xp: number; duration: number; frequency: 'Daily' | 'Weekdays' | 'Weekly' | 'Custom'
  weekdays: number[]; startDate: string; endDate?: string; status: 'active' | 'paused' | 'archived'; createdAt: string
}
export type Completion = { id: string; questId: string; date: string; completedAt: string; xp: number }
export type Profile = { name: string; avatar: string; theme: Theme; onboarding: boolean; target: number; weekStart: 0 | 1; reducedMotion: boolean }
export type AppState = { profile: Profile; quests: Quest[]; completions: Completion[]; unlocked: string[] }

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
  return q.frequency === 'Daily' || (q.frequency === 'Weekdays' && day > 0 && day < 6) || (q.frequency === 'Weekly' && day === (q.weekdays[0] ?? 1)) || (q.frequency === 'Custom' && q.weekdays.includes(day))
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
