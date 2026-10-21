import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CURRENT_BACKUP_VERSION,
  STORAGE_KEY,
  createBackup,
  exportBackup,
  loadState,
  parseAndValidateBackup,
  saveState,
  validateAndMigrateBackup,
} from './storage'
import { AppState, Completion, Quest, blankState } from './game'

// Build a minimal valid state from the app's own helper
const validState = (): AppState => ({
  ...blankState(),
  profile: { ...blankState().profile, name: 'Tester' },
})

const sampleQuest = (overrides: Partial<Quest> = {}): Quest => ({
  id: 'q1',
  title: 'Morning Run',
  description: 'Run around the block',
  icon: '🏃',
  category: 'Health',
  difficulty: 'Medium',
  xp: 25,
  duration: 30,
  frequency: 'Daily',
  weekdays: [],
  startDate: '2026-01-01',
  status: 'active',
  createdAt: '2026-01-01T08:00:00.000Z',
  ...overrides,
})

const sampleCompletion = (overrides: Partial<Completion> = {}): Completion => ({
  id: 'c1',
  questId: 'q1',
  date: '2026-01-02',
  completedAt: '2026-01-02T09:30:00.000Z',
  xp: 25,
  ...overrides,
})

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('loadState', () => {
  it('returns a blank state when storage is empty', () => {
    const { state, recovered } = loadState()
    expect(recovered).toBe(false)
    expect(state).toEqual(blankState())
  })

  it('loads valid stored data', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validState()))
    const { state, recovered } = loadState()
    expect(recovered).toBe(false)
    expect(state.profile.name).toBe('Tester')
  })

  it('recovers to a blank state on malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json')
    const { state, recovered } = loadState()
    expect(recovered).toBe(true)
    expect(state).toEqual(blankState())
  })

  it('recovers when required top-level fields are missing', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile: { name: 'x' } }))
    const { recovered } = loadState()
    expect(recovered).toBe(true)
  })
})

describe('saveState', () => {
  it('serializes state under the questhabit.state key', () => {
    expect(saveState(validState())).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(validState()))
  })

  it('returns false when localStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded')
    })
    expect(saveState(validState())).toBe(false)
  })
})

describe('createBackup & exportBackup', () => {
  it('creates a versioned backup object with schema version 1 and metadata', () => {
    const state: AppState = {
      ...validState(),
      quests: [sampleQuest()],
      completions: [sampleCompletion()],
      unlocked: ['first'],
    }
    const backup = createBackup(state)
    expect(backup.version).toBe(CURRENT_BACKUP_VERSION)
    expect(backup.exportedAt).toBeDefined()
    expect(backup.profile.name).toBe('Tester')
    expect(backup.quests).toHaveLength(1)
    expect(backup.completions).toHaveLength(1)
    expect(backup.unlocked).toEqual(['first'])
  })

  it('exports a valid serialized JSON string containing schema version', () => {
    const state = validState()
    const json = exportBackup(state)
    const parsed = JSON.parse(json)
    expect(parsed.version).toBe(1)
    expect(parsed.profile.name).toBe('Tester')
  })
})

