# Contributing to QuestHabit

## Welcome

QuestHabit is a local-first habit tracker for people who enjoy a little RPG energy in their daily routines. First-time contributors are welcome: start with a focused issue, ask questions early, and keep the privacy-first architecture intact.

## Ways to contribute

Bug fixes, UI/UX improvements, habit templates, achievement definitions, avatar and cosmetic designs, themes, accessibility, responsive design, analytics, testing, documentation, and performance improvements are all useful contributions.

## Development setup

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

Use a current Node.js LTS release. Do not commit `node_modules/`, `dist/`, local environment files, or personal browser data.

## Branch naming

Use a short, descriptive branch name:

- `feat/quest-filters`
- `fix/streak-calculation`
- `docs/readme-improvements`
- `test/xp-progression`

## Issue workflow

1. Search existing issues before opening a new one.
2. Explain the problem, use case, or proposed feature.
3. Discuss substantial changes before implementing them.
4. Wait for maintainer assignment or approval when coordination is needed.
5. Avoid starting duplicate implementations.

## Pull request guidelines

Keep pull requests focused. Include the motivation, a summary of changes, related issue links, screenshots for relevant visual changes, testing performed, documentation updates, and accessibility considerations. Avoid unrelated formatting changes. Confirm that no backend, API, cloud database, or remote data persistence was introduced.

## Code conventions

- Use precise TypeScript types.
- Follow existing React patterns and reuse existing UI styles.
- Keep business logic in pure helpers rather than duplicating it in components.
- Do not duplicate XP, streak, scheduling, or achievement rules.
- Use accessible HTML, labels, focus states, and keyboard-friendly interactions.
- Add tests when changing progression, scheduling, persistence, import/export, or achievement behavior.

## Local-first rule

QuestHabit must remain frontend-only. Do not introduce backend services, cloud databases, authentication providers, server-side APIs, serverless functions, or external services that transmit habit data. Cross-device synchronization is deliberately out of scope.

## Good first issues

Examples include adding a thoughtful template, defining a new achievement, designing a cosmetic pack, improving a theme, adding a chart, covering an edge case with a unit test, improving keyboard navigation, or expanding documentation. Coordinate through GitHub Issues so work is not duplicated.
