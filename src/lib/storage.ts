import {
  ACHIEVEMENT_IDS,
  AppState,
  blankState,
  CATEGORIES,
  DIFFICULTIES,
  FREQUENCIES,
  isValidCalendarDate,
  Profile,
  Quest,
  Completion,
  QUEST_STATUSES,
  THEMES,
} from './game'

export const STORAGE_KEY = 'questhabit.state'
export const CURRENT_BACKUP_VERSION = 1

const ISO_DATETIME_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})[Tt]([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.\d+)?(?:[Zz]|([+-])([01]\d|2[0-3])(?::?([0-5]\d))?)$/

export function isValidIsoDateTime(str: unknown): str is string {
  if (typeof str !== 'string') return false
  const match = ISO_DATETIME_REGEX.exec(str)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return false
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export const isValidISODateTime = isValidIsoDateTime

export interface VersionedBackup {
  version: 1
  exportedAt: string
  profile: Profile
  quests: Quest[]
  completions: Completion[]
  unlocked: string[]
}

export type BackupValidationResult =
  | { success: true; state: AppState; version: number; migrated: boolean }
  | { success: false; error: string }

export function validateProfile(
  profile: unknown,
): { valid: true; data: Profile } | { valid: false; error: string } {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    return { valid: false, error: 'Profile must be an object.' }
  }
  const p = profile as Record<string, unknown>

  if (typeof p.name !== 'string') {
    return { valid: false, error: 'Profile display name must be a string.' }
  }
  if (typeof p.avatar !== 'string' || !p.avatar.trim()) {
    return { valid: false, error: 'Profile avatar must be a non-empty string.' }
  }
  if (typeof p.theme !== 'string' || !(THEMES as readonly string[]).includes(p.theme)) {
    return {
      valid: false,
      error: `Profile theme must be one of: ${THEMES.join(', ')}. Received "${String(p.theme)}".`,
    }
  }
  if (typeof p.onboarding !== 'boolean') {
    return { valid: false, error: 'Profile onboarding status must be a boolean.' }
  }
  if (typeof p.target !== 'number' || !Number.isInteger(p.target) || p.target < 1) {
    return {
      valid: false,
      error: 'Profile daily target must be an integer greater than or equal to 1.',
    }
  }
  if (p.weekStart !== 0 && p.weekStart !== 1) {
    return { valid: false, error: 'Profile weekStart must be 0 (Sunday) or 1 (Monday).' }
  }
  if (typeof p.reducedMotion !== 'boolean') {
    return { valid: false, error: 'Profile reducedMotion must be a boolean.' }
  }

  return {
    valid: true,
    data: {
      name: p.name,
      avatar: p.avatar,
      theme: p.theme as Profile['theme'],
      onboarding: p.onboarding,
      target: p.target,
      weekStart: p.weekStart,
      reducedMotion: p.reducedMotion,
    },
  }
}

export function validateQuestRecord(
  quest: unknown,
  index: number,
): { valid: true; data: Quest } | { valid: false; error: string } {
  if (!quest || typeof quest !== 'object' || Array.isArray(quest)) {
    return { valid: false, error: `Quest at index ${index} must be an object.` }
  }
  const q = quest as Record<string, unknown>
  const label = typeof q.id === 'string' && q.id ? `Quest "${q.id}"` : `Quest at index ${index}`

  if (typeof q.id !== 'string' || !q.id.trim()) {
    return { valid: false, error: `${label} must have a non-empty string ID.` }
  }
  if (typeof q.title !== 'string' || !q.title.trim()) {
    return { valid: false, error: `${label} must have a non-empty title.` }
  }
  if (typeof q.description !== 'string') {
    return { valid: false, error: `${label} description must be a string.` }
  }
  if (typeof q.icon !== 'string' || !q.icon.trim()) {
    return { valid: false, error: `${label} must have a non-empty icon.` }
  }
  if (typeof q.category !== 'string' || !(CATEGORIES as readonly string[]).includes(q.category)) {
    return {
      valid: false,
      error: `${label} category must be one of: ${CATEGORIES.join(', ')}. Received "${String(q.category)}".`,
    }
  }
  if (
    typeof q.difficulty !== 'string' ||
    !(DIFFICULTIES as readonly string[]).includes(q.difficulty)
  ) {
    return {
      valid: false,
      error: `${label} difficulty must be one of: ${DIFFICULTIES.join(', ')}. Received "${String(q.difficulty)}".`,
    }
  }
  if (typeof q.xp !== 'number' || !Number.isInteger(q.xp) || q.xp < 0) {
    return { valid: false, error: `${label} XP must be a non-negative integer.` }
  }
  if (typeof q.duration !== 'number' || !Number.isInteger(q.duration) || q.duration < 0) {
    return { valid: false, error: `${label} duration must be a non-negative integer.` }
  }
  if (
    typeof q.frequency !== 'string' ||
    !(FREQUENCIES as readonly string[]).includes(q.frequency)
  ) {
    return {
      valid: false,
      error: `${label} frequency must be one of: ${FREQUENCIES.join(', ')}. Received "${String(q.frequency)}".`,
    }
  }

  if (
    !Array.isArray(q.weekdays) ||
    !q.weekdays.every((d) => typeof d === 'number' && Number.isInteger(d) && d >= 0 && d <= 6)
  ) {
    return {
      valid: false,
      error: `${label} weekdays must be an array of day numbers from 0 to 6.`,
    }
  }
  const uniqueWeekdays = new Set(q.weekdays)
  if (uniqueWeekdays.size !== q.weekdays.length) {
    return { valid: false, error: `${label} weekdays array must not contain duplicate days.` }
  }
  if (q.frequency === 'Custom' && q.weekdays.length === 0) {
    return {
      valid: false,
      error: `${label} with Custom frequency must repeat on at least one weekday.`,
    }
  }

  if (typeof q.startDate !== 'string' || !isValidCalendarDate(q.startDate)) {
    return {
      valid: false,
      error: `${label} startDate "${String(q.startDate)}" must be a valid calendar date in YYYY-MM-DD format.`,
    }
  }

  if (q.endDate !== undefined && q.endDate !== null) {
    if (typeof q.endDate !== 'string' || !isValidCalendarDate(q.endDate)) {
      return {
        valid: false,
        error: `${label} endDate "${String(q.endDate)}" must be a valid calendar date in YYYY-MM-DD format.`,
      }
    }
    if (q.endDate < q.startDate) {
      return {
        valid: false,
        error: `${label} endDate "${q.endDate}" cannot precede startDate "${q.startDate}".`,
      }
    }
  }

  if (typeof q.status !== 'string' || !(QUEST_STATUSES as readonly string[]).includes(q.status)) {
    return {
      valid: false,
      error: `${label} status must be one of: ${QUEST_STATUSES.join(', ')}. Received "${String(q.status)}".`,
    }
  }

  if (typeof q.createdAt !== 'string' || !isValidIsoDateTime(q.createdAt)) {
    return { valid: false, error: `${label} createdAt must be a valid ISO date-time string.` }
  }

  return {
    valid: true,
    data: {
      id: q.id,
      title: q.title,
      description: q.description,
      icon: q.icon,
      category: q.category as Quest['category'],
      difficulty: q.difficulty as Quest['difficulty'],
      xp: q.xp,
      duration: q.duration,
      frequency: q.frequency as Quest['frequency'],
      weekdays: [...q.weekdays],
      startDate: q.startDate,
      ...(q.endDate ? { endDate: q.endDate } : {}),
      status: q.status as Quest['status'],
      createdAt: q.createdAt,
    },
  }
}

export function validateCompletionRecord(
  completion: unknown,
  index: number,
  questIds: Set<string>,
): { valid: true; data: Completion } | { valid: false; error: string } {
  if (!completion || typeof completion !== 'object' || Array.isArray(completion)) {
    return { valid: false, error: `Completion at index ${index} must be an object.` }
  }
  const c = completion as Record<string, unknown>
  const label =
    typeof c.id === 'string' && c.id ? `Completion "${c.id}"` : `Completion at index ${index}`

  if (typeof c.id !== 'string' || !c.id.trim()) {
    return { valid: false, error: `${label} must have a non-empty string ID.` }
  }
  if (typeof c.questId !== 'string' || !c.questId.trim()) {
    return { valid: false, error: `${label} must have a non-empty questId.` }
  }
  if (!questIds.has(c.questId)) {
    return {
      valid: false,
      error: `${label} references unknown quest ID "${c.questId}".`,
    }
  }
  if (typeof c.date !== 'string' || !isValidCalendarDate(c.date)) {
    return {
      valid: false,
      error: `${label} date "${String(c.date)}" must be a valid calendar date in YYYY-MM-DD format.`,
    }
  }
  if (typeof c.completedAt !== 'string' || !isValidIsoDateTime(c.completedAt)) {
    return { valid: false, error: `${label} completedAt must be a valid ISO date-time string.` }
  }
  if (typeof c.xp !== 'number' || !Number.isInteger(c.xp) || c.xp < 0) {
    return { valid: false, error: `${label} XP must be a non-negative integer.` }
  }

  return {
    valid: true,
    data: {
      id: c.id,
      questId: c.questId,
      date: c.date,
      completedAt: c.completedAt,
      xp: c.xp,
    },
  }
}

export function validateUnlockedAchievements(
  unlocked: unknown,
): { valid: true; data: string[] } | { valid: false; error: string } {
  if (!Array.isArray(unlocked)) {
    return { valid: false, error: 'Unlocked achievements must be an array.' }
  }
  for (const item of unlocked) {
    if (
      typeof item !== 'string' ||
      !(ACHIEVEMENT_IDS as readonly string[]).includes(item)
    ) {
      return {
        valid: false,
        error: `Invalid unlocked achievement ID: "${String(item)}".`,
      }
    }
  }
  return {
    valid: true,
    data: [...new Set(unlocked as string[])],
  }
}

export function validateAndMigrateBackup(raw: unknown): BackupValidationResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { success: false, error: 'Backup data must be a JSON object.' }
  }

  const obj = raw as Record<string, unknown>
  let isMigrated = false
  const rawVersion = obj.version

  if (rawVersion === undefined) {
    isMigrated = true
  } else if (
    typeof rawVersion !== 'number' ||
    !Number.isInteger(rawVersion) ||
    rawVersion < 1
  ) {
    return {
      success: false,
      error: `Invalid backup schema version: "${String(rawVersion)}". Expected an integer >= 1.`,
    }
  } else if (rawVersion > CURRENT_BACKUP_VERSION) {
    return {
      success: false,
      error: `Unsupported backup schema version: ${rawVersion}. This version of QuestHabit supports up to version ${CURRENT_BACKUP_VERSION}.`,
    }
  }

  if (!isMigrated) {
    if (obj.exportedAt === undefined || obj.exportedAt === null) {
      return {
        success: false,
        error: 'Backup is missing required "exportedAt" timestamp.',
      }
    }
    if (typeof obj.exportedAt !== 'string' || !isValidIsoDateTime(obj.exportedAt)) {
      return {
        success: false,
        error: 'Backup exportedAt must be a valid ISO date-time string.',
      }
    }
  }

  if (!obj.profile || typeof obj.profile !== 'object' || Array.isArray(obj.profile)) {
    return { success: false, error: 'Backup is missing a valid profile object.' }
  }
  if (!Array.isArray(obj.quests)) {
    return { success: false, error: 'Backup is missing a valid quests array.' }
  }
  if (!Array.isArray(obj.completions)) {
    return { success: false, error: 'Backup is missing a valid completions array.' }
  }

  // Handle migration defaults for unversioned backups
  const profileToValidate = isMigrated
    ? { ...blankState().profile, ...obj.profile }
    : obj.profile

  const unlockedToValidate =
    obj.unlocked === undefined && isMigrated ? [] : obj.unlocked

  const profileRes = validateProfile(profileToValidate)
  if (!profileRes.valid) {
    return { success: false, error: profileRes.error }
  }

  const questIds = new Set<string>()
  const validatedQuests: Quest[] = []
  for (let i = 0; i < obj.quests.length; i++) {
    const qRes = validateQuestRecord(obj.quests[i], i)
    if (!qRes.valid) {
      return { success: false, error: qRes.error }
    }
    if (questIds.has(qRes.data.id)) {
      return { success: false, error: `Duplicate quest ID found: "${qRes.data.id}".` }
    }
    questIds.add(qRes.data.id)
    validatedQuests.push(qRes.data)
  }

  const completionIds = new Set<string>()
  const validatedCompletions: Completion[] = []
  for (let i = 0; i < obj.completions.length; i++) {
    const cRes = validateCompletionRecord(obj.completions[i], i, questIds)
    if (!cRes.valid) {
      return { success: false, error: cRes.error }
    }
    if (completionIds.has(cRes.data.id)) {
      return {
        success: false,
        error: `Duplicate completion ID found: "${cRes.data.id}".`,
      }
    }
    completionIds.add(cRes.data.id)
    validatedCompletions.push(cRes.data)
  }

  const unlockedRes = validateUnlockedAchievements(unlockedToValidate)
  if (!unlockedRes.valid) {
    return { success: false, error: unlockedRes.error }
  }

  return {
    success: true,
    state: {
      profile: profileRes.data,
      quests: validatedQuests,
      completions: validatedCompletions,
      unlocked: unlockedRes.data,
    },
    version: CURRENT_BACKUP_VERSION,
    migrated: isMigrated,
  }
}

export function createBackup(state: AppState): VersionedBackup {
  return {
    version: CURRENT_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    profile: { ...state.profile },
    quests: state.quests.map((q) => ({ ...q, weekdays: [...q.weekdays] })),
    completions: state.completions.map((c) => ({ ...c })),
    unlocked: [...state.unlocked],
  }
}

export function exportBackup(state: AppState): string {
  return JSON.stringify(createBackup(state), null, 2)
}

export function parseAndValidateBackup(jsonString: string): BackupValidationResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch {
    return { success: false, error: 'The selected backup file is not valid JSON.' }
  }
  return validateAndMigrateBackup(parsed)
}

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
