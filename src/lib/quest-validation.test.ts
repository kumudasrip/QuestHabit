import { describe, expect, it } from "vitest";
import { getQuestValidationErrors, isValidQuest, validateQuest } from "./game";

const valid = {
  title: "Read",
  xp: 20,
  duration: 15,
  frequency: "Daily" as const,
  weekdays: [],
};

describe("numeric quest validation", () => {
  it.each([0, 4, 101, -1, 5.5, NaN, Infinity])(
    "rejects invalid XP %s at the shared validation boundary",
    (xp) => {
      const quest = { ...valid, xp };
      expect(getQuestValidationErrors(quest).xp).toBe(
        "XP reward must be a whole number from 5 to 100.",
      );
      expect(isValidQuest(quest)).toBe(false);
      expect(validateQuest(quest).valid).toBe(false);
    },
  );
  it.each([-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid duration %s",
    (duration) => {
      expect(getQuestValidationErrors({ ...valid, duration }).duration).toBe(
        "Duration must be a non-negative whole number of minutes.",
      );
      expect(isValidQuest({ ...valid, duration })).toBe(false);
    },
  );
  it.each([5, 100])(
    "accepts existing XP boundaries %s and zero-minute duration",
    (xp) => {
      expect(validateQuest({ ...valid, xp, duration: 0 })).toEqual({
        valid: true,
      });
    },
  );
  it("reports title, numbers and custom weekdays together without mutating the input", () => {
    const quest = Object.freeze({
      ...valid,
      title: " ",
      xp: NaN,
      duration: -1,
      frequency: "Custom" as const,
    });
    expect(Object.keys(getQuestValidationErrors(quest))).toEqual([
      "title",
      "xp",
      "duration",
      "weekdays",
    ]);
    expect(quest.duration).toBe(-1);
  });
});
