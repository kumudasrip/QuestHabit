# QuestHabit

**Small quests. Epic growth.**

QuestHabit is a gamified habit tracker that turns everyday activities into quests, XP, levels, streaks, achievements, and personal progress. It is a frontend-only, local-first React application: no account is required and user history remains in the visitor's browser.

> Deploying QuestHabit to Vercel hosts the static frontend. It does **not** send or store habit history in Vercel.

## Badges

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF.svg)](https://vite.dev/)

The repository URL and CI badge are intentionally omitted until this project is published to GitHub.

## Screenshots and demo

Screenshots should be added to `docs/images/` after a deployment is available. Do not treat this section as a live demo link: no public demo URL has been configured yet.

## Features

- First-use onboarding with display name and avatar selection
- Quest creation, editing, archiving, reactivation, deletion, search, and category filtering
- Daily, weekday, weekly, and custom schedule support in the scheduling engine
- One completion and one historical XP reward per quest and local calendar date
- XP progression, levels, ranks, current and longest streaks
- Achievement collection with derived unlock conditions
- Habit Library templates
- Calendar activity history and category progress insights
- Avatar and cosmetic reward screen
- Midnight, Forest, Ember, and Light themes
- JSON export, validated import, and local reset
- Responsive desktop sidebar and mobile navigation

## Tech stack

- React and React Router for the application UI and navigation
- TypeScript for type-safe domain models
- Vite for development and static production builds
- Lucide React for icons
- Vitest for pure game-logic tests
- ESLint and Prettier for code quality
- Browser `localStorage` for local persistence

## Getting started

```bash
git clone <YOUR_REPOSITORY_URL>
cd QuestHabit
npm install
npm run dev
```

`<YOUR_REPOSITORY_URL>` is a placeholder until the actual GitHub repository is known.

Available commands:

```bash
npm run dev       # Start the Vite development server
npm run typecheck # Run TypeScript's project check
npm run lint      # Run ESLint
npm test          # Run Vitest once
npm run build     # Type-check and create dist/
npm run format    # Format the repository with Prettier
```

## How local storage works

QuestHabit stores the profile, preferences, quests, completions, and achievement state in the browser under `questhabit.state`. No login is required. Data survives refreshes and reopening the site in the same browser profile, subject to browser storage policies.

- Different browsers and devices have separate data.
- Clearing site data can erase progress.
- Private browsing and storage restrictions may prevent persistence.
- Export a JSON backup before moving browsers or resetting local data.
- Import requires a valid backup and explicit confirmation before replacement.
- Storage parsing and writes fail safely with a recovery message rather than silently pretending data was saved.

Vercel serves the static application assets. It does not become a database or synchronization service.

## Project structure

```text
src/
  App.tsx              UI, routes, page composition, and user interactions
  main.tsx             React entry point
  styles.css           Design system and responsive layout
  lib/
    game.ts            Pure quest, XP, date, scheduling, and streak rules
    storage.ts         Validated localStorage load/save boundary
    game.test.ts       Core progression, streak, and scheduling tests
.github/workflows/     Continuous integration
docs/                  Architecture, storage, and roadmap documentation
```

## Deployment on Vercel

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Choose the Vite framework preset if Vercel does not detect it automatically.
4. Use `npm run build` as the build command.
5. Use `dist` as the output directory.
6. Deploy.
7. On the deployed URL, create a quest, complete it, refresh the page, and confirm the progress remains.

The app uses browser-history routing through React Router. `vercel.json` rewrites browser requests to the static `index.html` entry point so direct route navigation and refreshes work; no serverless function or API is needed.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md). Contributions are welcome for templates, achievements, cosmetics, themes, accessibility, responsive design, analytics, tests, documentation, and performance.

## Roadmap

Completed functionality is listed above. Proposed enhancements are tracked in [docs/ROADMAP.md](./docs/ROADMAP.md), including richer charting, dedicated component modules, stronger backup schema migrations, and broader automated UI coverage.

## License

QuestHabit is released under the [MIT License](./LICENSE).