describe('backup validation and schema migration', () => {
  it('validates a valid current v1 backup successfully', () => {
    const backup = {
      version: 1,
      exportedAt: '2026-01-02T10:00:00.000Z',
      profile: {
        name: 'Adventurer',
        avatar: '🧙',
        theme: 'midnight',
        onboarding: true,
        target: 3,
        weekStart: 1,
        reducedMotion: false,
      },
      quests: [sampleQuest()],
      completions: [sampleCompletion()],
      unlocked: ['first', 'streak3'],
    }

    const result = validateAndMigrateBackup(backup)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.version).toBe(1)
      expect(result.migrated).toBe(false)
      expect(result.state.profile.name).toBe('Adventurer')
      expect(result.state.quests).toHaveLength(1)
      expect(result.state.completions).toHaveLength(1)
      expect(result.state.unlocked).toEqual(['first', 'streak3'])
    }
  })

  it('migrates an unversioned legacy backup to v1 successfully', () => {
    const legacyBackup = {
      profile: {
        name: 'Legacy Hero',
        avatar: '🛡️',
        theme: 'forest',
        onboarding: true,
      },
      quests: [sampleQuest({ id: 'legacy-q', xp: 50 })],
      completions: [
        sampleCompletion({
          id: 'legacy-c',
          questId: 'legacy-q',
          date: '2026-02-14',
          xp: 40, // Historical XP deliberately different from quest current XP
        }),
      ],
    }

    const result = validateAndMigrateBackup(legacyBackup)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.version).toBe(1)
      expect(result.migrated).toBe(true)
      expect(result.state.profile.name).toBe('Legacy Hero')
      // Missing profile fields should have defaults applied
      expect(result.state.profile.target).toBe(3)
      expect(result.state.profile.weekStart).toBe(1)
      expect(result.state.profile.reducedMotion).toBe(false)
      // Missing unlocked defaults to empty array
      expect(result.state.unlocked).toEqual([])
      // Historical completion XP must NOT be recalculated to match quest XP
      expect(result.state.completions[0].xp).toBe(40)
      // Calendar date must remain untouched
      expect(result.state.completions[0].date).toBe('2026-02-14')
    }
  })

  it('rejects invalid JSON string in parseAndValidateBackup', () => {
    const result = parseAndValidateBackup('{not json')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/valid JSON/i)
    }
  })

  it('rejects non-object backup root', () => {
    expect(validateAndMigrateBackup(null).success).toBe(false)
    expect(validateAndMigrateBackup([]).success).toBe(false)
    expect(validateAndMigrateBackup('string').success).toBe(false)
  })

  it('rejects unsupported backup versions', () => {
    const futureBackup = {
      version: 99,
      profile: blankState().profile,
      quests: [],
      completions: [],
    }
    const result = validateAndMigrateBackup(futureBackup)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Unsupported backup schema version: 99')
    }

    const invalidVersion = {
      version: -1,
      profile: blankState().profile,
      quests: [],
      completions: [],
    }
    expect(validateAndMigrateBackup(invalidVersion).success).toBe(false)

    const stringVersion = {
      version: '1',
      profile: blankState().profile,
      quests: [],
      completions: [],
    }
    expect(validateAndMigrateBackup(stringVersion).success).toBe(false)
  })

  it('rejects backup with missing top-level arrays or objects', () => {
    expect(
      validateAndMigrateBackup({ quests: [], completions: [] }).success,
    ).toBe(false)
    expect(
      validateAndMigrateBackup({
        profile: blankState().profile,
        completions: [],
      }).success,
    ).toBe(false)
    expect(
      validateAndMigrateBackup({
        profile: blankState().profile,
        quests: [],
      }).success,
    ).toBe(false)
  })

  it('rejects invalid profile fields', () => {
    const base = {
      version: 1,
      profile: { ...blankState().profile },
      quests: [],
      completions: [],
      unlocked: [],
    }

    // Invalid theme
    expect(
      validateAndMigrateBackup({
        ...base,
        profile: { ...base.profile, theme: 'neon' },
      }).success,
    ).toBe(false)

    // Non-string name
    expect(
      validateAndMigrateBackup({
        ...base,
        profile: { ...base.profile, name: 123 },
      }).success,
    ).toBe(false)

    // Empty avatar
    expect(
      validateAndMigrateBackup({
        ...base,
        profile: { ...base.profile, avatar: '   ' },
      }).success,
    ).toBe(false)

    // Invalid weekStart
    expect(
      validateAndMigrateBackup({
        ...base,
        profile: { ...base.profile, weekStart: 2 },
      }).success,
    ).toBe(false)

    // Invalid target (less than 1)
    expect(
      validateAndMigrateBackup({
        ...base,
        profile: { ...base.profile, target: 0 },
      }).success,
    ).toBe(false)

    // Non-boolean reducedMotion
    expect(
      validateAndMigrateBackup({
        ...base,
        profile: { ...base.profile, reducedMotion: 'false' },
      }).success,
    ).toBe(false)
  })

  it('rejects invalid quest fields', () => {
    const base = {
      version: 1,
      profile: blankState().profile,
      quests: [sampleQuest()],
      completions: [],
      unlocked: [],
    }

    // Empty quest title
    const badTitle = {
      ...base,
      quests: [sampleQuest({ title: '   ' })],
    }
    expect(validateAndMigrateBackup(badTitle).success).toBe(false)

    // Invalid category
    const badCategory = {
      ...base,
      quests: [{ ...sampleQuest(), category: 'Sorcery' }],
    }
    expect(validateAndMigrateBackup(badCategory).success).toBe(false)

    // Invalid difficulty
    const badDiff = {
      ...base,
      quests: [{ ...sampleQuest(), difficulty: 'Nightmare' }],
    }
    expect(validateAndMigrateBackup(badDiff).success).toBe(false)

    // Negative XP
    const badXP = {
      ...base,
      quests: [sampleQuest({ xp: -10 })],
    }
    expect(validateAndMigrateBackup(badXP).success).toBe(false)

    // Negative duration
    const badDur = {
      ...base,
      quests: [sampleQuest({ duration: -5 })],
    }
    expect(validateAndMigrateBackup(badDur).success).toBe(false)

    // Custom frequency without weekdays
    const badCustom = {
      ...base,
      quests: [sampleQuest({ frequency: 'Custom', weekdays: [] })],
    }
    expect(validateAndMigrateBackup(badCustom).success).toBe(false)

    // Invalid weekday number
    const badWeekday = {
      ...base,
      quests: [sampleQuest({ frequency: 'Custom', weekdays: [7] })],
    }
    expect(validateAndMigrateBackup(badWeekday).success).toBe(false)

    // Duplicate weekdays
    const dupWeekdays = {
      ...base,
      quests: [sampleQuest({ frequency: 'Custom', weekdays: [1, 1] })],
    }
    expect(validateAndMigrateBackup(dupWeekdays).success).toBe(false)

    // Invalid startDate format
    const badStartDate = {
      ...base,
      quests: [sampleQuest({ startDate: '2026/01/01' })],
    }
    expect(validateAndMigrateBackup(badStartDate).success).toBe(false)

    // Non-existent calendar date
    const nonExistentDate = {
      ...base,
      quests: [sampleQuest({ startDate: '2026-02-30' })],
    }
    expect(validateAndMigrateBackup(nonExistentDate).success).toBe(false)

    // endDate preceding startDate
    const badEndDate = {
      ...base,
      quests: [
        sampleQuest({ startDate: '2026-03-10', endDate: '2026-03-01' }),
      ],
    }
    expect(validateAndMigrateBackup(badEndDate).success).toBe(false)

    // Invalid status
    const badStatus = {
      ...base,
      quests: [{ ...sampleQuest(), status: 'deleted' }],
    }
    expect(validateAndMigrateBackup(badStatus).success).toBe(false)

    // Invalid createdAt
    const badCreatedAt = {
      ...base,
      quests: [sampleQuest({ createdAt: 'invalid-time' })],
    }
    expect(validateAndMigrateBackup(badCreatedAt).success).toBe(false)
  })

  it('detects and rejects duplicate quest IDs', () => {
    const backup = {
      version: 1,
      profile: blankState().profile,
      quests: [
        sampleQuest({ id: 'quest-duplicate', title: 'Quest A' }),
        sampleQuest({ id: 'quest-duplicate', title: 'Quest B' }),
      ],
      completions: [],
      unlocked: [],
    }

    const result = validateAndMigrateBackup(backup)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Duplicate quest ID found: "quest-duplicate"')
    }
  })

  it('detects and rejects duplicate completion IDs', () => {
    const backup = {
      version: 1,
      profile: blankState().profile,
      quests: [sampleQuest({ id: 'q1' })],
      completions: [
        sampleCompletion({ id: 'comp-dup', questId: 'q1', date: '2026-01-01' }),
        sampleCompletion({ id: 'comp-dup', questId: 'q1', date: '2026-01-02' }),
      ],
      unlocked: [],
    }

    const result = validateAndMigrateBackup(backup)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Duplicate completion ID found: "comp-dup"')
    }
  })

  it('rejects completions that reference unknown quests', () => {
    const backup = {
      version: 1,
      profile: blankState().profile,
      quests: [sampleQuest({ id: 'real-quest' })],
      completions: [
        sampleCompletion({ id: 'c1', questId: 'non-existent-quest' }),
      ],
      unlocked: [],
    }

    const result = validateAndMigrateBackup(backup)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain(
        'Completion "c1" references unknown quest ID "non-existent-quest"',
      )
    }
  })

  it('rejects invalid completion fields', () => {
    const base = {
      version: 1,
      profile: blankState().profile,
      quests: [sampleQuest({ id: 'q1' })],
      completions: [sampleCompletion({ questId: 'q1' })],
      unlocked: [],
    }

    // Invalid calendar date
    const badDate = {
      ...base,
      completions: [
        sampleCompletion({ questId: 'q1', date: '2026-13-45' }),
      ],
    }
    expect(validateAndMigrateBackup(badDate).success).toBe(false)

    // Negative completion XP
    const badXP = {
      ...base,
      completions: [sampleCompletion({ questId: 'q1', xp: -5 })],
    }
    expect(validateAndMigrateBackup(badXP).success).toBe(false)

    // Invalid completedAt
    const badCompletedAt = {
      ...base,
      completions: [
        sampleCompletion({ questId: 'q1', completedAt: 'not-iso' }),
      ],
    }
    expect(validateAndMigrateBackup(badCompletedAt).success).toBe(false)
  })

  it('rejects invalid unlocked achievement IDs and deduplicates valid ones', () => {
    const invalidAchievement = {
      version: 1,
      profile: blankState().profile,
      quests: [],
      completions: [],
      unlocked: ['first', 'not_a_real_achievement'],
    }
    const failResult = validateAndMigrateBackup(invalidAchievement)
    expect(failResult.success).toBe(false)
    if (!failResult.success) {
      expect(failResult.error).toContain(
        'Invalid unlocked achievement ID: "not_a_real_achievement"',
      )
    }

    const duplicateAchievements = {
      version: 1,
      profile: blankState().profile,
      quests: [],
      completions: [],
      unlocked: ['first', 'streak3', 'first'],
    }
    const passResult = validateAndMigrateBackup(duplicateAchievements)
    expect(passResult.success).toBe(true)
    if (passResult.success) {
      expect(passResult.state.unlocked).toEqual(['first', 'streak3'])
    }
  })

  it('preserves existing state when import validation fails (atomic behavior)', () => {
    // Set initial state in storage
    const initial = validState()
    saveState(initial)

    // Attempt to parse corrupt backup
    const corruptJson = JSON.stringify({
      version: 1,
      profile: { ...blankState().profile },
      quests: [sampleQuest({ id: 'dup' }), sampleQuest({ id: 'dup' })],
      completions: [],
      unlocked: [],
    })

    const result = parseAndValidateBackup(corruptJson)
    expect(result.success).toBe(false)

    // Ensure state in storage was not changed or corrupted
    const { state: currentStorageState } = loadState()
    expect(currentStorageState.profile.name).toBe('Tester')
    expect(currentStorageState.quests).toEqual([])
  })
})