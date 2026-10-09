import { AppState, blankState } from './game'

export const STORAGE_KEY = 'questhabit.state'

export function loadState(): { state: AppState; recovered: boolean } {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { state: blankState(), recovered: false }
    const parsed = JSON.parse(raw) as Partial<AppState>
    if (!parsed.profile || !Array.isArray(parsed.quests) || !Array.isArray(parsed.completions)) {
      throw new Error('Invalid QuestHabit state')
    }
    return {
      state: {
        ...blankState(),
        ...parsed,
        profile: { ...blankState().profile, ...parsed.profile },
        unlocked: Array.isArray(parsed.unlocked) ? parsed.unlocked : [],
      },
      recovered: false,
    }
  } catch {
    return { state: blankState(), recovered: true }
  }
}

export function saveState(state: AppState): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}
