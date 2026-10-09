# Contributing to QuestHabit

Thank you for considering a contribution to QuestHabit. The project is a small, local-first habit tracker with an RPG-inspired interface. Contributions should make the product clearer, more useful, more accessible, or easier to maintain while preserving the privacy model.

## Ways to contribute

You can help with:

- Bug fixes and reliability improvements
- UI/UX and responsive design
- New habit templates and achievement definitions
- Avatar, cosmetic, and theme design
- Accessibility and keyboard interaction
- Analytics and progress visualizations
- Unit and browser-level testing
- Documentation and contributor experience
- Performance improvements

## Prerequisites and setup

Use a current Node.js LTS release and npm.

```bash
npm install
npm run dev
```

Before opening a pull request, run the checks that apply to your change:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Do not commit `node_modules/`, `dist/`, environment files, or personal browser data.

## Your first contribution

1. Look through the repository and search existing issues.
2. Choose a small issue or open a discussion for a new idea.
3. Comment on the issue with the approach you intend to take so work can be coordinated.
4. Create a focused branch.
5. Make the smallest complete change, adding tests or documentation where appropriate.
6. Run the relevant checks locally.
7. Open a pull request with the requested context and verification details.

Substantial changes should be discussed before implementation. Please wait for maintainer feedback when an issue needs coordination, and avoid starting a duplicate implementation.

## Finding and claiming issues

Search existing issues first. A useful issue description explains:

```text
Problem: Completing a weekday quest on Sunday currently appears in the daily list.
Steps: Create a weekday quest, choose Sunday, open the dashboard on Sunday.
Expected: The quest is not due.
Actual: The quest is displayed.
Environment: Browser, OS, and commit or deployment.
```

If you want to work on an issue, leave a short comment describing your intended approach. This is coordination, not a promise that the issue will be assigned.

Good first issues include adding a well-scoped template, covering a date edge case with a unit test, improving focus states, adding a cosmetic option, or clarifying documentation.

## Branch naming

Use a short, descriptive prefix:

- `feat/quest-filters`
- `fix/streak-calculation`
- `docs/readme-improvements`
- `test/xp-progression`

## Coding and accessibility conventions

- Use precise TypeScript types and follow the existing React patterns.
- Keep business rules in pure helpers such as `src/lib/game.ts`.
- Reuse existing persistence helpers rather than reading or writing `localStorage` in new UI components.
- Do not duplicate XP, streak, scheduling, achievement, or import/export rules.
- Prefer semantic HTML, visible focus states, labels, keyboard-friendly controls, and usable responsive layouts.
- Do not add a remote service that receives private habit data.
- Keep formatting and naming consistent with surrounding code.

## Testing and validation

Changes to XP, levels, streaks, scheduling, achievements, persistence, or backup import/export should include relevant tests or a clear explanation of why a test is not practical. Visual changes should be checked at desktop and mobile widths and should include screenshots in the pull request when useful.

The repository currently verifies:

- TypeScript with `npm run typecheck`
- ESLint with `npm run lint`
- Vitest with `npm test`
- Production output with `npm run build`

## Commit messages

Use an imperative, concise subject:

```text
Add weekday quest scheduling test
Fix local date conversion
Document Vercel deployment
```

Keep commits focused. There is no required commit-message automation, so clarity matters more than a rigid format.

## Pull request preparation

A useful pull request summary might look like:

```text
Adds weekday scheduling coverage and fixes a local-date boundary bug.
The change keeps completion records keyed by quest ID and local date.
Verified with typecheck, lint, Vitest, and production build.
```

Please include:

- Motivation and a concise summary
- Related issue or discussion
- Changes made and any tradeoffs
- Screenshots or recordings for visual changes
- Tests and commands actually run
- Documentation updates
- Accessibility considerations
- Any follow-up work

### Pull request checklist

- [ ] The change is focused and avoids unrelated formatting.
- [ ] Existing behavior was preserved unless the change intentionally updates it.
- [ ] Relevant tests or validation were added and run.
- [ ] Documentation and screenshots were updated when needed.
- [ ] Interactive UI is keyboard-usable and labeled.
- [ ] No backend, cloud database, authentication provider, server API, or serverless function was added.
- [ ] No private habit data is sent to an external service.

## Reporting bugs and proposing features

Use the repository issue forms when available. Bug reports should include reproduction steps, expected behavior, actual behavior, and environment details. Feature requests should explain the user problem, proposed solution, alternatives, and likely UX, accessibility, performance, and local-first impact.

## Local-first rule

QuestHabit must remain a frontend-only application. Do not introduce backend services, cloud databases, authentication, server-side APIs, serverless functions, automatic synchronization, or external services that transmit private habit data. Contributions that need a change to this architecture must be discussed explicitly before implementation.
