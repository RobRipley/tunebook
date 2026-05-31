# Execution Prompt — Tunebook Social Layer

> Paste this into a fresh Claude Code session opened at the repo root
> (`/Users/robertripley/coding/Tunebook-v2`) to implement the plan. It is self-contained:
> assume the session has no memory of how these documents were written.

---

You are implementing the **Tunebook social layer**. Tunebook is a passion-project web app for
traditional (mostly Irish) musicians to track the tunes they know / are learning / want to learn,
follow other players, and see what's moving through their scene. It already exists and runs on the
Internet Computer; you are evolving it, not starting fresh.

## Read these first, in order
1. `spec.md` — the product specification (what to build and why). Source of truth for behavior.
2. `plan.md` — the task-by-task implementation plan. Source of truth for how.
3. `notes.md` — scratchpad. Append decisions, surprises, and deviations here as you go.

If `spec.md` and `plan.md` ever disagree, follow `spec.md` and note the discrepancy in `notes.md`.

## How to execute
- **Use the `superpowers:subagent-driven-development` skill** (preferred) or
  `superpowers:executing-plans` to work through `plan.md` **in order**, one task at a time.
- The plan's steps use `- [ ]` checkboxes. Do them in sequence. **Do not skip ahead**, and do not
  batch multiple tasks into one commit — each task ends with its own commit using the message given
  in the plan.
- After each **phase**, stop and summarize what changed and what you verified, so the work can be
  reviewed before the next phase. Phases are: 0 (test harness), 1 (backend), 2 (frontend data
  layer), 3 (frontend screens), 4 (integrate & ship).

## Non-negotiable constraints
- **TDD where the plan says so.** Backend domain modules (`backend/*.mo`) and frontend logic helpers
  (`frontend/src/lib/*.ts`) are test-first: write the failing test, run it and confirm it fails,
  implement, run it and confirm it passes, commit. Don't write implementation before its test.
- **Verify before claiming done.** Backend logic: `mops test`. Frontend logic: `npm run test
  --prefix frontend`. Type/bundle: `npm run build --prefix frontend`. Backend integration: the
  `icp canister call` smoke tests in the plan, with the exact expected output. Never mark a step
  complete on assumption — run the command and read the output.
- **Do not lose mainnet data.** This canister is deployed with real users. All new state is additive
  (new stable stores init empty); the `postupgrade` migration backfills entries/follows/usernames
  exactly once, guarded by `migratedToSocialV2`. Never reset stable state or remove an existing
  stable field without a migration. Keep the legacy `knownTuneIds`/`wishListTuneIds` arrays and the
  `social.mo` friend endpoints during the transition (the plan removes them only as a later cleanup).
- **Follow the existing code patterns.** Backend: one module per domain, pure functions over a
  `Store` record, `mo:map` with `Map.thash`/`nhash`/`phash`, `requireAuth(caller)` on every update.
  Frontend: React Query hooks via `useAuth().backend`, `bigint` for `Nat`, `Principal.toText()`,
  `__kind__` discriminated unions for Candid variants (see `frontend/src/pages/profile.tsx`).
- **Honor the design system.** Tailwind tokens `parchment` / `moss` / `stone`, `font-display`
  (serif headings) + `font-body`, dark-mode classes, soft `shadow-card`. The aesthetic is
  "a well-loved music book," never pub kitsch — no shamrocks, leprechauns, beer, or flag-green.
  Copy voice is kind, plain-spoken, knowledgeable, not twee and not marketing-y.
- **Product invariants from the spec:** everything is public (no privacy gating); follows are
  one-way with a "follows you" badge when mutual; the tunebook entry attaches to the canonical tune
  id (with optional per-entry key/setting); auth is Internet Identity only; in-app notifications
  only (no push/email).

## Environment / commands
- ICP CLI: `icp build backend`, `icp deploy backend`, `icp network start -d`, `icp canister call …`.
- Motoko packages: `mops install`, `mops test`; type-check a module with
  `$(mops toolchain bin moc) --check $(mops sources) backend/<file>.mo`.
- Regenerate Candid after backend API changes:
  `$(mops toolchain bin moc) --idl $(mops sources) -o backend/backend.did backend/main.mo`.
- Frontend (npm workspace): `npm install --prefix frontend`, `npm run build --prefix frontend`,
  `npm run dev --prefix frontend`, `npm run test --prefix frontend`.
- If a build fails with `Cannot find module @rollup/rollup-darwin-*`, run `npm ci` — never add that
  package as a dependency.
- Commit with conventional-commit prefixes (`feat:`/`fix:`/`test:`/`chore:`/`docs:`) as the existing
  history does. Only push when asked.

## When you finish a task
1. All of that task's tests/builds/smoke checks pass (show the output).
2. Commit with the plan's message.
3. Tick the task's checkboxes in `plan.md`.
4. Add anything notable to `notes.md`.

## Definition of done (whole project)
`mops test` and `npm run test --prefix frontend` pass; `npm run build --prefix frontend` is clean;
the end-to-end manual script in Task 4.1 works with two Internet Identity logins (onboarding →
follow → status change shows in the follower's feed → react/comment → notification → discovery →
session check-in → TheSession import); and a mainnet upgrade runs the migration once without data
loss. Every item in `spec.md` §17 (the delta) is implemented and checked off in `plan.md`.

If you hit a genuinely blocking ambiguity that `spec.md` doesn't resolve, make the most reasonable
choice consistent with the spec's principles, record it in `notes.md`, and keep going — don't stall.
