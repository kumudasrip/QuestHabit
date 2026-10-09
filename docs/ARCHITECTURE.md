# Architecture

QuestHabit is a static React application with no server runtime.

## Boundaries

- `src/App.tsx` owns route composition, page-level UI, and interaction wiring.
- `src/lib/game.ts` contains pure domain rules for XP, levels, ranks, dates, schedules, and streaks.
- `src/lib/storage.ts` is the only local persistence boundary. It validates the top-level state shape, merges optional defaults, and catches read/write failures.
- `src/styles.css` contains the design tokens, component styles, themes, and responsive rules.

## Data flow

The root `App` loads a state snapshot once, renders the route tree, and passes an `update` callback to pages. Meaningful updates replace the immutable state object. A React effect serializes that state to `localStorage`. Derived values such as XP totals, levels, streaks, and category counts are calculated from quests and completion records instead of being maintained as competing copies.

Completion records include the XP reward at completion time. This preserves historical rewards if a quest is edited later. The completion key is the quest ID plus local calendar date, so toggling a completion cannot award the same quest twice on one day.

## Deployment

Vite emits static assets to `dist/`. React Router runs in the browser and does not require an API server. Vercel hosts the static output only.
