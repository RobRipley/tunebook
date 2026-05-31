# Tunebook Social Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve the existing Tunebook app into the product described in `spec.md` — replacing two-way friends with one-way follows, promoting implicit known/wishlist arrays into first-class tunebook entries with statuses, and adding an activity feed, reactions/comments, discovery, session attendance, notifications, bulk TheSession import, external links, tune discussion, and usernames.

**Architecture:** Single Motoko backend canister (stable-memory stores, one module per domain, pure functions over a `Store` record), HTTPS outcalls to thesession.org, React + TypeScript + Tailwind frontend served from an asset canister, Internet Identity auth. New work is additive: new stable stores initialize empty and a one-time guarded migration backfills them from existing data, so no mainnet data is lost.

**Tech Stack:** ICP CLI, Motoko (mops; `base`, `map`), `mo:test` for backend unit tests, React 18 + TypeScript + Vite, Tailwind, TanStack Router + Query, `@icp-sdk/core` + `@icp-sdk/bindgen`, abcjs, Vitest for frontend logic tests, sonner for toasts, lucide-react icons.

---

## How this plan is verified (read first)

The existing codebase has **no test harness** and verifies via build + `icp canister call` smoke tests + manual checks. This plan adds real automated tests where they pay off and keeps the project's existing verification style elsewhere:

- **Backend domain logic** (`*.mo` modules): TDD with `mo:test`. The modules are pure functions over an in-memory `Store`, so tests construct a store, call functions, assert results — no canister deploy needed. **Every backend logic task is test-first.**
- **Backend integration** (`main.mo` endpoints, migration, HTTPS outcalls): verified with `icp canister call` smoke tests with exact expected output, because these involve `caller`, cycles, and upgrade hooks that unit tests can't cover.
- **Frontend pure logic** (ranking, grouping, matching, formatting helpers in `lib/`): TDD with Vitest.
- **Frontend hooks & components**: verified with `npm run build` (type-check + bundle) plus explicit manual verification steps against a locally deployed backend. React UI is not unit-tested, matching the existing project.

