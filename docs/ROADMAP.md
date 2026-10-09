# Roadmap

This roadmap separates verified functionality from proposed work. It is intentionally not a release schedule. New proposals should be discussed through GitHub Issues before implementation so contributors can coordinate and avoid duplicate work.

## Completed

- Local onboarding and avatar selection
- Quest creation, editing, archiving, reactivation, deletion, search, and category filtering
- Daily, weekday, and weekly scheduling in the current quest form
- Local-date completion records with one completion per quest and date in the UI
- XP, levels, ranks, current and longest streak calculations
- Achievement display rules, habit templates, calendar history, and category insights
- Avatar/cosmetic reward screen and four theme choices
- JSON export, basic shape-validated import, and local reset
- Responsive navigation and static Vercel deployment configuration
- Type checking, linting, Vitest coverage for core rules, production build, and CI workflow

## Proposed milestones

### UX and usability

**Split the monolithic page composition into feature modules.** Move dashboard, quest, calendar, progress, and settings UI into focused files while preserving behavior.

Acceptance criteria:

- Existing routes and interactions continue to work.
- Shared controls remain consistent.
- No business rule is duplicated during the split.

**Improve quest editing.** Replace the current title prompt with a reusable edit form that exposes the same validated fields as creation.

Acceptance criteria:

- Editing current metadata does not rewrite historical completion XP.
- Canceling leaves the quest unchanged.
- Invalid values are announced and cannot be saved.

### Accessibility and responsive design

**Add browser-level accessibility checks.** Cover onboarding, quest completion, modal focus, navigation, and settings.

Acceptance criteria:

- Keyboard users can reach every visible action.
- Dialogs have labels and sensible focus behavior.
- Mobile navigation remains usable at narrow widths.

**Implement the reduced-motion preference.** Connect the existing profile field to animations and transitions once motion effects are introduced.

Acceptance criteria:

- Reduced motion disables nonessential movement.
- The preference persists through refresh.

### Testing and reliability

**Strengthen backup validation and migrations.** Add schema versioning, record-level validation, duplicate ID checks, and supported migration behavior.

Acceptance criteria:

- Invalid dates, IDs, XP values, and duplicate records are rejected.
- Existing state is unchanged after a failed import.
- A supported older backup can be migrated with a clear summary.

**Expand UI and storage tests.** Add tests for localStorage recovery, write failures, import confirmation, and duplicate completion clicks.

Acceptance criteria:

- Corrupt storage and quota errors produce user-visible recovery feedback.
- Completion and undo preserve the expected XP total.

### Game progression and new content

**Complete custom schedule editing.** The quest type already includes `Custom`; expose weekday selection and validation in the quest form.

Acceptance criteria:

- Users can select weekdays.
- Due-quest and calendar behavior matches the selected local weekdays.

**Expand templates and cosmetic rewards.** Add balanced content across existing categories without introducing remote assets or data services.

Acceptance criteria:

- New content has descriptions, difficulty, reward, and category metadata.
- Added templates create independent editable quest records.

**Add richer analytics.** Introduce weekly and monthly visualizations after selecting a charting approach that fits the local-only data model.

Acceptance criteria:

- Every chart is derived from actual completion records.
- Empty and zero-data states avoid misleading statistics.

### Documentation and contributor experience

**Add genuine screenshots after deployment.** Capture representative desktop and mobile states from a real build and link them from the README.

Acceptance criteria:

- Images are stored in the repository with useful alt text.
- No placeholder or fabricated demo link remains.

**Add contributor automation where justified.** Consider a pull request check for Markdown links and Mermaid blocks once the repository is public.

Acceptance criteria:

- Checks use the existing package scripts or documented tooling.
- Automation does not require a backend or external habit-data service.
