import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  Activity,
  Award,
  BarChart3,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Download,
  Flame,
  Gamepad2,
  Library,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  Upload,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import {
  AppState,
  Category,
  Completion,
  Difficulty,
  Quest,
  Theme,
  WEEKDAYS,
  blankState,
  dueOn,
  id,
  isValidQuest,
  levelInfo,
  starterQuests,
  streak,
  templates,
  today,
} from "./lib/game";
import { loadState, saveState, STORAGE_KEY } from "./lib/storage";

const navItems = [
  ["/", "Overview", Activity],
  ["/quests", "My Quests", Target],
  ["/library", "Habit Library", Library],
  ["/calendar", "Calendar", CalendarDays],
  ["/progress", "Progress", BarChart3],
  ["/achievements", "Achievements", Trophy],
  ["/avatar", "Avatar & Rewards", UserRound],
  ["/settings", "Settings", Settings],
] as const;

export const THEME_OPTIONS: {
  id: Theme;
  name: string;
  tagline: string;
  icon: string;
  accent: string;
  bgPreview: string;
  cardPreview: string;
}[] = [
  {
    id: "midnight",
    name: "Midnight Violet",
    tagline: "Deep cosmic obsidian with neon violet & cyan glow",
    icon: "🌙",
    accent: "#8b5cf6",
    bgPreview: "#080a11",
    cardPreview: "#151a29",
  },
  {
    id: "forest",
    name: "Forest Realm",
    tagline: "Enchanted mossy woodland with emerald & jade runes",
    icon: "🌲",
    accent: "#10b981",
    bgPreview: "#07130f",
    cardPreview: "#0e201b",
  },
  {
    id: "ember",
    name: "Ember Quest",
    tagline: "Volcanic charcoal hearth with blazing flame accents",
    icon: "🔥",
    accent: "#ea580c",
    bgPreview: "#130907",
    cardPreview: "#22120e",
  },
  {
    id: "light",
    name: "Light Mode",
    tagline: "Crisp sunlit parchment with vivid royal violet contrast",
    icon: "☀️",
    accent: "#7c3aed",
    bgPreview: "#f6f8fc",
    cardPreview: "#ffffff",
  },
];

export function ThemeQuickToggle({
  theme,
  onSelectTheme,
}: {
  theme: Theme;
  onSelectTheme: (t: Theme) => void;
}) {
  const current =
    THEME_OPTIONS.find((t) => t.id === theme) ?? THEME_OPTIONS[0];
  const nextTheme = () => {
    const idx = THEME_OPTIONS.findIndex((t) => t.id === theme);
    const nextIdx = (idx + 1) % THEME_OPTIONS.length;
    onSelectTheme(THEME_OPTIONS[nextIdx].id);
  };

  return (
    <button
      type="button"
      className="theme-toggle-btn"
      onClick={nextTheme}
      aria-label={`Current theme is ${current.name}. Click to switch theme`}
      title="Click to cycle theme"
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {current.icon}
      </span>
      <span>{current.name}</span>
    </button>
  );
}

function useDialogFocus(
  isOpen: boolean,
  onClose: () => void,
  triggerRef?: React.RefObject<HTMLElement | null>,
  initialFocusRef?: React.RefObject<HTMLElement | null>,
) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const previouslyFocused =
      triggerRef?.current ?? (document.activeElement as HTMLElement | null);

    const focusableSelectors = [
      'input:not([disabled]):not([type="hidden"])',
      "select:not([disabled])",
      "textarea:not([disabled])",
      "button:not([disabled])",
      "a[href]",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");

    if (initialFocusRef?.current) {
      initialFocusRef.current.focus();
    } else {
      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelectors),
      );
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        dialog.focus();
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const currentFocusables = Array.from(
          dialog.querySelectorAll<HTMLElement>(focusableSelectors),
        );
        if (currentFocusables.length === 0) return;

        const first = currentFocusables[0];
        const last = currentFocusables[currentFocusables.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === first ||
            !dialog.contains(document.activeElement)
          ) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (
            document.activeElement === last ||
            !dialog.contains(document.activeElement)
          ) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };
  }, [isOpen, onClose, triggerRef, initialFocusRef]);

  return dialogRef;
}

