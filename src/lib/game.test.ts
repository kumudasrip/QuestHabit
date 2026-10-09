import { describe, expect, it } from 'vitest'
import { dueOn, levelInfo, streak, type Completion, type Quest } from './game'

const quest = (overrides: Partial<Quest> = {}): Quest => ({
  id: 'q1', title: 'Test quest', description: '', icon: '✨', category: 'Health',
  difficulty: 'Easy', xp: 10, duration: 5, frequency: 'Daily', weekdays: [],
  startDate: '2026-01-01', status: 'active', createdAt: '2026-01-01T00:00:00.000Z', ...overrides,
})
const completion = (date: string): Completion => ({ id: date, questId: 'q1', date, completedAt: `${date}T10:00:00.000Z`, xp: 10 })

describe('progression rules', () => {
  it('calculates level boundaries deterministically', () => {
    expect(levelInfo(0)).toMatchObject({ level: 1, current: 0, need: 100 })
    expect(levelInfo(100)).toMatchObject({ level: 2, current: 0, need: 150 })
    expect(levelInfo(250)).toMatchObject({ level: 3, current: 0, need: 200 })
  })

  it('counts one active day once and preserves the longest streak', () => {
    expect(streak([completion('2026-01-03'), completion('2026-01-02'), completion('2026-01-02'), completion('2026-01-01')])).toMatchObject({ longest: 3 })
  })
})

describe('scheduling rules', () => {
  it('supports weekday schedules without UTC shifting', () => {
    expect(dueOn(quest({ frequency: 'Weekdays' }), '2026-01-05')).toBe(true)
    expect(dueOn(quest({ frequency: 'Weekdays' }), '2026-01-04')).toBe(false)
    expect(dueOn(quest({ frequency: 'Custom', weekdays: [0] }), '2026-01-04')).toBe(true)
  })
})