When a step says "Commit", run it before starting the next task. Use [conventional-commit](https://www.conventionalcommits.org/) prefixes as the existing history does (`feat:`, `fix:`, `chore:`, `test:`, `docs:`).

---

## File Structure

### New backend files
| File | Responsibility |
|---|---|
| `backend/entries.mo` | Tunebook entry store + CRUD: set/clear status, key, setting, note; queries by user / by tune / counts. |
| `backend/follows.mo` | One-way follow graph: follow/unfollow, followers, following, isFollowing, followsYou (mutual). |
| `backend/feed.mo` | Feed-event store, append helpers, per-type constructors, reactions, comments, feed fetch for a viewer. |
| `backend/notifications.mo` | Per-user in-app notification store: create, list, mark-read, unread count. |
| `backend/discovery.mo` | Read-only ranking queries: people-to-follow, tunes-near-you, overlap, trending, new. |
| `backend/migration.mo` | One-time backfill: known/wishlist arrays → entries; accepted friends → mutual follows; provisional usernames. |
| `backend/test/*.test.mo` | `mo:test` unit tests, one file per module under test. |

### Modified backend files
| File | Change |
|---|---|
| `backend/types.mo` | Expand `TuneType`; add `ExternalLink` + `externalLinks`/`discussion` to `Tune`; add `username` (optional) to `UserProfile`; add `TuneStatus`, `TunebookEntry`, `Follow`, `FeedEvent`+`FeedVerb`, `Reaction`+`ReactionKind`, `Comment`, `SessionAttendance`, `Notification`+`NotificationKind`. |
| `backend/users.mo` | Username uniqueness index + `setUsername`/`isUsernameAvailable`/`getByUsername`; keep `knownTuneIds`/`wishListTuneIds` for back-compat during migration. |
| `backend/tunes.mo` | Add/remove external links; add tune-discussion comment helpers. |
| `backend/sessions.mo` | Attendance store + `checkIn`/`listAttendance`. |
| `backend/main.mo` | Wire every new module; add `postupgrade` migration; expose new endpoints; regenerate `backend.did`. |

### New frontend files
| File | Responsibility |
|---|---|
| `frontend/src/hooks/use-entries.ts` | Tunebook entry queries/mutations. |
| `frontend/src/hooks/use-follows.ts` | Follow graph queries/mutations (replaces `use-social.ts`). |
| `frontend/src/hooks/use-feed.ts` | Feed, reactions, comments. |
| `frontend/src/hooks/use-notifications.ts` | Notifications + unread count. |
| `frontend/src/hooks/use-discovery.ts` | Discovery queries. |
| `frontend/src/lib/feed.ts` | Pure feed grouping + verb→copy formatting (Vitest-tested). |
| `frontend/src/lib/match.ts` | Pure tune-title fuzzy match for import dedup (Vitest-tested). |
| `frontend/src/lib/status.ts` | Status enum helpers + labels/colors (Vitest-tested). |
| `frontend/src/pages/feed.tsx` | Home activity feed. |
| `frontend/src/pages/tunebook.tsx` | "My Tunebook" grouped by status. |
| `frontend/src/pages/discovery.tsx` | Discovery surfaces. |
| `frontend/src/pages/notifications.tsx` | Notifications list. |
| `frontend/src/pages/onboarding.tsx` | Guided, skippable onboarding. |
| `frontend/src/components/feed-event-card.tsx` | One feed event + reactions + comments. |
| `frontend/src/components/status-control.tsx` | Status picker + per-entry key/setting/note editor. |
| `frontend/src/components/follow-button.tsx` | Follow / Following toggle + "follows you" badge. |
| `frontend/src/components/tune-picker.tsx` | Onboarding tap-to-add popular-tunes grid + search. |

### Modified frontend files
| File | Change |
|---|---|
| `frontend/src/router.tsx` | `/` → feed; `/me` → personal profile/tunebook; add `/discover`, `/notifications`, `/onboarding`. |
| `frontend/src/components/layout/nav.tsx` | New nav items + unread notification dot. |
| `frontend/src/pages/profile.tsx` | Read from entries (status counts), keep editing; move from `/` to `/me`. |
| `frontend/src/pages/user-profile.tsx` | Follow button + follows-you badge + activity + public tunebook. |
| `frontend/src/pages/tune-detail.tsx` | Status control, "people you follow who play this" + local/other counts, external links, discussion. |
| `frontend/src/pages/sessions.tsx`, `session-detail.tsx` | Check-in action + recent attendance. |
| `frontend/src/lib/abc.ts` | Add `formatStatus`, expand `formatTuneType` for new types. |

---

## Phase 0 — Test harness

### Task 0.1: Add `mo:test` and a backend test scaffold

**Files:**
- Modify: `mops.toml`
- Create: `backend/test/types.test.mo`

- [ ] **Step 1: Add the test dependency**

Edit `mops.toml` `[dependencies]` to add `test`:

```toml
[package]
name = "tunebook-v2"
version = "0.1.0"

[toolchain]
moc = "0.14.2"

[dependencies]
base = "0.12.1"
map = "9.0.1"
test = "1.2.1"
```

- [ ] **Step 2: Install**

Run: `mops install`
Expected: resolves and downloads `test`.

- [ ] **Step 3: Write a trivial passing test to prove the harness**

Create `backend/test/types.test.mo`:

```motoko
import { test; expect } "mo:test";

test("harness works", func() {
  expect.nat(1 + 1).equal(2);
});
```

- [ ] **Step 4: Run the test**

Run: `mops test`
Expected: `backend/test/types.test.mo` runs, 1 passing.

- [ ] **Step 5: Commit**

```bash
git add mops.toml mops.lock backend/test/types.test.mo
git commit -m "test: add mo:test harness and backend test scaffold"
```

### Task 0.2: Add Vitest for frontend pure-logic tests

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/vitest.config.ts`, `frontend/src/lib/sanity.test.ts`

- [ ] **Step 1: Install Vitest**

Run: `npm install -D vitest --prefix frontend`

- [ ] **Step 2: Add the test script**

In `frontend/package.json` `"scripts"`, add: `"test": "vitest run"`.

- [ ] **Step 3: Create `frontend/vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
```

- [ ] **Step 4: Prove the harness**

Create `frontend/src/lib/sanity.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
describe("vitest", () => {
  it("runs", () => { expect(1 + 1).toBe(2); });
});
```

- [ ] **Step 5: Run**

Run: `npm run test --prefix frontend`
Expected: 1 passing test.

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vitest.config.ts frontend/src/lib/sanity.test.ts
git commit -m "test: add vitest harness for frontend logic"
```

---

## Phase 1 — Backend: types, modules, migration

### Task 1.1: Expand shared types

**Files:**
- Modify: `backend/types.mo`

- [ ] **Step 1: Expand `TuneType`** (add `march`, `air`, `strathspey`; keep existing). Replace the `TuneType` block:

```motoko
  public type TuneType = {
    #reel; #jig; #slipJig; #hornpipe; #polka; #slide;
    #march; #waltz; #air; #barnDance; #mazurka; #strathspey;
    #other : Text;
  };
```

- [ ] **Step 2: Add an `ExternalLink` type and extend `Tune`.** Add near the tune types:

```motoko
  public type ExternalLinkKind = { #audio; #video; #sheetMusic; #thesession; #other };

  public type ExternalLink = {
    kind : ExternalLinkKind;
    url : Text;
    label : Text;
    addedBy : Principal;
    createdAt : Time.Time;
  };

  public type TuneComment = {
    id : Nat;
    author : Principal;
    text : Text;
    createdAt : Time.Time;
  };
```

Add `externalLinks : [ExternalLink];` and `discussion : [TuneComment];` to the `Tune` record (after `starredBy`). Initialize both to `[]` everywhere a `Tune` is constructed (Task 1.7 updates `tunes.mo`).

- [ ] **Step 3: Add `username` to `UserProfile`** as an **optional** field (optional is required for stable-upgrade compatibility — old records read back as `null`). In `UserProfile`, add:

```motoko
    username : ?Text;
```

- [ ] **Step 4: Add the tunebook-entry types:**

```motoko
  // ── Tunebook entries ──

  public type TuneStatus = {
    #want_to_learn; #learning; #know; #rusty; #forgot; #retired;
  };

  public type TunebookEntry = {
    user : Principal;
    tuneId : Nat;
    status : TuneStatus;
    key : ?Text;          // the key THIS user plays it in
    settingId : ?Nat;     // optional specific setting
    note : ?Text;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };
```

- [ ] **Step 5: Add the social / feed / notification types:**

```motoko
  // ── Follows ──
  public type Follow = {
    follower : Principal;
    followee : Principal;
    createdAt : Time.Time;
  };

  // ── Feed ──
  public type FeedVerb = {
    #addedTune : { tuneId : Nat; status : ?TuneStatus };
    #changedStatus : { tuneId : Nat; from : TuneStatus; to : TuneStatus };
    #addedSetting : { tuneId : Nat; settingId : Nat };
    #addedAlternateName : { tuneId : Nat; name : Text };
    #followed : { target : Principal };
    #joinedSession : { sessionId : Nat };
    #attendedSession : { sessionId : Nat };
    #createdSetlist : { setlistId : Nat };
    #postedTuneComment : { tuneId : Nat; commentId : Nat };
  };

  public type ReactionKind = { #love; #playToo; #nice };

  public type Reaction = { user : Principal; kind : ReactionKind };

  public type FeedComment = {
    id : Nat;
    author : Principal;
    text : Text;
    createdAt : Time.Time;
  };

  public type FeedEvent = {
    id : Nat;
    actor : Principal;
    verb : FeedVerb;
    reactions : [Reaction];
    comments : [FeedComment];
    createdAt : Time.Time;
  };

  // ── Notifications ──
  public type NotificationKind = {
    #newFollower : { from : Principal };
    #followedBack : { from : Principal };
    #reaction : { eventId : Nat; from : Principal; kind : ReactionKind };
    #comment : { eventId : Nat; from : Principal };
    #followeeActivity : { eventId : Nat; from : Principal };
  };

  public type Notification = {
    id : Nat;
    recipient : Principal;
    kind : NotificationKind;
    read : Bool;
    createdAt : Time.Time;
  };

  // ── Session attendance ──
  public type SessionAttendance = {
    sessionId : Nat;
    user : Principal;
    when : Time.Time;     // the night attended
    createdAt : Time.Time;
  };
```

- [ ] **Step 6: Verify it compiles**

Run: `$(mops toolchain bin moc) --check $(mops sources) backend/types.mo`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add backend/types.mo
git commit -m "feat: expand types for entries, follows, feed, notifications, attendance"
```

### Task 1.2: Build the `entries` module (TDD)

**Files:**
- Create: `backend/entries.mo`, `backend/test/entries.test.mo`

- [ ] **Step 1: Write the failing test** — `backend/test/entries.test.mo`:

```motoko
import { test; expect } "mo:test";
import Principal "mo:base/Principal";
import Entries "../entries";

let alice = Principal.fromText("aaaaa-aa");

test("set then read an entry", func() {
  let s = Entries.initStore();
  Entries.set(s, alice, 1, #learning, ?"Edor", null, null);
  let e = Entries.get(s, alice, 1);
  switch (e) {
    case (?entry) { expect.bool(entry.status == #learning).isTrue() };
    case null { expect.bool(false).isTrue() };
  };
});

test("changing status updates the same entry and reports the previous status", func() {
  let s = Entries.initStore();
  Entries.set(s, alice, 1, #want_to_learn, null, null, null);
  let prev = Entries.changeStatus(s, alice, 1, #learning);
  expect.bool(prev == ?#want_to_learn).isTrue();
  expect.nat(Entries.listByUser(s, alice).size()).equal(1);
});

test("listByStatus filters", func() {
  let s = Entries.initStore();
  Entries.set(s, alice, 1, #know, null, null, null);
  Entries.set(s, alice, 2, #learning, null, null, null);
  expect.nat(Entries.listByStatus(s, alice, #know).size()).equal(1);
});

test("counts groups by status across all users", func() {
  let s = Entries.initStore();
  Entries.set(s, alice, 1, #know, null, null, null);
  let c = Entries.countsForTune(s, 1);
  expect.nat(c.know).equal(1);
  expect.nat(c.learning).equal(0);
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `mops test`
Expected: FAIL — `entries.mo` not found / functions undefined.

- [ ] **Step 3: Implement `backend/entries.mo`** (key = `Text` of `principal#tuneId`; mirror existing module style):

```motoko
import Types "types";
import Map "mo:map/Map";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Array "mo:base/Array";

module {

  public type EntryStore = {
    var entries : Map.Map<Text, Types.TunebookEntry>;
  };

  public func initStore() : EntryStore {
    { var entries = Map.new<Text, Types.TunebookEntry>() };
  };

  func keyOf(user : Principal, tuneId : Nat) : Text {
    Principal.toText(user) # "#" # Nat.toText(tuneId);
  };

  public func get(s : EntryStore, user : Principal, tuneId : Nat) : ?Types.TunebookEntry {
    Map.get(s.entries, Map.thash, keyOf(user, tuneId));
  };

  public func set(
    s : EntryStore, user : Principal, tuneId : Nat,
    status : Types.TuneStatus, key : ?Text, settingId : ?Nat, note : ?Text
  ) : () {
    let k = keyOf(user, tuneId);
    let now = Time.now();
    let created = switch (Map.get(s.entries, Map.thash, k)) {
      case (?prev) { prev.createdAt };
      case null { now };
    };
    let entry : Types.TunebookEntry = {
      user; tuneId; status; key; settingId; note;
      createdAt = created; updatedAt = now;
    };
    Map.set(s.entries, Map.thash, k, entry);
  };

  // Returns the previous status if the entry existed.
  public func changeStatus(s : EntryStore, user : Principal, tuneId : Nat, to : Types.TuneStatus) : ?Types.TuneStatus {
    let k = keyOf(user, tuneId);
    switch (Map.get(s.entries, Map.thash, k)) {
      case null { set(s, user, tuneId, to, null, null, null); null };
      case (?prev) {
        Map.set(s.entries, Map.thash, k, { prev with status = to; updatedAt = Time.now() });
        ?prev.status;
      };
    };
  };

  public func remove(s : EntryStore, user : Principal, tuneId : Nat) : () {
    Map.delete(s.entries, Map.thash, keyOf(user, tuneId));
  };

  public func listByUser(s : EntryStore, user : Principal) : [Types.TunebookEntry] {
    Array.filter<Types.TunebookEntry>(
      Iter.toArray(Map.vals(s.entries)),
      func(e) { e.user == user }
    );
  };

  public func listByStatus(s : EntryStore, user : Principal, status : Types.TuneStatus) : [Types.TunebookEntry] {
    Array.filter<Types.TunebookEntry>(listByUser(s, user), func(e) { e.status == status });
  };

  public func listByTune(s : EntryStore, tuneId : Nat) : [Types.TunebookEntry] {
    Array.filter<Types.TunebookEntry>(
      Iter.toArray(Map.vals(s.entries)),
      func(e) { e.tuneId == tuneId }
    );
  };

  public type StatusCounts = { know : Nat; learning : Nat; want_to_learn : Nat; rusty : Nat; forgot : Nat; retired : Nat };

  public func countsForTune(s : EntryStore, tuneId : Nat) : StatusCounts {
    var c : StatusCounts = { know = 0; learning = 0; want_to_learn = 0; rusty = 0; forgot = 0; retired = 0 };
    for (e in listByTune(s, tuneId).vals()) {
      c := switch (e.status) {
        case (#know) { { c with know = c.know + 1 } };
        case (#learning) { { c with learning = c.learning + 1 } };
        case (#want_to_learn) { { c with want_to_learn = c.want_to_learn + 1 } };
        case (#rusty) { { c with rusty = c.rusty + 1 } };
        case (#forgot) { { c with forgot = c.forgot + 1 } };
        case (#retired) { { c with retired = c.retired + 1 } };
      };
    };
    c;
  };
};
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `mops test`
Expected: all `entries` tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/entries.mo backend/test/entries.test.mo
git commit -m "feat: add tunebook entries module with status tracking (tested)"
```

### Task 1.3: Build the `follows` module (TDD)

**Files:**
- Create: `backend/follows.mo`, `backend/test/follows.test.mo`

- [ ] **Step 1: Write the failing test** — `backend/test/follows.test.mo`:

```motoko
import { test; expect } "mo:test";
import Principal "mo:base/Principal";
import Follows "../follows";

let a = Principal.fromText("aaaaa-aa");
let b = Principal.fromText("2vxsx-fae");

test("follow then query following and followers", func() {
  let s = Follows.initStore();
  Follows.follow(s, a, b);
  expect.bool(Follows.isFollowing(s, a, b)).isTrue();
  expect.nat(Follows.following(s, a).size()).equal(1);
  expect.nat(Follows.followers(s, b).size()).equal(1);
});

test("follow is idempotent", func() {
  let s = Follows.initStore();
  Follows.follow(s, a, b);
  Follows.follow(s, a, b);
  expect.nat(Follows.following(s, a).size()).equal(1);
});

test("followsYou is true only when mutual", func() {
  let s = Follows.initStore();
  Follows.follow(s, a, b);
  expect.bool(Follows.followsYou(s, a, b)).isFalse();  // b does not follow a yet
  Follows.follow(s, b, a);
  expect.bool(Follows.followsYou(s, a, b)).isTrue();
});

test("unfollow removes the edge", func() {
  let s = Follows.initStore();
  Follows.follow(s, a, b);
  Follows.unfollow(s, a, b);
  expect.bool(Follows.isFollowing(s, a, b)).isFalse();
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `mops test`
Expected: FAIL — `follows.mo` undefined.

- [ ] **Step 3: Implement `backend/follows.mo`:**

```motoko
import Types "types";
import Map "mo:map/Map";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Array "mo:base/Array";

module {

  public type FollowStore = {
    var follows : Map.Map<Text, Types.Follow>;
  };

  public func initStore() : FollowStore {
    { var follows = Map.new<Text, Types.Follow>() };
  };

  func keyOf(follower : Principal, followee : Principal) : Text {
    Principal.toText(follower) # ">" # Principal.toText(followee);
  };

  public func follow(s : FollowStore, follower : Principal, followee : Principal) : () {
    if (follower == followee) { return };
    let k = keyOf(follower, followee);
    switch (Map.get(s.follows, Map.thash, k)) {
      case (?_) {};
      case null {
        Map.set(s.follows, Map.thash, k, { follower; followee; createdAt = Time.now() });
      };
    };
  };

  public func unfollow(s : FollowStore, follower : Principal, followee : Principal) : () {
    Map.delete(s.follows, Map.thash, keyOf(follower, followee));
  };

  public func isFollowing(s : FollowStore, follower : Principal, followee : Principal) : Bool {
    Map.get(s.follows, Map.thash, keyOf(follower, followee)) != null;
  };

  // Does `other` follow `me`?
  public func followsYou(s : FollowStore, me : Principal, other : Principal) : Bool {
    isFollowing(s, other, me);
  };

  public func following(s : FollowStore, who : Principal) : [Principal] {
    Array.mapFilter<Types.Follow, Principal>(
      Iter.toArray(Map.vals(s.follows)),
      func(f) { if (f.follower == who) ?f.followee else null }
    );
  };

  public func followers(s : FollowStore, who : Principal) : [Principal] {
    Array.mapFilter<Types.Follow, Principal>(
      Iter.toArray(Map.vals(s.follows)),
      func(f) { if (f.followee == who) ?f.follower else null }
    );
  };
};
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `mops test`
Expected: all `follows` tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/follows.mo backend/test/follows.test.mo
git commit -m "feat: add one-way follow graph module (tested)"
```

### Task 1.4: Build the `feed` module (TDD)

**Files:**
- Create: `backend/feed.mo`, `backend/test/feed.test.mo`

- [ ] **Step 1: Write the failing test** — `backend/test/feed.test.mo`:

```motoko
import { test; expect } "mo:test";
import Principal "mo:base/Principal";
import Feed "../feed";

let a = Principal.fromText("aaaaa-aa");
let b = Principal.fromText("2vxsx-fae");

test("append assigns increasing ids", func() {
  let s = Feed.initStore();
  let id1 = Feed.append(s, a, #addedTune({ tuneId = 1; status = ?#learning }));
  let id2 = Feed.append(s, a, #followed({ target = b }));
  expect.bool(id2 > id1).isTrue();
});

test("react adds and toggles off a reaction by the same user", func() {
  let s = Feed.initStore();
  let id = Feed.append(s, a, #addedTune({ tuneId = 1; status = null }));
  Feed.react(s, id, b, #love);
  switch (Feed.get(s, id)) { case (?e) { expect.nat(e.reactions.size()).equal(1) }; case null { assert false } };
  Feed.react(s, id, b, #love);  // same kind again toggles off
  switch (Feed.get(s, id)) { case (?e) { expect.nat(e.reactions.size()).equal(0) }; case null { assert false } };
});

test("comment appends", func() {
  let s = Feed.initStore();
  let id = Feed.append(s, a, #addedTune({ tuneId = 1; status = null }));
  ignore Feed.comment(s, id, b, "lovely tune");
  switch (Feed.get(s, id)) { case (?e) { expect.nat(e.comments.size()).equal(1) }; case null { assert false } };
});

test("feedFor returns only events by the given authors, newest first", func() {
  let s = Feed.initStore();
  ignore Feed.append(s, a, #addedTune({ tuneId = 1; status = null }));
  ignore Feed.append(s, b, #addedTune({ tuneId = 2; status = null }));
  let mine = Feed.feedFor(s, [a]);  // only a's events
  expect.nat(mine.size()).equal(1);
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `mops test`
Expected: FAIL — `feed.mo` undefined.

- [ ] **Step 3: Implement `backend/feed.mo`:**

```motoko
import Types "types";
import Map "mo:map/Map";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Array "mo:base/Array";

module {

  public type FeedStore = {
    var events : Map.Map<Nat, Types.FeedEvent>;
    var nextEventId : Nat;
    var nextCommentId : Nat;
  };

  public func initStore() : FeedStore {
    { var events = Map.new<Nat, Types.FeedEvent>(); var nextEventId = 1; var nextCommentId = 1 };
  };

  public func append(s : FeedStore, actor : Principal, verb : Types.FeedVerb) : Nat {
    let id = s.nextEventId;
    s.nextEventId += 1;
    Map.set(s.events, Map.nhash, id, {
      id; actor; verb; reactions = []; comments = []; createdAt = Time.now();
    });
    id;
  };

  public func get(s : FeedStore, id : Nat) : ?Types.FeedEvent {
    Map.get(s.events, Map.nhash, id);
  };

  // Toggle semantics: same (user,kind) again removes it; a different kind replaces.
  public func react(s : FeedStore, id : Nat, user : Principal, kind : Types.ReactionKind) : () {
    switch (Map.get(s.events, Map.nhash, id)) {
      case null {};
      case (?e) {
        let existing = Array.find<Types.Reaction>(e.reactions, func(r) { r.user == user });
        let next = switch (existing) {
          case (?r) {
            if (r.kind == kind) { Array.filter<Types.Reaction>(e.reactions, func(x) { x.user != user }) }
            else { Array.map<Types.Reaction, Types.Reaction>(e.reactions, func(x) { if (x.user == user) { user; kind } else x }) };
          };
          case null { Array.append(e.reactions, [{ user; kind }]) };
        };
        Map.set(s.events, Map.nhash, id, { e with reactions = next });
      };
    };
  };

  public func comment(s : FeedStore, id : Nat, author : Principal, text : Text) : ?Nat {
    switch (Map.get(s.events, Map.nhash, id)) {
      case null { null };
      case (?e) {
        let cid = s.nextCommentId;
        s.nextCommentId += 1;
        let c : Types.FeedComment = { id = cid; author; text; createdAt = Time.now() };
        Map.set(s.events, Map.nhash, id, { e with comments = Array.append(e.comments, [c]) });
        ?cid;
      };
    };
  };

  // Events authored by any principal in `authors`, newest-first.
  public func feedFor(s : FeedStore, authors : [Principal]) : [Types.FeedEvent] {
    let mine = Array.filter<Types.FeedEvent>(
      Iter.toArray(Map.vals(s.events)),
      func(e) { Array.find<Principal>(authors, func(p) { p == e.actor }) != null }
    );
    Array.sort<Types.FeedEvent>(mine, func(x, y) { Int.compare(y.createdAt, x.createdAt) });
  };

  public func byActor(s : FeedStore, who : Principal) : [Types.FeedEvent] {
    feedFor(s, [who]);
  };
};
```

Add `import Int "mo:base/Int";` at the top (used by `sort`).

- [ ] **Step 4: Run tests to confirm they pass**

Run: `mops test`
Expected: all `feed` tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/feed.mo backend/test/feed.test.mo
git commit -m "feat: add feed module with events, reactions, comments (tested)"
```

### Task 1.5: Build the `notifications` module (TDD)

**Files:**
- Create: `backend/notifications.mo`, `backend/test/notifications.test.mo`

- [ ] **Step 1: Write the failing test** — `backend/test/notifications.test.mo`:

```motoko
import { test; expect } "mo:test";
import Principal "mo:base/Principal";
import Notifications "../notifications";

let a = Principal.fromText("aaaaa-aa");
let b = Principal.fromText("2vxsx-fae");

test("create then list and unread count", func() {
  let s = Notifications.initStore();
  ignore Notifications.create(s, a, #newFollower({ from = b }));
  expect.nat(Notifications.listFor(s, a).size()).equal(1);
  expect.nat(Notifications.unreadCount(s, a)).equal(1);
});

test("markAllRead zeroes the unread count", func() {
  let s = Notifications.initStore();
  ignore Notifications.create(s, a, #newFollower({ from = b }));
  Notifications.markAllRead(s, a);
  expect.nat(Notifications.unreadCount(s, a)).equal(0);
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `mops test`
Expected: FAIL — `notifications.mo` undefined.

- [ ] **Step 3: Implement `backend/notifications.mo`:**

```motoko
import Types "types";
import Map "mo:map/Map";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Array "mo:base/Array";

module {

  public type NotificationStore = {
    var items : Map.Map<Nat, Types.Notification>;
    var nextId : Nat;
  };

  public func initStore() : NotificationStore {
    { var items = Map.new<Nat, Types.Notification>(); var nextId = 1 };
  };

  public func create(s : NotificationStore, recipient : Principal, kind : Types.NotificationKind) : Nat {
    let id = s.nextId;
    s.nextId += 1;
    Map.set(s.items, Map.nhash, id, { id; recipient; kind; read = false; createdAt = Time.now() });
    id;
  };

  public func listFor(s : NotificationStore, who : Principal) : [Types.Notification] {
    let mine = Array.filter<Types.Notification>(
      Iter.toArray(Map.vals(s.items)),
      func(n) { n.recipient == who }
    );
    Array.sort<Types.Notification>(mine, func(x, y) { Int.compare(y.createdAt, x.createdAt) });
  };

  public func unreadCount(s : NotificationStore, who : Principal) : Nat {
    Array.size(Array.filter<Types.Notification>(listFor(s, who), func(n) { not n.read }));
  };

  public func markAllRead(s : NotificationStore, who : Principal) : () {
    for (n in listFor(s, who).vals()) {
      Map.set(s.items, Map.nhash, n.id, { n with read = true });
    };
  };
};
```

Add `import Int "mo:base/Int";` at the top.

- [ ] **Step 4: Run tests to confirm they pass**

Run: `mops test`
Expected: all `notifications` tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/notifications.mo backend/test/notifications.test.mo
git commit -m "feat: add in-app notifications module (tested)"
```

### Task 1.6: Build the `discovery` module (TDD)

**Files:**
- Create: `backend/discovery.mo`, `backend/test/discovery.test.mo`

Discovery is pure ranking over the other stores. It takes already-fetched data as arguments (keeping it pure and testable) — `main.mo` gathers inputs and calls it.

- [ ] **Step 1: Write the failing test** — `backend/test/discovery.test.mo`:

```motoko
import { test; expect } "mo:test";
import Discovery "../discovery";

test("trending ranks tune ids by recent activity count desc", func() {
  // (tuneId, activityCount) pairs
  let ranked = Discovery.rankTrending([(1, 2), (2, 5), (3, 1)]);
  expect.nat(ranked[0]).equal(2);
  expect.nat(ranked[1]).equal(1);
  expect.nat(ranked[2]).equal(3);
});

test("overlap returns tunes the other knows that I do not", func() {
  let mine = [1, 2, 3];
  let theirs = [2, 3, 4, 5];
  let newToMe = Discovery.overlapTheyHaveIDont(mine, theirs);
  expect.nat(newToMe.size()).equal(2);  // 4 and 5
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `mops test`
Expected: FAIL — `discovery.mo` undefined.

- [ ] **Step 3: Implement `backend/discovery.mo`:**

```motoko
import Array "mo:base/Array";
import Nat "mo:base/Nat";

module {

  // Sort (tuneId, count) pairs by count desc and return tune ids.
  public func rankTrending(pairs : [(Nat, Nat)]) : [Nat] {
    let sorted = Array.sort<(Nat, Nat)>(pairs, func(x, y) { Nat.compare(y.1, x.1) });
    Array.map<(Nat, Nat), Nat>(sorted, func(p) { p.0 });
  };

  // Tunes the other player has that I don't.
  public func overlapTheyHaveIDont(mine : [Nat], theirs : [Nat]) : [Nat] {
    Array.filter<Nat>(theirs, func(t) { Array.find<Nat>(mine, func(m) { m == t }) == null });
  };

  // Tunes we both have.
  public func sharedTunes(mine : [Nat], theirs : [Nat]) : [Nat] {
    Array.filter<Nat>(mine, func(t) { Array.find<Nat>(theirs, func(o) { o == t }) != null });
  };
};
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `mops test`
Expected: all `discovery` tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/discovery.mo backend/test/discovery.test.mo
git commit -m "feat: add discovery ranking module (tested)"
```

### Task 1.7: Extend `users`, `tunes`, `sessions` modules (TDD)

**Files:**
- Modify: `backend/users.mo`, `backend/tunes.mo`, `backend/sessions.mo`
- Create: `backend/test/users.test.mo`, `backend/test/sessions.test.mo`

- [ ] **Step 1: Write failing tests** — `backend/test/users.test.mo`:

```motoko
import { test; expect } "mo:test";
import Principal "mo:base/Principal";
import Users "../users";

let a = Principal.fromText("aaaaa-aa");
let b = Principal.fromText("2vxsx-fae");

test("username availability and claim", func() {
  let s = Users.initStore();
  Users.saveProfile(s, a, { displayName = "A"; photo = null; location = null; instruments = []; bio = null; username = null; createdAt = 0 });
  expect.bool(Users.isUsernameAvailable(s, "aoife")).isTrue();
  ignore Users.setUsername(s, a, "aoife");
  expect.bool(Users.isUsernameAvailable(s, "aoife")).isFalse();
});

test("setUsername rejects a name taken by someone else", func() {
  let s = Users.initStore();
  Users.saveProfile(s, a, { displayName = "A"; photo = null; location = null; instruments = []; bio = null; username = null; createdAt = 0 });
  Users.saveProfile(s, b, { displayName = "B"; photo = null; location = null; instruments = []; bio = null; username = null; createdAt = 0 });
  ignore Users.setUsername(s, a, "aoife");
  expect.bool(Users.setUsername(s, b, "aoife")).isFalse();
});
```

`backend/test/sessions.test.mo`:

```motoko
import { test; expect } "mo:test";
import Principal "mo:base/Principal";
import Sessions "../sessions";

let a = Principal.fromText("aaaaa-aa");
let loc = { city = "Dublin"; country = "Ireland" };

test("check-in records attendance for a session", func() {
  let s = Sessions.initStore();
  let id = Sessions.createSession(s, a, "Cobblestone", loc, "Tue 9pm", #weekly, true, #allLevels, "");
  Sessions.checkIn(s, a, id, 1234);
  expect.nat(Sessions.listAttendance(s, id).size()).equal(1);
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `mops test`
Expected: FAIL — `isUsernameAvailable` / `setUsername` / `checkIn` / `listAttendance` undefined.

- [ ] **Step 3: Add username support to `backend/users.mo`.** Add a username index to the store and helpers:

In `UserStore`, add `var usernames : Map.Map<Text, Principal>;` and initialize it in `initStore` with `Map.new<Text, Principal>()`. Then add:

```motoko
  public func isUsernameAvailable(store : UserStore, name : Text) : Bool {
    Map.get(store.usernames, Map.thash, name) == null;
  };

  public func getByUsername(store : UserStore, name : Text) : ?Types.StoredUserProfile {
    switch (Map.get(store.usernames, Map.thash, name)) {
      case null { null };
      case (?p) { Map.get(store.users, Map.phash, p) };
    };
  };

  // Returns false if the name is taken by a different principal.
  public func setUsername(store : UserStore, caller : Principal, name : Text) : Bool {
    switch (Map.get(store.usernames, Map.thash, name)) {
      case (?owner) { if (owner != caller) { return false } };
      case null {};
    };
    switch (Map.get(store.users, Map.phash, caller)) {
      case null { false };
      case (?user) {
        switch (user.profile.username) {
          case (?old) { Map.delete(store.usernames, Map.thash, old) };
          case null {};
        };
        Map.set(store.usernames, Map.thash, name, caller);
        Map.set(store.users, Map.phash, caller, { user with profile = { user.profile with username = ?name } });
        true;
      };
    };
  };
```

- [ ] **Step 4: Add external links + discussion to `backend/tunes.mo`** and initialize the new `Tune` fields. In `createTune` and `addSetting`'s tune-construction, set `externalLinks = [];` and `discussion = [];`. Add:

```motoko
  public func addExternalLink(store : TuneStore, caller : Principal, tuneId : Nat, kind : Types.ExternalLinkKind, url : Text, label : Text) : Bool {
    switch (Map.get(store.tunes, Map.nhash, tuneId)) {
      case null { false };
      case (?tune) {
        let link : Types.ExternalLink = { kind; url; label; addedBy = caller; createdAt = Time.now() };
        Map.set(store.tunes, Map.nhash, tuneId, { tune with externalLinks = Array.append(tune.externalLinks, [link]) });
        true;
      };
    };
  };

  public func addTuneComment(store : TuneStore, caller : Principal, tuneId : Nat, text : Text) : ?Nat {
    switch (Map.get(store.tunes, Map.nhash, tuneId)) {
      case null { null };
      case (?tune) {
        let cid = store.nextCommentId;
        store.nextCommentId += 1;
        let c : Types.TuneComment = { id = cid; author = caller; text; createdAt = Time.now() };
        Map.set(store.tunes, Map.nhash, tuneId, { tune with discussion = Array.append(tune.discussion, [c]) });
        ?cid;
      };
    };
  };
```

Add `var nextCommentId : Nat;` to `TuneStore` and initialize to `1` in `initStore`.

- [ ] **Step 5: Add attendance to `backend/sessions.mo`.** Add `var attendance : Map.Map<Nat, Types.SessionAttendance>;` and `var nextAttendanceId : Nat;` to `SessionStore` (init empty / `1`). Add:

```motoko
  public func checkIn(store : SessionStore, caller : Principal, sessionId : Nat, whenTime : Int) : () {
    let id = store.nextAttendanceId;
    store.nextAttendanceId += 1;
    Map.set(store.attendance, Map.nhash, id, {
      sessionId; user = caller; when = whenTime; createdAt = Time.now();
    });
  };

  public func listAttendance(store : SessionStore, sessionId : Nat) : [Types.SessionAttendance] {
    Array.filter<Types.SessionAttendance>(
      Iter.toArray(Map.vals(store.attendance)),
      func(att) { att.sessionId == sessionId }
    );
  };
```

- [ ] **Step 6: Run tests to confirm they pass**

Run: `mops test`
Expected: all `users` and `sessions` tests PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/users.mo backend/tunes.mo backend/sessions.mo backend/test/users.test.mo backend/test/sessions.test.mo
git commit -m "feat: usernames, tune external links + discussion, session attendance (tested)"
```

### Task 1.8: Migration module + wire `main.mo` + smoke test

**Files:**
- Create: `backend/migration.mo`
- Modify: `backend/main.mo`, `backend/backend.did`, `icp.yaml`

- [ ] **Step 1: Implement `backend/migration.mo`** — a pure function that, given the legacy stores, backfills the new stores. It is idempotent-guarded by a flag in `main.mo`.

```motoko
import Types "types";
import Users "users";
import Entries "entries";
import Follows "follows";
import Social "social";
import Tunes "tunes";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Nat "mo:base/Nat";

module {

  // Backfill entries from each user's legacy known/wishlist arrays.
  public func backfillEntries(userStore : Users.UserStore, entryStore : Entries.EntryStore) : () {
    for (u in Users.listUsers(userStore).vals()) {
      for (tid in u.knownTuneIds.vals()) {
        if (Entries.get(entryStore, u.principal, tid) == null) {
          Entries.set(entryStore, u.principal, tid, #know, null, null, null);
        };
      };
      for (tid in u.wishListTuneIds.vals()) {
        if (Entries.get(entryStore, u.principal, tid) == null) {
          Entries.set(entryStore, u.principal, tid, #want_to_learn, null, null, null);
        };
      };
    };
  };

  // Accepted friendships become mutual follows.
  public func backfillFollows(socialStore : Social.SocialStore, userStore : Users.UserStore, followStore : Follows.FollowStore) : () {
    for (u in Users.listUsers(userStore).vals()) {
      for (friend in Social.getFriends(socialStore, u.principal).vals()) {
        Follows.follow(followStore, u.principal, friend);
      };
    };
  };

  // Give every profile without a username a provisional slug-based one.
  public func backfillUsernames(userStore : Users.UserStore) : () {
    for (u in Users.listUsers(userStore).vals()) {
      switch (u.profile.username) {
        case (?_) {};
        case null {
          let base = Tunes.makeSlug(u.profile.displayName);
          let candidate = if (Text.size(base) == 0) "player" else base;
          var name = candidate;
          var n = 1;
          while (not Users.isUsernameAvailable(userStore, name)) {
            name := candidate # Nat.toText(n);
            n += 1;
          };
          ignore Users.setUsername(userStore, u.principal, name);
        };
      };
    };
  };
};
```

- [ ] **Step 2: Wire `main.mo`.** Add the new stable stores, the migration guard, and `postupgrade`. Add near the other `stable var` lines:

```motoko
  stable var entryStore = Entries.initStore();
  stable var followStore = Follows.initStore();
  stable var feedStore = Feed.initStore();
  stable var notificationStore = Notifications.initStore();
  stable var migratedToSocialV2 : Bool = false;

  system func postupgrade() {
    if (not migratedToSocialV2) {
      Migration.backfillEntries(userStore, entryStore);
      Migration.backfillFollows(socialStore, userStore, followStore);
      Migration.backfillUsernames(userStore);
      migratedToSocialV2 := true;
    };
  };
```

Add the imports: `import Entries "entries"; import Follows "follows"; import Feed "feed"; import Notifications "notifications"; import Discovery "discovery"; import Migration "migration"; import Int "mo:base/Int";`.

- [ ] **Step 3: Add the new endpoints to `main.mo`.** These delegate to modules and emit feed events / notifications as side effects. Add a private helper and the public functions:

```motoko
  // Notify everyone who follows `actor` about a new event.
  func notifyFollowersOfEvent(actorP : Principal, eventId : Nat) {
    for (f in Follows.followers(followStore, actorP).vals()) {
      ignore Notifications.create(notificationStore, f, #followeeActivity({ eventId; from = actorP }));
    };
  };

  // ── Tunebook entries ──
  public shared ({ caller }) func setEntry(tuneId : Nat, status : Types.TuneStatus, key : ?Text, settingId : ?Nat, note : ?Text) : async () {
    requireAuth(caller);
    let existed = Entries.get(entryStore, caller, tuneId);
    Entries.set(entryStore, caller, tuneId, status, key, settingId, note);
    Users.addToTunebook(userStore, caller, tuneId); // keep legacy array in sync during transition
    let verb : Types.FeedVerb = switch (existed) {
      case (?prev) { #changedStatus({ tuneId; from = prev.status; to = status }) };
      case null { #addedTune({ tuneId; status = ?status }) };
    };
    notifyFollowersOfEvent(caller, Feed.append(feedStore, caller, verb));
  };

  public shared ({ caller }) func removeEntry(tuneId : Nat) : async () {
    requireAuth(caller);
    Entries.remove(entryStore, caller, tuneId);
    Users.removeFromTunebook(userStore, caller, tuneId);
  };

  public query func getEntriesByUser(who : Principal) : async [Types.TunebookEntry] {
    Entries.listByUser(entryStore, who);
  };

  public query ({ caller }) func getMyEntries() : async [Types.TunebookEntry] {
    Entries.listByUser(entryStore, caller);
  };

  public query func getEntriesForTune(tuneId : Nat) : async [Types.TunebookEntry] {
    Entries.listByTune(entryStore, tuneId);
  };

  public query func getTuneStatusCounts(tuneId : Nat) : async Entries.StatusCounts {
    Entries.countsForTune(entryStore, tuneId);
  };

  // ── Follows ──
  public shared ({ caller }) func follow(target : Principal) : async () {
    requireAuth(caller);
    Follows.follow(followStore, caller, target);
    ignore Notifications.create(notificationStore, target, #newFollower({ from = caller }));
    if (Follows.isFollowing(followStore, target, caller)) {
      ignore Notifications.create(notificationStore, target, #followedBack({ from = caller }));
    };
    notifyFollowersOfEvent(caller, Feed.append(feedStore, caller, #followed({ target })));
  };

  public shared ({ caller }) func unfollow(target : Principal) : async () {
    requireAuth(caller);
    Follows.unfollow(followStore, caller, target);
  };

  public query func getFollowers(who : Principal) : async [Principal] { Follows.followers(followStore, who) };
  public query func getFollowing(who : Principal) : async [Principal] { Follows.following(followStore, who) };
  public query ({ caller }) func amIFollowing(target : Principal) : async Bool { Follows.isFollowing(followStore, caller, target) };
  public query ({ caller }) func doesFollowMe(other : Principal) : async Bool { Follows.followsYou(followStore, caller, other) };

  // ── Feed ──
  public query ({ caller }) func getMyFeed() : async [Types.FeedEvent] {
    let authors = Array.append(Follows.following(followStore, caller), [caller]);
    Feed.feedFor(feedStore, authors);
  };

  public query func getUserFeed(who : Principal) : async [Types.FeedEvent] { Feed.byActor(feedStore, who) };

  public shared ({ caller }) func reactToEvent(eventId : Nat, kind : Types.ReactionKind) : async () {
    requireAuth(caller);
    Feed.react(feedStore, eventId, caller, kind);
    switch (Feed.get(feedStore, eventId)) {
      case (?e) { if (e.actor != caller) { ignore Notifications.create(notificationStore, e.actor, #reaction({ eventId; from = caller; kind })) } };
      case null {};
    };
  };

  public shared ({ caller }) func commentOnEvent(eventId : Nat, text : Text) : async ?Nat {
    requireAuth(caller);
    let cid = Feed.comment(feedStore, eventId, caller, text);
    switch (Feed.get(feedStore, eventId)) {
      case (?e) { if (e.actor != caller) { ignore Notifications.create(notificationStore, e.actor, #comment({ eventId; from = caller })) } };
      case null {};
    };
    cid;
  };

  // ── Notifications ──
  public query ({ caller }) func getMyNotifications() : async [Types.Notification] { Notifications.listFor(notificationStore, caller) };
  public query ({ caller }) func getMyUnreadCount() : async Nat { Notifications.unreadCount(notificationStore, caller) };
  public shared ({ caller }) func markNotificationsRead() : async () { requireAuth(caller); Notifications.markAllRead(notificationStore, caller) };

  // ── Username ──
  public query func isUsernameAvailable(name : Text) : async Bool { Users.isUsernameAvailable(userStore, name) };
  public query func getUserByUsername(name : Text) : async ?Types.StoredUserProfile { Users.getByUsername(userStore, name) };
  public shared ({ caller }) func setUsername(name : Text) : async Bool { requireAuth(caller); Users.setUsername(userStore, caller, name) };

  // ── Tune links + discussion ──
  public shared ({ caller }) func addExternalLink(tuneId : Nat, kind : Types.ExternalLinkKind, url : Text, label : Text) : async Bool {
    requireAuth(caller); Tunes.addExternalLink(tuneStore, caller, tuneId, kind, url, label);
  };
  public shared ({ caller }) func addTuneComment(tuneId : Nat, text : Text) : async ?Nat {
    requireAuth(caller);
    let cid = Tunes.addTuneComment(tuneStore, caller, tuneId, text);
    switch (cid) { case (?c) { notifyFollowersOfEvent(caller, Feed.append(feedStore, caller, #postedTuneComment({ tuneId; commentId = c }))) }; case null {} };
    cid;
  };

  // ── Session attendance ──
  public shared ({ caller }) func checkInToSession(sessionId : Nat, whenTime : Int) : async () {
    requireAuth(caller);
    Sessions.checkIn(sessionStore, caller, sessionId, whenTime);
    notifyFollowersOfEvent(caller, Feed.append(feedStore, caller, #attendedSession({ sessionId })));
  };
  public query func getSessionAttendance(sessionId : Nat) : async [Types.SessionAttendance] { Sessions.listAttendance(sessionStore, sessionId) };
```

Also update `joinSession` to emit a `#joinedSession` feed event, and `importThesessionTune` to call `Entries.set(..., #know, ...)` in addition to the legacy array, plus append an `#addedTune` event.

- [ ] **Step 4: Add the bulk TheSession import endpoint.** The frontend resolves+imports each tune (reusing `importThesessionTune`) and then calls `setEntry` per tune; no new backend endpoint is required beyond the per-tune ones. Add a thin convenience that sets many statuses at once:

```motoko
  public shared ({ caller }) func setEntriesBulk(items : [(Nat, Types.TuneStatus)]) : async () {
    requireAuth(caller);
    for ((tuneId, status) in items.vals()) {
      Entries.set(entryStore, caller, tuneId, status, null, null, null);
      Users.addToTunebook(userStore, caller, tuneId);
    };
  };
```

- [ ] **Step 5: Build the backend**

Run: `icp build backend`
Expected: compiles with no errors.

- [ ] **Step 6: Regenerate the Candid interface**

Run: `$(mops toolchain bin moc) --idl $(mops sources) -o backend/backend.did backend/main.mo`
Confirm `backend.did` now contains `setEntry`, `follow`, `getMyFeed`, `reactToEvent`, `getMyNotifications`, `setUsername`, `checkInToSession`, etc.

- [ ] **Step 7: Deploy locally and smoke test**

```bash
icp network start -d
icp deploy backend
icp canister call backend createTune '(record { title = "The Kesh Jig"; abcNotation = "X:1\nK:G\nGAB"; tuneType = variant { jig }; key = "G" })'
icp canister call backend setEntry '(1, variant { learning }, opt "G", null, null)'
icp canister call backend getMyEntries '()'
```
Expected: `getMyEntries` returns one entry with `status = variant { learning }`.

- [ ] **Step 8: Verify migration runs once.** Upgrade the canister and confirm the guard prevents double-backfill:

```bash
icp deploy backend   # triggers postupgrade
icp canister call backend getMyFeed '()'
```
Expected: deploy succeeds; no duplicate entries created on repeated upgrades.

- [ ] **Step 9: Commit**

```bash
git add backend/migration.mo backend/main.mo backend/backend.did icp.yaml
git commit -m "feat: wire social-layer endpoints, migration backfill, regen candid"
```

---

## Phase 2 — Frontend data layer

### Task 2.1: Regenerate bindings and add hooks + logic helpers

**Files:**
- Create: `frontend/src/hooks/use-entries.ts`, `use-follows.ts`, `use-feed.ts`, `use-notifications.ts`, `use-discovery.ts`
- Create: `frontend/src/lib/status.ts`, `frontend/src/lib/feed.ts`, `frontend/src/lib/match.ts` (+ `.test.ts` for each)
- Modify: `frontend/src/lib/abc.ts`

- [ ] **Step 1: Regenerate bindings** (vite plugin regenerates from `backend.did` on dev/build, but force it):

Run: `npm run build --prefix frontend`
Expected: `frontend/src/bindings/backend/*` now exposes `setEntry`, `follow`, `getMyFeed`, etc. (Build may fail later in UI files that don't exist yet — that's fine for this step; the binding regen is what matters. If the build blocks on missing pages, temporarily run `npx tsc -p frontend --noEmit` after bindings exist.)

- [ ] **Step 2: Write failing tests for `lib/status.ts`** — `frontend/src/lib/status.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { STATUS_LABELS, statusKey, isActiveStatus } from "./status";

describe("status helpers", () => {
  it("labels every status", () => {
    expect(STATUS_LABELS.want_to_learn).toBe("Want to learn");
    expect(STATUS_LABELS.know).toBe("Know");
  });
  it("statusKey extracts the variant key", () => {
    expect(statusKey({ __kind__: "learning" } as any)).toBe("learning");
  });
  it("isActiveStatus is true for learning, false for retired", () => {
    expect(isActiveStatus("learning")).toBe(true);
    expect(isActiveStatus("retired")).toBe(false);
  });
});
```

- [ ] **Step 3: Run to confirm failure** — `npm run test --prefix frontend` → FAIL (module missing).

- [ ] **Step 4: Implement `frontend/src/lib/status.ts`:**

```typescript
import type { TuneStatus } from "@/bindings/backend/backend";

export type StatusKey = "want_to_learn" | "learning" | "know" | "rusty" | "forgot" | "retired";

export const STATUS_LABELS: Record<StatusKey, string> = {
  want_to_learn: "Want to learn",
  learning: "Learning",
  know: "Know",
  rusty: "Rusty",
  forgot: "Forgot",
  retired: "Retired",
};

// Tailwind accent per status (moss = active/known, amber = learning, stone = dormant).
export const STATUS_CLASSES: Record<StatusKey, string> = {
  want_to_learn: "bg-parchment-200 text-stone-700",
  learning: "bg-amber-100 text-amber-800",
  know: "bg-moss-100 text-moss-800",
  rusty: "bg-stone-100 text-stone-600",
  forgot: "bg-stone-100 text-stone-500",
  retired: "bg-stone-100 text-stone-400",
};

export function statusKey(s: TuneStatus): StatusKey {
  return (s as { __kind__: StatusKey }).__kind__;
}

export function makeStatus(key: StatusKey): TuneStatus {
  return { __kind__: key, [key]: null } as unknown as TuneStatus;
}

export function isActiveStatus(key: StatusKey): boolean {
  return key === "want_to_learn" || key === "learning" || key === "know";
}

export const STATUS_ORDER: StatusKey[] = ["know", "learning", "want_to_learn", "rusty", "forgot", "retired"];
```

- [ ] **Step 5: Run tests to confirm pass** — `npm run test --prefix frontend` → PASS.

- [ ] **Step 6: Write failing tests for `lib/feed.ts`** — `frontend/src/lib/feed.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { groupConsecutiveAdds } from "./feed";

describe("groupConsecutiveAdds", () => {
  it("collapses several addedTune events by the same actor into one group", () => {
    const events = [
      { id: 3n, actorText: "a", kind: "addedTune", tuneId: 3n },
      { id: 2n, actorText: "a", kind: "addedTune", tuneId: 2n },
      { id: 1n, actorText: "b", kind: "followed" },
    ];
    const grouped = groupConsecutiveAdds(events as any);
    expect(grouped.length).toBe(2);
    expect(grouped[0].count).toBe(2);
  });
});
```

- [ ] **Step 7: Implement `frontend/src/lib/feed.ts`** with `groupConsecutiveAdds` and a `describeVerb()` that maps a verb to display copy (e.g. `addedTune+learning` → "is learning", `changedStatus learning→know` → "now knows"). Keep it pure (operates on a normalized event shape the hook produces). Then run tests → PASS.

```typescript
export type NormalizedEvent = {
  id: bigint;
  actorText: string;
  kind: string;       // verb __kind__
  tuneId?: bigint;
  count?: number;     // set when grouped
};

export function groupConsecutiveAdds(events: NormalizedEvent[]): NormalizedEvent[] {
  const out: NormalizedEvent[] = [];
  for (const e of events) {
    const last = out[out.length - 1];
    if (e.kind === "addedTune" && last && last.kind === "addedTune" && last.actorText === e.actorText) {
      last.count = (last.count ?? 1) + 1;
    } else {
      out.push({ ...e, count: e.kind === "addedTune" ? 1 : undefined });
    }
  }
  return out;
}
```

- [ ] **Step 8: Write + implement `lib/match.ts`** for import dedup — `frontend/src/lib/match.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { normalizeTitle, titlesMatch } from "./match";

describe("title matching", () => {
  it("normalizes case, punctuation, and a leading 'The'", () => {
    expect(normalizeTitle("The Silver Spear")).toBe("silver spear");
    expect(normalizeTitle("Cooley's!")).toBe("cooleys");
  });
  it("matches titles that differ only by 'The'/punctuation", () => {
    expect(titlesMatch("The Banshee", "Banshee")).toBe(true);
    expect(titlesMatch("Drowsy Maggie", "The Kesh")).toBe(false);
  });
});
```

```typescript
export function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/['’]/g, "")          // drop apostrophes without splitting the word ("Cooley's" → "cooleys")
    .replace(/^the\s+/, "")        // drop a leading "the"
    .replace(/[^a-z0-9]+/g, " ")   // any other punctuation → a single space
    .trim()
    .replace(/\s+/g, " ");
}
export function titlesMatch(a: string, b: string): boolean {
  return normalizeTitle(a) === normalizeTitle(b);
}
```

(Run tests → PASS. The tests define the contract; this is a deliberately conservative match used only to suggest dedup candidates during import, never to auto-merge.)

- [ ] **Step 9: Add `formatStatus` and extend `formatTuneType` in `frontend/src/lib/abc.ts`** for the new tune types (`march` → "March", `air` → "Air", `strathspey` → "Strathspey", `slipJig` → "Slip Jig", `barnDance` → "Barndance"). Reuse `STATUS_LABELS` from `lib/status.ts` for `formatStatus`.

- [ ] **Step 10: Implement the hooks** following the exact existing pattern (`useAuth().backend`, query keys, `invalidateQueries`). `frontend/src/hooks/use-entries.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/auth";
import type { Principal } from "@icp-sdk/core/principal";
import type { TuneStatus } from "@/bindings/backend/backend";

export function useMyEntries() {
  const { backend } = useAuth();
  return useQuery({ queryKey: ["entries", "me"], queryFn: () => backend!.getMyEntries(), enabled: !!backend });
}
export function useEntriesByUser(who: Principal | undefined) {
  const { backend } = useAuth();
  return useQuery({ queryKey: ["entries", who?.toText()], queryFn: () => backend!.getEntriesByUser(who!), enabled: !!backend && !!who });
}
export function useTuneStatusCounts(tuneId: bigint | undefined) {
  const { backend } = useAuth();
  return useQuery({ queryKey: ["statusCounts", tuneId?.toString()], queryFn: () => backend!.getTuneStatusCounts(tuneId!), enabled: !!backend && tuneId !== undefined });
}
export function useSetEntry() {
  const { backend } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: { tuneId: bigint; status: TuneStatus; key?: string; settingId?: bigint; note?: string }) =>
      backend!.setEntry(a.tuneId, a.status, a.key ?? null, a.settingId ?? null, a.note ?? null),
    onSuccess: (_, a) => {
      qc.invalidateQueries({ queryKey: ["entries", "me"] });
      qc.invalidateQueries({ queryKey: ["statusCounts", a.tuneId.toString()] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
export function useRemoveEntry() {
  const { backend } = useAuth();
  const qc = useQueryClient();
  return useMutation({ mutationFn: (tuneId: bigint) => backend!.removeEntry(tuneId), onSuccess: () => qc.invalidateQueries({ queryKey: ["entries", "me"] }) });
}
```

Create `use-follows.ts` (`useFollow`, `useUnfollow`, `useFollowers`, `useFollowing`, `useAmIFollowing`, `useDoesFollowMe`), `use-feed.ts` (`useMyFeed`, `useUserFeed`, `useReact`, `useComment`), `use-notifications.ts` (`useNotifications`, `useUnreadCount`, `useMarkRead`), and `use-discovery.ts` (`usePeopleToFollow`, `useTunesNearMe`, `useOverlapWith`) — each mirroring the pattern above, calling the matching backend methods, with sensible query keys and invalidation. Delete `use-social.ts` after its consumers are migrated (Task 3.4).

- [ ] **Step 11: Run all frontend tests**

Run: `npm run test --prefix frontend`
Expected: all `lib` tests PASS.

- [ ] **Step 12: Commit**

```bash
git add frontend/src/hooks frontend/src/lib
git commit -m "feat: add entries/follows/feed/notifications/discovery hooks + tested logic helpers"
```

---

## Phase 3 — Frontend screens

> Each UI task verifies by: `npm run build --prefix frontend` (type-check passes) **and** the listed manual checks against a locally deployed backend (`icp deploy backend` then `npm run dev --prefix frontend`). Follow the existing parchment/moss/stone Tailwind tokens, `font-display`/`font-body`, dark-mode classes, and `__kind__` variant handling seen in `profile.tsx`.

### Task 3.1: Status control + Tune detail integration

**Files:**
- Create: `frontend/src/components/status-control.tsx`
- Modify: `frontend/src/pages/tune-detail.tsx`

- [ ] **Step 1:** Build `status-control.tsx` — a control that shows the current entry status for a tune (from `useMyEntries`), a dropdown/segmented picker over `STATUS_ORDER` using `STATUS_LABELS`/`STATUS_CLASSES`, and optional inputs for the key the user plays it in, a setting selector (from the tune's settings), and a note. Calls `useSetEntry()` on change and `useRemoveEntry()` to clear. Props: `{ tuneId: bigint; settings: Setting[] }`.
- [ ] **Step 2:** In `tune-detail.tsx`, replace the star/play UI with `<StatusControl />`; add an "External links" section (render `tune.externalLinks` grouped by `kind`, with an add-link form posting via a new `useAddExternalLink` mutation), a "Who plays this" section using `getEntriesForTune` filtered to the people the viewer follows (`useFollowing`) plus a "+N near you" and "+N others" count derived from `useTuneStatusCounts`, and a discussion thread (`tune.discussion`) with an add-comment box (`addTuneComment`).
- [ ] **Step 3:** Verify — `npm run build --prefix frontend`; manually: set a status on a tune, reload, status persists; add a YouTube link, it appears; post a comment, it appears.
- [ ] **Step 4:** Commit `git commit -m "feat: status control + tune detail social sections"`.

### Task 3.2: My Tunebook page

**Files:**
- Create: `frontend/src/pages/tunebook.tsx`
- Modify: `frontend/src/router.tsx` (add `/me/tunebook` or section within `/me`)

- [ ] **Step 1:** Build a page that loads `useMyEntries()` + `useListTunes()`, joins them, and renders sections grouped by `STATUS_ORDER` (Know / Learning / Want to learn / Rusty / Forgot / Retired), each collapsible with a count. Each row: tune title (link to `/tune/$tuneId`), tune type chip, the key the user plays it in (if set), inline `StatusControl`, and a remove button. Add sort (recent activity / type / key) and a type filter, mirroring the existing list UI patterns.
- [ ] **Step 2:** Verify — build passes; manually: add tunes in different statuses, confirm grouping, change a status and watch it move groups, remove an entry.
- [ ] **Step 3:** Commit `git commit -m "feat: My Tunebook page grouped by status"`.

### Task 3.3: Follow button + profiles

**Files:**
- Create: `frontend/src/components/follow-button.tsx`
- Modify: `frontend/src/pages/user-profile.tsx`, `frontend/src/pages/profile.tsx`

- [ ] **Step 1:** `follow-button.tsx` — given `target: Principal`, uses `useAmIFollowing` + `useDoesFollowMe`; renders "Follow" / "Following" (toggles via `useFollow`/`useUnfollow`) and a small "Follows you" badge when mutual. Optimistic update + toast.
- [ ] **Step 2:** `user-profile.tsx` — header with avatar/username/display name/instruments/location; `<FollowButton />`; stat row (followers, following, status counts from `getEntriesByUser` reduced via `lib/status`); recent activity (`useUserFeed`); public tunebook grouped by status.
- [ ] **Step 3:** `profile.tsx` (now `/me`) — replace `useMyFriends`/`knownTuneIds`/`wishListTuneIds` reads with `useMyEntries` reductions; replace the "Friends" stat with "Following"/"Followers"; remove `use-social` imports.
- [ ] **Step 4:** Verify — build passes; manually with two II identities: follow A→B, B sees "Follows you" once B follows back; counts update.
- [ ] **Step 5:** Commit `git commit -m "feat: one-way follows UI + profile rework"`.

### Task 3.4: Home feed page + feed event card

**Files:**
- Create: `frontend/src/pages/feed.tsx`, `frontend/src/components/feed-event-card.tsx`
- Modify: `frontend/src/router.tsx` (`/` → feed), `frontend/src/components/layout/nav.tsx`
- Delete: `frontend/src/hooks/use-social.ts`

- [ ] **Step 1:** `feed-event-card.tsx` — renders one normalized event: actor (link to their profile), verb copy via `describeVerb`, the tune/session link, relative time, a reaction row (the three `ReactionKind`s with counts via `useReact`), and a comment list + add-comment box (`useComment`). Grouped "added N tunes" cards render a summary.
- [ ] **Step 2:** `feed.tsx` — `useMyFeed()`, normalize events into `NormalizedEvent` + raw lookup, `groupConsecutiveAdds`, render cards; interleave a recommendation card every ~5 events from `useDiscovery` (people to follow / tunes near you). Empty state (no follows yet) links to Discovery.
- [ ] **Step 3:** Routing — make `/` render `feed.tsx`; move the personal page to `/me`; update `nav.tsx` items (Feed, My Tunebook, Discover, Sessions, Notifications, Me). Delete `use-social.ts`.
- [ ] **Step 4:** Verify — build passes; manually: A follows B; B sets a tune to learning; A's feed shows "B is learning X"; A reacts and comments; B gets a notification (Task 3.6).
- [ ] **Step 5:** Commit `git commit -m "feat: home activity feed with reactions and comments"`.

### Task 3.5: Discovery page

**Files:**
- Create: `frontend/src/pages/discovery.tsx`
- Modify: `frontend/src/router.tsx` (`/discover`)

- [ ] **Step 1:** Sections in spec order: People to follow (notables/shared-instrument/near-you/overlap), Tunes active near you, Tunes common among people you follow, Overlap with a specific player (a player picker → `useOverlapWith`), Trending, New on Tunebook, Instrument-relevant. Each uses the discovery hooks; each card has a follow button or quick-add status control.
- [ ] **Step 2:** Verify — build passes; manually: with seeded users/tunes, sections populate; following from a card updates the feed.
- [ ] **Step 3:** Commit `git commit -m "feat: discovery page"`.

### Task 3.6: Notifications + session attendance

**Files:**
- Create: `frontend/src/pages/notifications.tsx`
- Modify: `frontend/src/components/layout/nav.tsx`, `frontend/src/pages/session-detail.tsx`, `frontend/src/pages/sessions.tsx`

- [ ] **Step 1:** `notifications.tsx` — `useNotifications()` list with per-kind copy and links; on mount call `useMarkRead()`. Add an unread dot in `nav.tsx` driven by `useUnreadCount()` (poll via React Query `refetchInterval`).
- [ ] **Step 2:** `session-detail.tsx` — add "I was here" check-in button (`checkInToSession` with `BigInt(Date.now())*1_000_000n`) and a "Recent attendance" list (`getSessionAttendance`). Keep Join.
- [ ] **Step 3:** Verify — build passes; manually: follow someone, have them act, see a notification + unread dot clears on visit; check in to a session and see it in the feed + attendance list.
- [ ] **Step 4:** Commit `git commit -m "feat: notifications page + session attendance UI"`.

### Task 3.7: Onboarding + username + settings

**Files:**
- Create: `frontend/src/pages/onboarding.tsx`, `frontend/src/components/tune-picker.tsx`
- Modify: `frontend/src/router.tsx` (`/onboarding`), `frontend/src/auth.tsx` or `profile.tsx` (route new users to onboarding), `frontend/src/pages/profile.tsx` (username edit in settings card)

- [ ] **Step 1:** `tune-picker.tsx` — a tap-to-add grid of popular tunes (rank `useListTunes()` by `getTuneStatusCounts`/star count desc, fall back to a hardcoded `POPULAR_SEED` list of well-known titles) + a search box (`useSearchThesession` + local) + a "Import from TheSession" button. Selecting a tune adds it via `useSetEntry` with a default status the user can change.
- [ ] **Step 2:** `onboarding.tsx` — skippable stepper: (1) choose username (`isUsernameAvailable` live check, `setUsername`), optional display name; (2) instruments (reuse `InstrumentPicker` extracted from `profile.tsx`) + optional location; (3) `<TunePicker />` to add 5–10 or run TheSession bulk import (resolve each tune via `fetchThesessionTune`/`importThesessionTune`, dedup with `lib/match`, then `setEntriesBulk`); (4) follow suggestions (`usePeopleToFollow`); (5) finish → `/`. A "Skip for now" link on every step.
- [ ] **Step 3:** Route logic — if the signed-in user has no profile or no username, default to `/onboarding` (but allow navigating away). Add a username field to the profile settings card with availability check.
- [ ] **Step 4:** Verify — build passes; manually: fresh II identity → onboarding → pick username (taken name rejected) → add tunes via picker and via TheSession import → follow suggestions → land on a populated feed. Skipping at any step still lands in the app.
- [ ] **Step 5:** Commit `git commit -m "feat: guided skippable onboarding, tune picker, username"`.

---

## Phase 4 — Integrate & ship

### Task 4.1: Full smoke test, voice/empty-state pass, deploy

**Files:**
- Modify: any pages needing empty-state copy; `README.md`

- [ ] **Step 1:** Run the whole backend test suite: `mops test` → all PASS.
- [ ] **Step 2:** Run frontend logic tests: `npm run test --prefix frontend` → all PASS.
- [ ] **Step 3:** Build: `npm run build --prefix frontend` → no type errors.
- [ ] **Step 4:** Voice pass — review every empty state, button label, and feed-copy string against `spec.md` §14 (kind, plain-spoken, not twee; no kitsch). Fix copy inline.
- [ ] **Step 5:** Deploy locally and run an end-to-end manual script with two II identities covering: onboarding, follow, status changes producing feed events, reactions, comments, notifications, discovery, session check-in, TheSession import.
- [ ] **Step 6:** Deploy to mainnet (`icp deploy --network ic` per existing workflow), confirm `postupgrade` migration ran (spot-check that a pre-existing user now has entries and a provisional username), and that the guard prevents re-running.
- [ ] **Step 7:** Commit `git commit -m "chore: voice pass, empty states, ship social layer"`.

---

## Self-review notes (coverage of `spec.md`)

- §7.1 User/username/optional display name → Task 1.1 (types), 1.7 (username), 3.7 (UI).
- §7.2 Tune external links + provenance → 1.1, 1.7, 3.1.
- §7.3 Settings → existing + reused in 3.1.
- §7.4 Tunebook Entry (status/key/setting/note) → 1.2, 2.1, 3.1, 3.2.
- §7.5 Follows + follows-you → 1.3, 3.3.
- §7.6 Feed events (broad set) → 1.4, 1.8 (emission), 3.4.
- §7.7 Reactions + comments → 1.4, 3.4.
- §7.8 Sessions + attendance → 1.7, 3.6.
- §7.9 Sets (secondary) → unchanged existing modules (no new work; left intact).
- §7.10 Notifications → 1.5, 3.6.
- §7.11 TheSession import (single exists; bulk) → 1.8 (`setEntriesBulk`), 3.7.
- §8 Tune types → 1.1, 2.1 (`formatTuneType`).
- §9 Statuses (6) → 1.1, 2.1 (`lib/status`).
- §10 Screens → Phase 3 tasks 3.1–3.7.
- §11 Flows → onboarding 3.7, add-tune 3.1/3.2, follow 3.3, feed 3.4, import 3.7, check-in 3.6.
- §12 Feed/discovery ranking → 1.6, 3.4 (interleave), 3.5.
- §13 Privacy (all public) → no privacy gating implemented (correct).
- §14 Voice/visual → 4.1 voice pass; existing Tailwind tokens reused throughout.
- §15 Moderation → out of scope for this plan (ban/merge agent deferred per spec).
- §16 Architecture → matches existing stack; additive stable stores + migration.
- §17 Delta → every item mapped above.

**Known follow-ups (not blockers):** the legacy `knownTuneIds`/`wishListTuneIds` arrays and `social.mo` friend endpoints are kept during transition and can be removed in a later cleanup once the UI fully relies on entries/follows; `setlists` UI remains as-is (secondary).