export function App() {
  const [loaded] = useState(loadState);
  const [state, setState] = useState<AppState>(loaded.state);
  const [toast, setToast] = useState(
    loaded.recovered
      ? "Saved data could not be read; a new local profile was started."
      : "",
  );
  useEffect(() => {
    if (!saveState(state))
      setToast(
        "Your browser blocked local storage. Export a backup to keep your progress.",
      );
  }, [state]);
  useEffect(() => {
    document.documentElement.dataset.theme = state.profile.theme;
  }, [state.profile.theme]);
  const update = (next: AppState, message?: string) => {
    setState(next);
    if (message) {
      setToast(message);
      setTimeout(() => setToast(""), 2600);
    }
  };
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="*"
          element={
            !state.profile.onboarding ? (
              <Onboarding
                onDone={(name, avatar) =>
                  update(
                    {
                      ...state,
                      profile: {
                        ...state.profile,
                        name,
                        avatar,
                        onboarding: true,
                      },
                      quests: starterQuests(),
                    },
                    "Welcome to QuestHabit!",
                  )
                }
              />
            ) : (
              <Layout state={state} update={update} toast={toast} />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export function Onboarding({
  onDone,
}: {
  onDone: (name: string, avatar: string) => void;
}) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🧙");
  const [step, setStep] = useState(1);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const firstAvatarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (step === 1) {
      nameInputRef.current?.focus();
    } else if (step === 2) {
      firstAvatarRef.current?.focus();
    }
  }, [step]);

  return (
    <div className="modal-backdrop">
      <div
        className="modal onboarding-modal"
        style={{ maxWidth: 520 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-subtitle"
      >
        <div className="onboarding-kicker">
          <span className="brand-mark" aria-hidden="true">
            <Gamepad2 size={15} />
          </span>
          <span className="eyebrow">QuestHabit · onboarding {step}/2</span>
        </div>
        <h1 id="onboarding-title" style={{ fontSize: 31 }}>
          Welcome, Adventurer!
        </h1>
        <p id="onboarding-subtitle" className="muted">
          Every great journey begins with one small quest.
        </p>
        <div className="onboarding-progress">
          <div className="progress-label">
            <span>Your adventure begins here</span>
            <strong>{step}/2</strong>
          </div>
          <div
            className="bar"
            role="progressbar"
            aria-valuenow={step}
            aria-valuemin={1}
            aria-valuemax={2}
            aria-label="Onboarding progress"
          >
            <span style={{ width: `${step * 50}%` }} />
          </div>
        </div>
        {step === 1 ? (
          <div className="field">
            <label htmlFor="onboarding-name">What should we call you?</label>
            <input
              ref={nameInputRef}
              id="onboarding-name"
              className="input"
              placeholder="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) setStep(2);
              }}
            />
            <p className="muted">
              No account needed. Your profile stays on this device.
            </p>
            <button
              className="button button-wide"
              disabled={!name.trim()}
              onClick={() => setStep(2)}
            >
              Continue{" "}
              <ChevronRight
                size={15}
                style={{ verticalAlign: "middle" }}
                aria-hidden="true"
              />
            </button>
          </div>
        ) : (
          <div>
            <div className="section-heading">
              <div>
                <h2 id="avatar-section-title" style={{ fontSize: 16 }}>
                  Choose your adventurer
                </h2>
                <p className="muted">Pick a companion for your daily quests.</p>
              </div>
              <span className="selection-hint">Tap to select</span>
            </div>
            <div
              className="avatar-grid"
              role="radiogroup"
              aria-labelledby="avatar-section-title"
            >
              {["🧙", "🧝", "🧚", "🦊", "🐉", "🤖"].map((a, i) => (
                <button
                  type="button"
                  ref={i === 0 ? firstAvatarRef : undefined}
                  key={a}
                  role="radio"
                  aria-checked={avatar === a}
                  aria-label={`Choose ${a} avatar`}
                  className={`avatar-option ${avatar === a ? "selected" : ""}`}
                  onClick={() => setAvatar(a)}
                >
                  <span>{a}</span>
                  {avatar === a && (
                    <span className="avatar-check" aria-hidden="true">
                      <Check size={14} strokeWidth={3} />
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button
              className="button button-wide"
              onClick={() => onDone(name.trim(), avatar)}
            >
              Begin my journey{" "}
              <Sparkles
                size={15}
                style={{ verticalAlign: "middle" }}
                aria-hidden="true"
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Layout({
  state,
  update,
  toast,
}: {
  state: AppState;
  update: (s: AppState, m?: string) => void;
  toast: string;
}) {
  const location = useLocation();
  return (
    <div className="app">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="shell">
        <aside className="sidebar" aria-label="Sidebar">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden="true">
              <Gamepad2 size={19} />
            </span>{" "}
            QuestHabit
          </Link>
          <nav className="nav" aria-label="Main navigation">
            {navItems.map(([path, label, Icon]) => (
              <Link
                className={location.pathname === path ? "active" : ""}
                aria-current={location.pathname === path ? "page" : undefined}
                key={path}
                to={path}
              >
                <Icon size={17} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="sidebar-theme-row">
            <div
              className="sidebar-theme-toggle"
              role="group"
              aria-label="Theme selector"
            >
              <span className="small" style={{ fontWeight: 600 }}>
                Theme
              </span>
              <div className="sidebar-theme-pills">
                {THEME_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`sidebar-theme-pill ${state.profile.theme === t.id ? "active" : ""}`}
                    onClick={() =>
                      update(
                        {
                          ...state,
                          profile: { ...state.profile, theme: t.id },
                        },
                        `Theme: ${t.name}`,
                      )
                    }
                    aria-label={`Switch to ${t.name}`}
                    title={t.name}
                  >
                    <span aria-hidden="true">{t.icon}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <MiniProfile state={state} />
        </aside>
        <main className="main" id="main-content" tabIndex={-1}>
          <Routes>
            <Route
              path="/"
              element={<Dashboard state={state} update={update} />}
            />
            <Route
              path="/quests"
              element={<Quests state={state} update={update} />}
            />
            <Route
              path="/library"
              element={<LibraryPage state={state} update={update} />}
            />
            <Route path="/calendar" element={<CalendarPage state={state} />} />
            <Route path="/progress" element={<ProgressPage state={state} />} />
            <Route
              path="/achievements"
              element={<Achievements state={state} />}
            />
            <Route
              path="/avatar"
              element={<AvatarPage state={state} update={update} />}
            />
            <Route
              path="/settings"
              element={<SettingsPage state={state} update={update} />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navItems.slice(0, 5).map(([path, label, Icon]) => (
          <Link
            className={location.pathname === path ? "active" : ""}
            aria-current={location.pathname === path ? "page" : undefined}
            key={path}
            to={path}
          >
            <Icon size={17} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <Sparkles
            size={16}
            style={{ verticalAlign: "middle", marginRight: 7 }}
            aria-hidden="true"
          />
          {toast}
        </div>
      )}
    </div>
  );
}

export function MiniProfile({ state }: { state: AppState }) {
  const xp = state.completions.reduce((a, c) => a + c.xp, 0);
  const l = levelInfo(xp);
  return (
    <div className="mini-profile">
      <div className="avatar" aria-hidden="true">
        {state.profile.avatar}
      </div>
      <div style={{ flex: 1 }}>
        <b style={{ fontSize: 13 }}>{state.profile.name || "Adventurer"}</b>
        <div className="small">
          Level {l.level} · {l.rank}
        </div>
        <div
          className="bar"
          style={{ marginTop: 7 }}
          role="progressbar"
          aria-valuenow={l.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Level ${l.level} progress: ${l.current} of ${l.need} XP`}
        >
          <span style={{ width: `${l.percent}%` }} />
        </div>
      </div>
    </div>
  );
}

export function Header({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="topline">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Dashboard({
  state,
  update,
}: {
  state: AppState;
  update: (s: AppState, m?: string) => void;
}) {
  const date = today();
  const due = state.quests.filter((q) => dueOn(q, date));
  const complete = state.completions.filter((c) => c.date === date);
  const xp = state.completions.reduce((a, c) => a + c.xp, 0);
  const l = levelInfo(xp);
  const st = streak(state.completions);
  const duePercent = due.length
    ? Math.round(
        (complete.filter((c) => due.some((q) => q.id === c.questId)).length /
          due.length) *
          100,
      )
    : 0;

  return (
    <>
      <Header
        eyebrow="Friday, October 9 · Your journey"
        title={`${greeting()}, ${state.profile.name || "Adventurer"}`}
        subtitle="Every small step counts. Ready for today's quests?"
        action={
          <div className="actions" style={{ alignItems: "center" }}>
            <ThemeQuickToggle
              theme={state.profile.theme}
              onSelectTheme={(t) =>
                update(
                  { ...state, profile: { ...state.profile, theme: t } },
                  `Theme: ${THEME_OPTIONS.find((x) => x.id === t)?.name ?? t}`,
                )
              }
            />
            <Link to="/settings" className="button ghost" aria-label="Settings">
              <Settings size={16} aria-hidden="true" />
            </Link>
          </div>
        }
      />
      <div className="grid two">
        <div className="card profile-card">
          <div className="profile-row">
            <div className="big-avatar" aria-hidden="true">
              {state.profile.avatar}
            </div>
            <div>
              <div className="eyebrow">Current rank</div>
              <h2>
                {l.rank} <span className="pill">Level {l.level}</span>
              </h2>
              <p className="muted">
                Keep showing up. Your next chapter is close.
              </p>
            </div>
          </div>
          <div style={{ marginTop: 22 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                marginBottom: 7,
              }}
            >
              <span>Level {l.level} progress</span>
              <span className="cyan">
                {l.current} / {l.need} XP
              </span>
            </div>
            <div
              className="bar"
              role="progressbar"
              aria-valuenow={l.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Level ${l.level} progress: ${l.current} of ${l.need} XP`}
            >
              <span style={{ width: `${l.percent}%` }} />
            </div>
          </div>
          <div className="profile-meta">
            <div>
              <span className="small">Lifetime XP</span>
              <strong className="gold">{xp}</strong>
            </div>
            <div>
              <span className="small">Current streak</span>
              <strong className="green">{st.current} days</strong>
            </div>
            <div>
              <span className="small">Quests complete</span>
              <strong>{state.completions.length}</strong>
            </div>
          </div>
        </div>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div className="eyebrow">Today's focus</div>
              <h2>
                {complete.length}/{due.length} complete
              </h2>
            </div>
            <div
              className="big-avatar"
              style={{ width: 52, height: 52, fontSize: 27 }}
              aria-hidden="true"
            >
              <Flame className="green" />
            </div>
          </div>
          <div
            className="bar"
            style={{ margin: "18px 0 10px" }}
            role="progressbar"
            aria-valuenow={duePercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Today's quest progress"
          >
            <span style={{ width: `${duePercent}%` }} />
          </div>
          <p className="muted">
            {due.length
              ? `${duePercent}% of your daily quests complete`
              : "Add a quest to begin your adventure."}
          </p>
          <Link
            className="button"
            style={{
              display: "inline-block",
              marginTop: 9,
              textDecoration: "none",
            }}
            to="/quests"
          >
            <Plus
              size={15}
              style={{ verticalAlign: "middle" }}
              aria-hidden="true"
            />{" "}
            Add quest
          </Link>
        </div>
      </div>
      <div className="grid stats" style={{ margin: "16px 0" }}>
        <Stat
          icon={<Zap aria-hidden="true" />}
          label="Total XP"
          value={xp}
          tone="gold"
        />
        <Stat
          icon={<Flame aria-hidden="true" />}
          label="Best streak"
          value={`${st.longest} days`}
          tone="green"
        />
        <Stat
          icon={<Target aria-hidden="true" />}
          label="Remaining"
          value={Math.max(0, due.length - complete.length)}
          tone="accent"
        />
        <Stat
          icon={<Award aria-hidden="true" />}
          label="Badges"
          value={state.unlocked.length}
          tone="cyan"
        />
      </div>
      <div className="grid two">
        <section className="card" aria-label="Daily quests">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 15,
            }}
          >
            <div>
              <div className="eyebrow">Daily quests</div>
              <h2>Today's adventure</h2>
            </div>
            <Link to="/quests" className="muted">
              View all →
            </Link>
          </div>
          <QuestList state={state} update={update} quests={due} date={date} />
        </section>
        <section className="card" aria-label="Your momentum">
          <div className="eyebrow">Your momentum</div>
          <h2>Small quests, epic growth.</h2>
          <p className="muted" style={{ marginTop: 10 }}>
            Complete one meaningful quest today. Consistency turns ordinary
            habits into an extraordinary adventure.
          </p>
          <div className="grid three" style={{ marginTop: 22 }}>
            <div>
              <span className="small">This week</span>
              <strong style={{ display: "block", fontSize: 22, marginTop: 5 }}>
                {weekCount(state.completions)}{" "}
                <span className="small">quests</span>
              </strong>
            </div>
            <div>
              <span className="small">Longest</span>
              <strong style={{ display: "block", fontSize: 22, marginTop: 5 }}>
                {st.longest} <span className="small">days</span>
              </strong>
            </div>
            <div>
              <span className="small">Next reward</span>
              <strong style={{ display: "block", fontSize: 22, marginTop: 5 }}>
                {Math.max(0, l.need - l.current)}{" "}
                <span className="small">XP</span>
              </strong>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  tone: string;
}) {
  return (
    <div className="card">
      <div className={tone} aria-hidden="true">
        {icon}
      </div>
      <div className="stat-value">{value}</div>
      <div className="small">{label}</div>
    </div>
  );
}

export function QuestList({
  state,
  update,
  quests,
  date,
}: {
  state: AppState;
  update: (s: AppState, m?: string) => void;
  quests: Quest[];
  date: string;
}) {
  if (!quests.length) {
    return (
      <div className="empty">
        <div className="empty-icon" aria-hidden="true">
          🗺️
        </div>
        No quests scheduled for this day.
        <br />
        <Link to="/library" className="accent">
          Explore the habit library →
        </Link>
      </div>
    );
  }
  return (
    <div className="quest-list">
      {quests.map((q) => (
        <QuestRow key={q.id} q={q} state={state} update={update} date={date} />
      ))}
    </div>
  );
}

export function QuestRow({
  q,
  state,
  update,
  date,
}: {
  q: Quest;
  state: AppState;
  update: (s: AppState, m?: string) => void;
  date: string;
}) {
  const c = state.completions.find(
    (x) => x.questId === q.id && x.date === date,
  );
  const toggle = () => {
    const next = c
      ? state.completions.filter((x) => x.id !== c.id)
      : [
          ...state.completions,
          {
            id: id(),
            questId: q.id,
            date,
            completedAt: new Date().toISOString(),
            xp: q.xp,
          },
        ];
    update(
      { ...state, completions: next },
      c
        ? `Quest undone · ${q.xp} XP returned`
        : `Quest complete · +${q.xp} XP earned!`,
    );
  };
  return (
    <div className={`quest ${c ? "done" : ""}`}>
      <div className="quest-icon" aria-hidden="true">
        {q.icon}
      </div>
      <div className="quest-body">
        <div className="quest-title">{q.title}</div>
        <div className="quest-desc">{q.description}</div>
      </div>
      <span className="pill">{q.category}</span>
      <span className="xp">+{q.xp}</span>
      <button
        type="button"
        className={`check ${c ? "checked" : ""}`}
        onClick={toggle}
        aria-label={`${c ? "Undo" : "Complete"} ${q.title}`}
        aria-pressed={Boolean(c)}
      >
        {c ? (
          <Check size={16} aria-hidden="true" />
        ) : (
          <CircleHelp size={15} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

export function Quests({
  state,
  update,
}: {
  state: AppState;
  update: (s: AppState, m?: string) => void;
}) {
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const triggerRef = useRef<HTMLElement | null>(null);

  const filtered = state.quests.filter(
    (q) =>
      q.title.toLowerCase().includes(query.toLowerCase()) &&
      (filter === "All" || q.category === filter),
  );

  const manage = (
    q: Quest,
    action: "archive" | "delete" | "edit",
    el?: HTMLElement,
  ) => {
    if (
      action === "delete" &&
      confirm(`Delete "${q.title}"? Completion history is kept.`)
    ) {
      update(
        { ...state, quests: state.quests.filter((x) => x.id !== q.id) },
        "Quest deleted",
      );
    }
    if (action === "archive") {
      update(
        {
          ...state,
          quests: state.quests.map((x) =>
            x.id === q.id
              ? {
                  ...x,
                  status: x.status === "archived" ? "active" : "archived",
                }
              : x,
          ),
        },
        q.status === "archived" ? "Quest reactivated" : "Quest archived",
      );
    }
    if (action === "edit") {
      triggerRef.current = el ?? null;
      setEditingQuest(q);
      setModalMode("edit");
    }
  };

  const openCreate = (el: HTMLElement) => {
    triggerRef.current = el;
    setEditingQuest(null);
    setModalMode("create");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingQuest(null);
  };

  return (
    <>
      <Header
        eyebrow="Your quest board"
        title="My Quests"
        subtitle={`${state.quests.filter((q) => q.status === "active").length} active quests in your current chapter.`}
        action={
          <button
            type="button"
            className="button"
            onClick={(e) => openCreate(e.currentTarget)}
          >
            <Plus
              size={16}
              style={{ verticalAlign: "middle" }}
              aria-hidden="true"
            />{" "}
            New quest
          </button>
        }
      />
      <div className="toolbar">
        <div style={{ position: "relative", flex: 1 }}>
          <Search
            size={15}
            style={{
              position: "absolute",
              left: 11,
              top: 12,
              color: "var(--text-muted)",
            }}
            aria-hidden="true"
          />
          <input
            className="input"
            style={{ paddingLeft: 34 }}
            placeholder="Search quests..."
            aria-label="Search quests"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="select"
          aria-label="Filter quests by category"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="All">All categories</option>
          {[
            "Health",
            "Learning",
            "Coding",
            "Mindfulness",
            "Productivity",
            "Lifestyle",
          ].map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </div>
      <div className="card">
        <div className="quest-list">
          {filtered.map((q) => (
            <div key={q.id}>
              <QuestRow q={q} state={state} update={update} date={today()} />
              <div
                className="actions"
                style={{ justifyContent: "flex-end", margin: "-4px 9px 8px 0" }}
              >
                <button
                  type="button"
                  className="button ghost"
                  onClick={(e) => manage(q, "edit", e.currentTarget)}
                  aria-label={`Edit "${q.title}"`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => manage(q, "archive")}
                  aria-label={`${q.status === "archived" ? "Reactivate" : "Archive"} "${q.title}"`}
                >
                  {q.status === "archived" ? "Reactivate" : "Archive"}
                </button>
                <button
                  type="button"
                  className="button danger"
                  onClick={() => manage(q, "delete")}
                  aria-label={`Delete "${q.title}"`}
                >
                  <Trash2 size={13} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {!filtered.length && (
          <div className="empty">No quests match your filters.</div>
        )}
      </div>
      {modalMode && (
        <QuestModal
          mode={modalMode}
          quest={editingQuest}
          state={state}
          update={update}
          close={closeModal}
          triggerRef={triggerRef}
        />
      )}
    </>
  );
}

export function QuestModal({
  mode,
  quest,
  state,
  update,
  close,
  triggerRef,
}: {
  mode: "create" | "edit";
  quest: Quest | null;
  state: AppState;
  update: (s: AppState, m?: string) => void;
  close: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}) {
  const isEdit = mode === "edit" && quest !== null;
  const [form, setForm] = useState({
    title: quest?.title ?? "",
    description: quest?.description ?? "",
    icon: quest?.icon ?? "✨",
    category: (quest?.category ?? "Productivity") as Category,
    difficulty: (quest?.difficulty ?? "Easy") as Difficulty,
    xp: quest?.xp ?? 10,
    frequency: (quest?.frequency ?? "Daily") as Quest["frequency"],
    weekdays: Array.isArray(quest?.weekdays) ? quest.weekdays : [],
  });

  const set = (k: string, v: string | number | number[]) =>
    setForm((x) => ({ ...x, [k]: v }));

  const toggleWeekday = (day: number) => {
    setForm((prev) => {
      const exists = prev.weekdays.includes(day);
      const next = exists
        ? prev.weekdays.filter((d) => d !== day)
        : [...prev.weekdays, day].sort((a, b) => a - b);
      return { ...prev, weekdays: next };
    });
  };

  const titleInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useDialogFocus(true, close, triggerRef, titleInputRef);

  const canSave = isValidQuest(form);

  const save = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canSave) return;

    if (isEdit && quest) {
      const updatedQuest: Quest = {
        ...quest,
        ...form,
        title: form.title.trim(),
        weekdays:
          form.frequency === "Custom" ? form.weekdays : (quest.weekdays ?? []),
      };
      update(
        {
          ...state,
          quests: state.quests.map((x) =>
            x.id === quest.id ? updatedQuest : x,
          ),
        },
        "Quest updated",
      );
    } else {
      const q: Quest = {
        ...form,
        title: form.title.trim(),
        id: id(),
        duration: 15,
        weekdays: form.frequency === "Custom" ? form.weekdays : [],
        startDate: today(),
        status: "active",
        createdAt: new Date().toISOString(),
      };
      update(
        { ...state, quests: [...state.quests, q] },
        "New quest added to your board",
      );
    }
    close();
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quest-modal-title"
        tabIndex={-1}
      >
        <div className="modal-head">
          <div>
            <div className="eyebrow">
              {isEdit ? "Update quest" : "Create a quest"}
            </div>
            <h2 id="quest-modal-title">
              {isEdit ? "Edit Quest" : "What will you conquer?"}
            </h2>
          </div>
          <button
            type="button"
            className="close"
            aria-label="Close dialog"
            onClick={close}
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={save}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="quest-title-input">Quest title</label>
              <input
                ref={titleInputRef}
                id="quest-title-input"
                className="input"
                autoFocus
                required
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Walk in the park"
              />
            </div>
            <div className="field">
              <label htmlFor="quest-icon-input">Icon</label>
              <input
                id="quest-icon-input"
                className="input"
                value={form.icon}
                onChange={(e) => set("icon", e.target.value)}
              />
            </div>
            <div className="field full">
              <label htmlFor="quest-desc-input">Description</label>
              <textarea
                id="quest-desc-input"
                className="textarea"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="A small, clear description..."
              />
            </div>
            <div className="field">
              <label htmlFor="quest-category-select">Category</label>
              <select
                id="quest-category-select"
                className="select"
                value={form.category}
                onChange={(e) => set("category", e.target.value as Category)}
              >
                {[
                  "Health",
                  "Learning",
                  "Coding",
                  "Mindfulness",
                  "Productivity",
                  "Lifestyle",
                ].map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="quest-difficulty-select">Difficulty</label>
              <select
                id="quest-difficulty-select"
                className="select"
                value={form.difficulty}
                onChange={(e) => {
                  const d = e.target.value as Difficulty;
                  setForm((x) => ({
                    ...x,
                    difficulty: d,
                    xp: d === "Easy" ? 10 : d === "Medium" ? 25 : 50,
                  }));
                }}
              >
                {["Easy", "Medium", "Hard"].map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="quest-xp-input">XP reward</label>
              <input
                id="quest-xp-input"
                className="input"
                type="number"
                min="5"
                max="100"
                value={form.xp}
                onChange={(e) => set("xp", Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label htmlFor="quest-frequency-select">Frequency</label>
              <select
                id="quest-frequency-select"
                className="select"
                value={form.frequency}
                onChange={(e) =>
                  set("frequency", e.target.value as Quest["frequency"])
                }
              >
                <option value="Daily">Daily</option>
                <option value="Weekdays">Weekdays</option>
                <option value="Weekly">Weekly</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            {form.frequency === "Custom" && (
              <div className="field full">
                <label id="quest-weekdays-label">Repeat on weekdays</label>
                <div
                  role="group"
                  aria-labelledby="quest-weekdays-label"
                  className="weekday-grid"
                >
                  {WEEKDAYS.map(({ day, label, short }) => {
                    const isSelected = form.weekdays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={isSelected}
                        aria-label={label}
                        title={label}
                        className={`weekday-btn ${isSelected ? "selected" : ""}`}
                        onClick={() => toggleWeekday(day)}
                      >
                        {short}
                      </button>
                    );
                  })}
                </div>
                {form.weekdays.length === 0 && (
                  <p className="field-hint error" role="alert">
                    Please select at least one weekday.
                  </p>
                )}
              </div>
            )}
          </div>
          <div
            className="actions"
            style={{ justifyContent: "flex-end", marginTop: 20 }}
          >
            <button type="button" className="button ghost" onClick={close}>
              Cancel
            </button>
            <button type="submit" className="button" disabled={!canSave}>
              {isEdit ? "Save changes" : "Create quest"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function LibraryPage({
  state,
  update,
}: {
  state: AppState;
  update: (s: AppState, m?: string) => void;
}) {
  const [search, setSearch] = useState("");
  const add = (t: (typeof templates)[number]) =>
    update(
      {
        ...state,
        quests: [
          ...state.quests,
          {
            ...t,
            id: id(),
            frequency: "Daily",
            weekdays: [],
            startDate: today(),
            status: "active",
            createdAt: new Date().toISOString(),
          },
        ],
      },
      `${t.title} added to your quests`,
    );
  const list = templates.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <Header
        eyebrow="Start with a spark"
        title="Habit Library"
        subtitle="Thoughtfully designed quest templates for every kind of growth."
      />
      <div className="toolbar">
        <input
          className="input"
          placeholder="Search the library..."
          aria-label="Search the habit library"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="grid three">
        {list.map((t) => (
          <div className="card" key={t.id}>
            <div className="quest-icon" aria-hidden="true">
              {t.icon}
            </div>
            <h2 style={{ marginTop: 16, fontSize: 18 }}>{t.title}</h2>
            <p className="muted">{t.description}</p>
            <div
              className="actions"
              style={{
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 18,
              }}
            >
              <span className="pill">{t.category}</span>
              <span className="xp">+{t.xp} XP</span>
              <button
                type="button"
                className="button"
                onClick={() => add(t)}
                aria-label={`Add quest "${t.title}"`}
              >
                Add quest
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function CalendarPage({ state }: { state: AppState }) {
  const [month, setMonth] = useState(new Date());
  const year = month.getFullYear();
  const m = month.getMonth();
  const start = new Date(year, m, 1).getDay();
  const days = new Date(year, m + 1, 0).getDate();
  const cells = Array.from({ length: start + days }, (_, i) =>
    i < start ? null : i - start + 1,
  );
  return (
    <>
      <Header
        eyebrow="Your timeline"
        title="Calendar & History"
        subtitle="Every completed quest is a page in your story."
        action={
          <div className="actions">
            <button
              type="button"
              className="button ghost"
              onClick={() => setMonth(new Date(year, m - 1, 1))}
              aria-label="Previous month"
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              className="button ghost"
              onClick={() => setMonth(new Date(year, m + 1, 1))}
              aria-label="Next month"
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        }
      />
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <h2>
            {month.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <span className="muted">
            {state.completions.length} total completions
          </span>
        </div>
        <div className="calendar" aria-label="Completion calendar">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div className="small" key={d}>
              {d}
            </div>
          ))}
          {cells.map((d, i) => {
            const date = d
              ? `${year}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
              : "";
            const count = state.completions.filter(
              (c) => c.date === date,
            ).length;
            return (
              <div
                key={i}
                className={`cal-cell ${date === today() ? "today" : ""} ${!d ? "muted-cell" : ""}`}
                aria-label={
                  d ? `${date}: ${count} completed quests` : undefined
                }
              >
                {d}
                {count > 0 && (
                  <div>
                    <span className="dot" aria-hidden="true" />
                    {count} quest{count > 1 ? "s" : ""}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function ProgressPage({ state }: { state: AppState }) {
  const xp = state.completions.reduce((a, c) => a + c.xp, 0);
  const l = levelInfo(xp);
  const st = streak(state.completions);
  const categories = [...new Set(state.quests.map((q) => q.category))].map(
    (c) => ({
      c,
      n: state.completions.filter(
        (x) => state.quests.find((q) => q.id === x.questId)?.category === c,
      ).length,
    }),
  );
  return (
    <>
      <Header
        eyebrow="Your growth arc"
        title="Progress"
        subtitle="A clear view of the habits powering your adventure."
      />
      <div className="grid stats">
        <Stat
          icon={<Zap aria-hidden="true" />}
          label="Lifetime XP"
          value={xp}
          tone="gold"
        />
        <Stat
          icon={<Trophy aria-hidden="true" />}
          label="Current level"
          value={l.level}
          tone="accent"
        />
        <Stat
          icon={<Flame aria-hidden="true" />}
          label="Longest streak"
          value={`${st.longest} days`}
          tone="green"
        />
        <Stat
          icon={<Target aria-hidden="true" />}
          label="Completions"
          value={state.completions.length}
          tone="cyan"
        />
      </div>
      <div className="grid two" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="eyebrow">Level journey</div>
          <h2>
            {l.rank} · Level {l.level}
          </h2>
          <p className="muted">
            You need {l.need - l.current} XP to reach the next level.
          </p>
          <div
            className="bar"
            style={{ marginTop: 23 }}
            role="progressbar"
            aria-valuenow={l.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Level ${l.level} journey`}
          >
            <span style={{ width: `${l.percent}%` }} />
          </div>
        </div>
        <div className="card">
          <div className="eyebrow">Category energy</div>
          <h2>Category Breakdown</h2>
          {categories.length ? (
            categories.map((x) => (
              <div key={x.c} style={{ marginTop: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                  }}
                >
                  <span>{x.c}</span>
                  <span className="muted">{x.n}</span>
                </div>
                <div
                  className="bar"
                  style={{ marginTop: 5 }}
                  role="progressbar"
                  aria-valuenow={Math.round(
                    (x.n / Math.max(1, state.completions.length)) * 100,
                  )}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${x.c} completions: ${x.n}`}
                >
                  <span
                    style={{
                      width: `${Math.min(100, (x.n / Math.max(1, state.completions.length)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="empty">
              Complete a quest to reveal your patterns.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const achievements = [
  ["first", "First Steps", "Complete your first quest", "🌱"],
  ["streak3", "Consistency", "Maintain a 3-day streak", "🔥"],
  ["collector", "Quest Collector", "Create 10 quests", "🗺️"],
  ["xp1000", "Century Club", "Earn 1,000 lifetime XP", "💎"],
  ["explorer", "Explorer", "Complete quests across five categories", "🧭"],
  ["perfect", "Perfect Day", "Complete all eligible quests for a day", "⭐"],
];

export function Achievements({ state }: { state: AppState }) {
  const xp = state.completions.reduce((a, c) => a + c.xp, 0);
  const st = streak(state.completions);
  const categories = new Set(
    state.completions.map(
      (c) => state.quests.find((q) => q.id === c.questId)?.category,
    ),
  );
  const unlocked = new Set(state.unlocked);
  const achieved = (x: string) =>
    unlocked.has(x) ||
    (x === "first" && state.completions.length > 0) ||
    (x === "streak3" && st.longest >= 3) ||
    (x === "collector" && state.quests.length >= 10) ||
    (x === "xp1000" && xp >= 1000) ||
    (x === "explorer" && categories.size >= 5);

  return (
    <>
      <Header
        eyebrow="Milestones"
        title="Achievements"
        subtitle={`${achievements.filter((x) => achieved(x[0])).length} of ${achievements.length} badges unlocked.`}
      />
      <div className="grid three">
        {achievements.map((a) => (
          <div
            className="card"
            key={a[0]}
            style={{ opacity: achieved(a[0]) ? 1 : 0.55 }}
          >
            <div
              className="big-avatar"
              style={{ width: 55, height: 55, fontSize: 28 }}
              aria-hidden="true"
            >
              {a[3]}
            </div>
            <h2 style={{ marginTop: 14, fontSize: 18 }}>
              {a[1]}{" "}
              {achieved(a[0]) && (
                <Check size={16} className="green" aria-hidden="true" />
              )}
            </h2>
            <p className="muted">{a[2]}</p>
            <span className={`pill ${achieved(a[0]) ? "green" : ""}`}>
              {achieved(a[0]) ? "Unlocked" : "Locked"}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

export function AvatarPage({
  state,
  update,
}: {
  state: AppState;
  update: (s: AppState, m?: string) => void;
}) {
  const avatars = ["🧙", "🧝", "🧚", "🦊", "🐉", "🤖", "🦉", "🐯"];
  return (
    <>
      <Header
        eyebrow="Make it yours"
        title="Avatar & Rewards"
        subtitle="Choose the face of your next chapter."
      />
      <div className="grid two">
        <div className="card" style={{ textAlign: "center" }}>
          <div
            className="big-avatar"
            style={{
              margin: "10px auto 20px",
              width: 120,
              height: 120,
              fontSize: 70,
            }}
            aria-hidden="true"
          >
            {state.profile.avatar}
          </div>
          <h2>{state.profile.name}</h2>
          <p className="muted">Your avatar is your visual signature.</p>
          <div
            className="actions"
            style={{ justifyContent: "center", marginTop: 24 }}
            role="radiogroup"
            aria-label="Select avatar"
          >
            {avatars.map((a) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={state.profile.avatar === a}
                aria-label={`Choose ${a} avatar`}
                onClick={() =>
                  update(
                    { ...state, profile: { ...state.profile, avatar: a } },
                    "Avatar updated",
                  )
                }
                className={`big-avatar ${state.profile.avatar === a ? "check checked" : ""}`}
                style={{ width: 50, height: 50, fontSize: 25 }}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="eyebrow">Cosmetic rewards</div>
          <h2>Unlock your style</h2>
          {[
            [
              "🌌",
              "Nebula frame",
              "Reach level 5",
              levelInfo(state.completions.reduce((a, c) => a + c.xp, 0))
                .level >= 5,
            ],
            [
              "⚡",
              "Lightning aura",
              "Earn 500 XP",
              state.completions.reduce((a, c) => a + c.xp, 0) >= 500,
            ],
            [
              "👑",
              "Crown of consistency",
              "Reach a 7-day streak",
              streak(state.completions).longest >= 7,
            ],
          ].map((x) => (
            <div
              className="quest"
              style={{ marginTop: 10, opacity: x[3] ? 1 : 0.5 }}
              key={x[1] as string}
            >
              <div className="quest-icon" aria-hidden="true">
                {x[0]}
              </div>
              <div className="quest-body">
                <b>{x[1]}</b>
                <div className="quest-desc">{x[2]}</div>
              </div>
              <span className="pill">{x[3] ? "Unlocked" : "Locked"}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function SettingsPage({
  state,
  update,
}: {
  state: AppState;
  update: (s: AppState, m?: string) => void;
}) {
  const p = state.profile;
  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "questhabit-backup.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importData = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const incoming = JSON.parse(String(reader.result));
        if (
          !incoming?.profile ||
          !Array.isArray(incoming.quests) ||
          !Array.isArray(incoming.completions)
        )
          throw new Error("invalid");
        if (
          confirm(
            `Replace local progress with ${incoming.quests.length} quests and ${incoming.completions.length} completions?`,
          )
        )
          update(
            {
              ...blankState(),
              ...incoming,
              profile: { ...blankState().profile, ...incoming.profile },
            },
            "Backup imported successfully",
          );
      } catch {
        alert("That backup is not a valid QuestHabit export.");
      }
    };
    reader.readAsText(file);
  };
  const reset = () => {
    if (
      confirm(
        "Reset all QuestHabit data on this device? This cannot be undone.",
      )
    ) {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  };
  return (
    <>
      <Header
        eyebrow="Tune your adventure"
        title="Settings"
        subtitle="Your preferences, your pace, your local-first journey."
      />
      <div className="grid two">
        <div className="card">
          <div className="eyebrow">Preferences</div>
          <h2>Profile</h2>
          <div className="field" style={{ marginTop: 14 }}>
            <label htmlFor="settings-name-input">Display name</label>
            <input
              id="settings-name-input"
              className="input"
              value={p.name}
              onChange={(e) =>
                update({ ...state, profile: { ...p, name: e.target.value } })
              }
            />
          </div>
          <div className="field" style={{ marginTop: 14 }}>
            <label htmlFor="settings-theme-select">Theme</label>
            <select
              id="settings-theme-select"
              className="select"
              value={p.theme}
              onChange={(e) => {
                const next = e.target.value as Theme;
                const opt = THEME_OPTIONS.find((t) => t.id === next);
                update(
                  {
                    ...state,
                    profile: { ...p, theme: next },
                  },
                  `Theme updated to ${opt?.name ?? next}`,
                );
              }}
            >
              <option value="midnight">Midnight Violet</option>
              <option value="forest">Forest Realm</option>
              <option value="ember">Ember Quest</option>
              <option value="light">Light Mode</option>
            </select>
            <div
              className="theme-gallery"
              role="radiogroup"
              aria-label="Color palette selection"
            >
              {THEME_OPTIONS.map((t) => {
                const isSelected = p.theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`Activate ${t.name}`}
                    className={`theme-card-option ${isSelected ? "selected" : ""}`}
                    onClick={() =>
                      update(
                        {
                          ...state,
                          profile: { ...p, theme: t.id },
                        },
                        `Theme updated to ${t.name}`,
                      )
                    }
                  >
                    <div className="theme-card-header">
                      <div className="theme-card-title-row">
                        <span className="theme-card-icon" aria-hidden="true">
                          {t.icon}
                        </span>
                        <span className="theme-card-title">{t.name}</span>
                      </div>
                      {isSelected && (
                        <span className="theme-card-badge" aria-hidden="true">
                          <Check size={12} strokeWidth={3} />
                          Active
                        </span>
                      )}
                    </div>
                    <div className="theme-card-desc">{t.tagline}</div>
                    <div className="theme-card-swatches" aria-hidden="true">
                      <span
                        className="theme-swatch-dot"
                        style={{ backgroundColor: t.bgPreview }}
                        title="Background"
                      />
                      <span
                        className="theme-swatch-dot"
                        style={{ backgroundColor: t.cardPreview }}
                        title="Card surface"
                      />
                      <span
                        className="theme-swatch-dot"
                        style={{ backgroundColor: t.accent }}
                        title="Accent tone"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="field" style={{ marginTop: 14 }}>
            <label htmlFor="settings-target-input">Daily quest target</label>
            <input
              id="settings-target-input"
              className="input"
              type="number"
              min="1"
              max="20"
              value={p.target}
              onChange={(e) =>
                update({
                  ...state,
                  profile: { ...p, target: Number(e.target.value) },
                })
              }
            />
          </div>
        </div>
        <div className="card">
          <div className="eyebrow">Local storage</div>
          <h2>Data & privacy</h2>
          <p className="muted">
            QuestHabit stores your progress only in this browser. Export a
            backup before moving devices.
          </p>
          <div className="actions" style={{ marginTop: 18 }}>
            <button type="button" className="button" onClick={exportData}>
              <Download
                size={15}
                style={{ verticalAlign: "middle", marginRight: 6 }}
                aria-hidden="true"
              />{" "}
              Export backup
            </button>
            <label
              htmlFor="settings-import-input"
              className="button ghost"
              style={{
                display: "inline-flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <Upload
                size={15}
                style={{ verticalAlign: "middle", marginRight: 6 }}
                aria-hidden="true"
              />{" "}
              Import backup
              <input
                id="settings-import-input"
                type="file"
                accept="application/json"
                className="sr-only"
                onChange={(e) => importData(e.target.files?.[0])}
              />
            </label>
          </div>
          <hr style={{ borderColor: "var(--border-subtle)", margin: "24px 0" }} />
          <button type="button" className="button danger" onClick={reset}>
            <Trash2
              size={15}
              style={{ verticalAlign: "middle", marginRight: 6 }}
              aria-hidden="true"
            />{" "}
            Reset local data
          </button>
        </div>
      </div>
    </>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
function weekCount(completions: Completion[]) {
  const cut = Date.now() - 7 * 86400000;
  return completions.filter((c) => new Date(c.completedAt).getTime() >= cut)
    .length;
}

export default App;
