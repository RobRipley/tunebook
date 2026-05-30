# Tunebook — Product Specification

> A social home for traditional musicians: track the tunes you know, are learning, or
> want to learn; follow other players; and see what tunes are moving through your scene.

**Status:** Draft for review
**Last updated:** 2026-05-29
**Scope of this document:** Product specification only. The implementation plan lives in
`plan.md`; the execution prompt lives in `prompt.md`; working notes live in `notes.md`.

---

## 1. Overview

Tunebook is a web app for players of Irish (and adjacent) traditional music. At its core is a
simple personal object — your **tunebook**: the running list of tunes you know, are learning, or
want to learn. Around that object Tunebook builds a light social layer — public profiles, public
tunebooks, one-way follows, and an activity feed — so the experience of learning trad feels
connected instead of solitary.

The product is organized around **tunes** as data but **people** as experience. The data model is
tune-first (a canonical tune graph that gets richer over time); the user experience is social-first
(you immediately see who is learning what, and what you might learn next).

This is a passion project. There is no monetization, no growth target, and no revenue model. Success
is a tool that trad musicians genuinely enjoy using. That framing should guide every trade-off:
favor warmth, taste, and usefulness over scale, engagement metrics, or feature breadth.

**Working one-liner:**
> Tunebook helps you see what tunes are moving through your musical world.

**Core promise:**
> Build your tunebook, follow musicians, and see what tunes are alive in your local and extended
> trad scene.

---

## 2. What Tunebook Is — and Isn't

**It is:**
- A personal tune tracker (know / learning / want to learn, and a few finer states).
- A public, social view of what other players know and are working on.
- A living, community-built tune catalog with aliases, settings (ABC), and links out.
- A directory of recurring sessions and who plays at them.

**It is not:**
- A notation workstation or ABC IDE.
- An audio/video hosting platform (it links out; it does not host media).
- A chat app or generic social network with music styling on top.
- A scholarly tune-identity authority (it leans on community + TheSession.org, not academic rigor).
- A marketplace, booking, or lessons platform.

If a proposed feature pulls Tunebook toward "generic social app with a fiddle sticker on it," it is
wrong. Every primary action and every feed event must remain anchored to a tune, a player, or a
session.

---

## 3. Product Principles

1. **Tune-first data, people-first experience.** The schema is built around canonical tunes; the
   screens foreground people and their activity so the product feels alive.
2. **Fast emotional payoff.** A new user should feel connected within minutes — recognizable tunes,
   recognizable people, an obvious next action.
3. **Public by default.** Profiles and tunebooks are public. Public data is what makes discovery and
   network effects possible. (Privacy controls are explicitly deferred — see §13.)
4. **Stay light.** Don't overbuild tune versioning, notation tooling, or session logistics. Leave
   room to deepen the data model later without slowing the product down now.
5. **Social proof over perfect metadata.** It is better to feel alive with slightly imperfect tune
   normalization than to be academically complete and emotionally flat.
6. **Built for the love of it.** No dark patterns, no engagement bait, no growth hacking. The bar is
   "would a thoughtful trad player find this delightful and respectful of the tradition?"

---

## 4. Target Users

**Primary:** intermediate session players — people who go to (or want to go to) sessions, are
actively building a repertoire, and care about what their peers are playing.

**Also served, and explicitly welcome:**
- **Adult learners** and beginners building their first repertoire (the product should never feel
  gatekept or intimidating).
- **Hobbyists** of any level who just want to track tunes and follow friends.

**Skill range:** all levels, biased toward the intermediate session player but accessible to a total
beginner on day one.

**Geography:** global from launch. The scene is worldwide; local features must degrade gracefully
when a user hasn't set a location and must work for a user who is the only Tunebook member in their
town.

**Traditions:** primarily **Irish**. Closely adjacent traditions are welcome — **Scottish** and
**Cape Breton** in particular. Out of scope as a focus: old-time, klezmer, and other distant
traditions (a player can still log such a tune via the "Other" type, but the product is not designed
around them).

---

## 5. Current State (what already exists)

Tunebook already has a working build on the Internet Computer that the next phase extends. The spec
below describes the **target** product; this section records the starting point so the gap is clear.

**Already built:**
- ICP backend (Motoko, single canister, stable-memory storage) + React/TypeScript/Tailwind frontend
  served from an asset canister; Internet Identity auth.
- **Tunes** with title, tune type, key, multiple **settings** (ABC notation), **alternate names**
  (with upvotes), and play/star tracking.
- **TheSession.org integration**: live search, single-tune fetch, and single-tune import (ABC + key
  + type), with the originating TheSession ID stored on the tune.
- **ABC rendering** to sheet music in the browser.
- **Profiles** with display name, photo, location, instruments, bio; per-user known/wishlist tune
  lists.
- **Sessions** (name, location, time, frequency, openness, difficulty, organizer, attendees) and
  **setlists/sets**.
- **Friends** via a two-way friend-request model; "tunes in common" and "friends who know this tune"
  queries.

**What this spec changes or adds** (detailed throughout; summarized in §17):
- Replace the **two-way friends** model with **one-way follows** + a "follows you" indicator.
- Promote the implicit known/wishlist arrays into a first-class **Tunebook Entry** with an explicit
  **status** (know / learning / want to learn / rusty / forgot / retired), an optional **key the
  user plays it in**, and an optional note.
- Add an **activity feed** with **feed events**, **reactions**, and **comments**.
- Add **discovery** surfaces and feed ranking.
- Add **session attendance** ("I was there") on top of session membership.
- Add **in-app notifications**.
- Add **bulk import of a user's existing TheSession.org tunebook** and explicit tune↔TheSession
  linking.
- Add **external media links** (audio, video, sheet music) on tunes.
- Add **username** handles (chosen at signup, editable) alongside optional display/real name.

---

## 6. Scope

### 6.1 In scope

- User accounts via Internet Identity, with editable username handles and optional display name.
- Public profiles and public tunebooks.
- Tunebook entries with statuses, optional per-entry key, optional setting, optional note.
- Canonical tunes with aliases, multiple settings (ABC), tune type, key, and external links.
- Community tune catalog: search, alias matching, provisional tune creation, TheSession import
  (single + bulk tunebook import) and linking.
- One-way follow graph with a "follows you" badge.
- Activity feed (home) with reactions and comments on feed events.
- Discovery: people to follow, tunes active near you, tunes common among people you follow, overlap
  with a specific player, trending tunes, new on Tunebook, and instrument-relevant tunes.
- Sessions: create, browse, join, and **attendance check-ins**; session detail pages.
- Sets/setlists (kept, but secondary to tunes).
- In-app notifications.
- Tune detail pages with a discussion/notes thread.
- Responsive web that works well on phones (installable as a PWA — a web app you can add to your
  home screen and open like a native app).

### 6.2 Out of scope (and where it goes later)

| Out of scope now | Why / what later looks like |
|---|---|
| Full scholarly tune-identity & version graph | Start with canonical title + aliases + community merge; deepen into tune families, variants, and provenance later. |
| ABC editor / notation workspace | Render and accept ABC; no authoring tools beyond a textarea. |
| Audio/video **hosting** | Link out to YouTube/Spotify/SoundCloud/etc.; never host media. |
| Private tunebooks / nuanced privacy matrix | Everything is public now; revisit privacy once there's demand. |
| Blocking / muting | Add a simple ban/report tool once moderation is actually needed. |
| Two-way friend model | Replaced by one-way follows. |
| Reputation, badges, gamification | Feed signals and counts only; no points or levels. |
| Sessions as a full events platform (RSVPs, ticketing, calendars) | Sessions are place+time markers + attendance; no logistics engine. |
| Marketplace, booking, lessons, monetization | Never (passion project). |
| Push / email notifications | In-app notifications only for now; other channels later. |
| Native mobile apps | Responsive web / PWA now; native later if ever. |

---

## 7. Domain Model

This section defines the core objects and their relationships. It is descriptive (what each object
*is* and the rules around it), not a schema dump — field-level detail and storage choices belong in
`plan.md`. Where the current codebase already has an object, the spec notes the intended evolution.

### 7.1 User & Profile

A person using Tunebook, identified by their Internet Identity principal.

- **Identity:** II principal (login). No passwords, no email required.
- **Username (handle):** unique, chosen at signup, editable later (e.g. `@aoife`). Used in URLs and
  @-style references.
- **Display name:** optional, free text (e.g. "Aoife Ní Bhriain"); falls back to the username.
- **Real name:** optional (display name serves this purpose; no separate verified-name concept).
- **Bio:** optional short text.
- **Instruments:** zero or more, from a closed list plus an "Other (free text)" escape hatch:
  fiddle, flute, tin whistle, bodhrán, guitar, banjo, accordion, concertina, uilleann pipes, harp,
  mandolin, bouzouki, vocals, other.
- **Location:** optional `{ city, country }`. **Strongly encouraged but never required** — used for
  local discovery and "near you" relevance. The product must work fully without it.
- **Avatar/photo:** optional.
- **Derived:** follower count, following count, and tunebook counts by status.

### 7.2 Tune (canonical)

The shared, canonical record for a tune used everywhere in the product. This is the seed of the
long-term "living tune graph."

- **Canonical title** + **alternate names / aliases** (community-submitted, upvotable). Aliases are
  first-class and searchable from day one.
- **Tune type:** closed vocabulary (see §8) plus "Other (free text)".
- **Key:** the tune's commonly-played key (tune-level default; a user may record a different key on
  their own entry — see §7.4).
- **Settings:** one or more **Settings** (versions) — see §7.3.
- **External links:** optional list of links out — audio (YouTube/Spotify/SoundCloud), video, sheet
  music (PDF/image URL), and the TheSession.org page. Tunebook stores links, not files.
- **TheSession linkage:** optional TheSession.org tune ID when the tune originated from or has been
  matched to TheSession.
- **Provenance:** whether the tune was seeded, user-created (provisional), or imported, plus who
  created it and when.
- **Discussion:** a comment/notes thread attached to the tune (see §7.7).
- **Derived:** counts of how many users have it as know / learning / want to learn, etc.

> Tune identity supports aliases and TheSession linkage, but **not** full version resolution or
> family/variant clustering yet. Provisional, user-created tunes are expected and fine; duplicates
> are reconciled over time (see §15).

### 7.3 Setting (a version of a tune)

A specific notated version of a tune. A tune has one or more settings.

- **ABC notation** (rendered to sheet music in the browser).
- **Submitted by** and **created/edited timestamps**, with the previous ABC retained on edit (basic
  history; no full versioning UI).
- A user can indicate **which setting they play** (links from their tunebook entry — see §7.4).

### 7.4 Tunebook Entry (the core object)

A user's relationship to a canonical tune. This is the single most important object in the product.

- **Links a user to a canonical tune** (the entry attaches to the **canonical tune ID**, not to a
  specific setting).
- **Status** (exactly one at a time): `know`, `learning`, `want_to_learn`, `rusty`, `forgot`,
  `retired` (semantics in §9).
- **Key (optional):** the key *this user* plays the tune in (e.g. Cooley's in E Dorian vs. A Dorian).
  Defaults to unset / the tune's default key.
- **Setting (optional):** which setting the user plays, if they want to specify one.
- **Note (optional):** a short personal note ("learned from Mary at the Cobblestone").
- **Timestamps:** created and updated; status changes are what drive most feed events.

### 7.5 Follow (social graph)

A one-way directed edge: A follows B.

- Following is **not** mutual and requires no approval — it's a public subscription to someone's
  activity, like following on most modern social apps.
- When two users follow each other, each sees a **"follows you"** indicator on the other's profile
  and follow controls.
- Following influences the feed (their activity appears) and improves discovery.
- No blocking/muting now; a ban/report path is deferred (see §15).

### 7.6 Feed Event (activity)

A unit of activity rendered in the home feed and on profiles. Feed events are always tied to a real
music action. The product deliberately leans toward **many** event types — a rich, busy feed is
desirable — while avoiding contentless posts.

**Event types (non-exhaustive; lean inclusive):**
- Added a tune to *want to learn* / *learning* / *know* (added-with-status).
- Added a tune with no status set.
- Changed status (e.g. *want to learn → learning*, *learning → know* = "completed learning",
  *know → rusty*, etc.).
- Added a setting (ABC) to a tune, or added an alternate name.
- Followed another musician.
- Joined a session, or **attended** a session ("was at …").
- Created a set/setlist.
- Posted a note on a tune (tune discussion) or on their own activity.

**Explicitly avoided:** generic status posts with no tune/session/person object, engagement bait,
and empty social shells unattached to musical behavior.

**Grouping:** related events collapse into a single card where it reads better — e.g. "Aoife added
12 tunes to *want to learn*" instead of twelve separate cards; "3 people near Boston added Cooley's
this week."

### 7.7 Reactions & Comments

- **Reactions:** lightweight, on feed events. A small fixed set of meaningful reactions (e.g. ❤️
  love, 🎶 "I play this too", 👏 nice). Reactions are public and counted.
- **Comments:** short text replies, on feed events and on a tune's discussion thread. Comments are
  public. No threading depth beyond a single level is required now.

### 7.8 Session (place + time)

A recurring real-world session — a **place plus a time**, not a one-off event.

- **Fields:** name, location `{ city, country }`, time (free text, e.g. "Tuesdays 9pm"), frequency
  (weekly / biweekly / monthly / irregular), openness (open vs. invite/closed), difficulty
  (beginner / intermediate / advanced / all levels), description, organizer.
- **Users can create sessions** and others can **join** (membership).
- **Attendance:** a distinct **Session Attendance** record — "I was at this session" for a given
  date — separate from membership. Attendance produces feed events and powers "what's being played
  around here lately."

### 7.9 Set / Setlist (secondary)

An ordered collection of tunes (optionally with specific settings), e.g. a common medley. Kept from
the current build but **secondary to tunes** in prominence. A set may be associated with a session,
created by a user, and upvoted. Sets are not required in the primary onboarding or feed flows.

### 7.10 Notification (in-app)

An in-app message to a specific user. **In-app only** for now (no push, no email).

**Notification types (sensible defaults):**
- New follower; someone you follow followed you back (mutual).
- A reaction or comment on your activity.
- A musician you follow added or started learning a tune (optionally digested).
- A musician you follow joined or attended a session you're in.

### 7.11 TheSession.org integration

TheSession.org is treated as a **data source and companion**, not a competitor.

- **Search & import (existing):** search TheSession live; import a single tune (ABC, key, type),
  storing its TheSession ID.
- **Linking:** a Tunebook tune can be linked to its TheSession tune (and, where useful, surfaced as
  an external link).
- **Bulk tunebook import (new):** a user can import their **existing TheSession.org tunebook** in
  one flow — matching to existing Tunebook tunes where possible, importing/creating the rest, and
  setting initial statuses. This is a first-class onboarding accelerator.

---

## 8. Tune Types (closed vocabulary)

Tune type is a closed list, with an "Other (free text)" escape hatch for edge cases:

**Reel, Jig, Slip Jig, Hornpipe, Polka, Slide, March, Waltz, Air, Barndance, Mazurka, Strathspey** —
plus **Other**.

(Strathspey and March in particular accommodate the welcomed Scottish/Cape Breton material.)

---

## 9. Tunebook Statuses

Statuses are self-declared and **unverified** — there is no social confirmation, endorsement, or
proof mechanism. The point is honest self-tracking, not credentialing.

| Status | Meaning |
|---|---|
| `want_to_learn` | On the wishlist. Aspirational; not started. |
| `learning` | Actively working on it now. |
| `know` | Can play it. |
| `rusty` | Knew it well once; needs brushing up. |
| `forgot` | Knew it; has since lost it. |
| `retired` | Deliberately set aside / no longer playing it. |

A tunebook entry has exactly one status at a time. The common transitions
(`want_to_learn → learning → know`) are the heart of the activity feed. `rusty`, `forgot`, and
`retired` are finer states that let serious players keep an honest, living repertoire rather than an
ever-growing "know" pile.

---

## 10. Screens

Each screen below lists its purpose, key contents, and primary actions. Visual/interaction detail is
guided by §14 (design language) and refined in implementation.

### 10.1 Home / Feed
**Purpose:** make the product feel alive the moment you open it.
- Activity from people you follow (primary).
- Interleaved recommendation cards: local activity near you, and tune-overlap suggestions
  ("3 people you follow are learning this tune").
- Each event supports reactions and comments inline.
- **Primary actions:** add a tune, update a status, follow a musician, react/comment, click through
  to a tune / profile / session.

### 10.2 My Tunebook
**Purpose:** manage your own repertoire.
- Grouped by status (Know / Learning / Want to Learn, with rusty/forgot/retired accessible).
- **Capabilities:** search and add tunes; change status; set the key you play it in; pick a setting;
  add a personal note; remove accidental entries; sort/filter by recent activity, tune type, or key.

### 10.3 Tune Detail
**Purpose:** give each tune a home in the network, and seed the long-term tune graph.
- Canonical title + aliases; tune type; key; settings (rendered ABC) with the ability to add one.
- External links (audio / video / sheet music / TheSession).
- **Who plays it:** shows people **you follow** who know / are learning / want it, plus a local count
  ("and 12 near you"), plus a total ("and 247 others") — not an exhaustive public roster by default.
- A **discussion / notes thread**.
- **Primary actions:** add to your tunebook with a status, set your key, add a setting, react, and
  discuss.

### 10.4 Profile (own and others')
**Purpose:** public identity and social discovery.
- Header: avatar, display name / username, instruments, location.
- Follow button, with a **"follows you"** indicator when mutual.
- Stats summary: counts by status; followers / following.
- Recent activity (this user's feed).
- Public tunebook (grouped by status), and sessions they attend.

### 10.5 Search / Add Tune
**Purpose:** reduce friction to near-zero when adding tunes.
- Typeahead search across canonical titles **and aliases**, plus live TheSession results.
- Quick-add a status directly from a search result.
- Create a **provisional tune** when none is found.
- Import from TheSession (single tune, or kick off the bulk tunebook import).

### 10.6 Discovery
**Purpose:** help you find people and tunes that matter to you.
- People to follow (seeded notables, shared instruments, near you, overlap with your tunebook).
- Tunes active near you.
- Tunes common among people you follow.
- Overlap with a specific player ("tunes you both know / that they know and you don't").
- Trending tunes (activity-weighted) and "new on Tunebook".
- Instrument-relevant suggestions ("commonly played on the concertina").

### 10.7 Sessions (list + detail)
**Purpose:** connect the online tunebook to real rooms.
- **List:** browse/search sessions by location, openness, difficulty, frequency.
- **Detail:** session info, members, recent attendance, and tunes/sets associated with the session;
  actions to join and to check in ("I was here").

### 10.8 Notifications
**Purpose:** bring people back for the right reasons.
- In-app list of notifications (followers, reactions, comments, activity from people you follow).
- Unread indicator in the nav.

### 10.9 Onboarding
See §11 — a guided, tunes-first flow that lands the user on a populated feed. Onboarding is **not
mandatory**: a user may sign up and skip straight in, completing profile/tunes/follows later.

### 10.10 Settings
**Purpose:** manage your account.
- Edit username, display name, bio, instruments, location, avatar.
- Manage TheSession linkage / re-run import.
- (Account deletion / data export are future considerations.)

---

## 11. Primary User Flows

### Flow 1 — New user onboarding (guided, tunes-first; skippable)
**Target outcome:** the user reaches a personalized feed with enough signal to care.
1. Sign in with Internet Identity.
2. Choose a username; optionally set display name.
3. Pick instrument(s); optionally set location (encouraged, not required).
4. Add 5–10 tunes via the **tune picker** (a tap-to-add grid of popular/seeded tunes for the chosen
   instrument/tradition, plus a search box) — **or** import your TheSession.org tunebook in one step.
5. Set a status on each added tune (defaulting sensibly, e.g. *know* for imported, with quick edit).
6. Follow a few suggested musicians (seeded notables, near you, shared instruments, tune overlap).
7. Land on a populated feed.

**Success condition:** the user sees recognizable people, recognizable tunes, and obvious next
actions — within minutes.

> **Tune picker (clarified):** the picker is the add-tunes step's UI. Rather than forcing the user
> to think of tune names cold, it shows a grid of the most-commonly-known tunes (ranked by Tunebook
> activity, falling back to a curated popular list) that they can tap to add quickly, alongside a
> search field and the TheSession import shortcut.

### Flow 2 — Add a tune to your tunebook
1. Open search / add (or a tune detail page).
2. Search by title or alias (local + TheSession), or create provisional if missing.
3. Choose a status; optionally set your key / setting / note.
4. Save → generates the appropriate feed event.

### Flow 3 — Follow another musician
1. From a profile, suggestion card, or "who plays this" list, tap **Follow**.
2. The feed recalculates to include their activity; discovery improves from the new edge.
3. If they already follow you (or later do), both see the **"follows you"** indicator.

### Flow 4 — See what's moving in the scene
1. Open Home (or Discovery).
2. See activity from people you follow first.
3. See local-scene recommendations second.
4. See overlap-based suggestions third.

### Flow 5 — Import your TheSession.org tunebook
1. From onboarding or Settings, choose "Import from TheSession".
2. Provide the TheSession tunebook reference; Tunebook fetches it.
3. Tunes are matched to existing Tunebook tunes where possible and imported/created otherwise.
4. The user confirms initial statuses (bulk default with per-tune override) and saves.

### Flow 6 — Check in to a session
1. Open a session detail page.
2. Tap **Join** (membership) and/or **I was here** (attendance for tonight).
3. Attendance produces a feed event and feeds "what's being played around here."

---

## 12. Feed & Discovery Ranking

### 12.1 Feed model
The home feed is a single stream that is **primarily reverse-chronological activity from people you
follow**, with a small number of **recommendation cards interleaved** (local activity, tune-overlap
suggestions). This keeps the feed legible and honest — it feels like a real timeline of your people,
not an opaque ranked algorithm — while still surfacing discovery. It is deliberately *not* a pure
engagement-optimized ranking.

> This is a design decision made on the user's behalf (the ranking question was left open). It can be
> revisited; the alternative considered was a fully ranked feed, rejected for now as too "black-box"
> for a passion project that values warmth and transparency.

### 12.2 Discovery ranking priority
When suggesting people/tunes, prioritize in this order:
1. **Follows first** — strongest, most emotionally relevant signal.
2. **Local scene second** — people and tunes near the user's stated location/sessions.
3. **Overlap third** — tunes shared across players; players with similar tunebooks.

This keeps discovery personal before it becomes abstract.

### 12.3 Feed quality rules
Good feed events read like:
- "Aoife is learning *The Silver Spear*."
- "3 musicians near Boston added *Cooley's* this week."
- "Rob and 5 players you follow know *The Banshee*."

Avoid: contentless posts, engagement bait, and anything not tied to a tune, session, or person.

---

## 13. Privacy

For now, **everything is public**: profiles, tunebooks, and activity. There is no lurker/private
mode, and individual tunebook entries are **not** independently hideable. Public data is what powers
discovery and the feed, and the audience (trad musicians sharing what they play) makes this low-risk.
Privacy controls are a deliberate future consideration, not a launch feature.

---

## 14. Design Language & Voice

### 14.1 Visual direction
A subtle, tasteful Celtic aesthetic — **"a well-loved music book," not a pub sign.**
- Warm earth tones: parchment / aged-linen backgrounds, warm slate for text.
- A **muted forest/moss green** accent (not Irish-flag green).
- Serif or semi-serif headings that evoke the manuscript tradition; clean sans-serif body text.
- An elevated card system with soft shadows; staff lines / treble clefs as tasteful dividers only.
- Dark mode in deep charcoal/navy (not pure black).
- **No** shamrocks, leprechauns, beer imagery, or gold-coin kitsch.

### 14.2 Copy voice
Kind, plain-spoken, and knowledgeable without being academic. Warm but not twee; it should feel like
a well-read friend who plays, not a textbook and not a marketing funnel. Empty states, feed phrasing,
and prompts should sound like a person who respects the tradition and the player. Avoid hype, avoid
jargon-for-its-own-sake, avoid forced folksiness.

---

## 15. Moderation & Safety

- **Spam/abuse barrier:** Internet Identity raises the cost of throwaway accounts and is the primary
  first line of defense.
- **Bad actors:** a simple **ban/report** capability is the intended tool when moderation is actually
  needed — not a complex trust-and-safety system. (Blocking/muting between users is deferred.)
- **Duplicate / provisional tunes:** expected and acceptable. Reconciliation happens over time via a
  combination of **automated fuzzy matching**, **community signals** (alias upvotes, merge
  suggestions), and **light moderation**. An assistive **merge/cleanup agent** may be introduced
  later to propose canonical merges; it is not required for launch.
- **No silent failure of trust:** moderation tools should be added when the need is real, and their
  limits stated plainly, rather than pretending the catalog is perfectly clean.

---

## 16. Technical Architecture (high level)

Detailed implementation belongs in `plan.md`; this is the shape.

- **Platform:** Internet Computer (ICP).
- **Backend:** Motoko, a single canister, business logic split into modules (users, tunes, settings,
  follows/social, feed, sessions, sets, notifications, TheSession integration). State persisted in
  stable memory.
- **External calls:** HTTPS outcalls to TheSession.org for search/fetch/import, with a transform
  function for consensus.
- **Frontend:** React + TypeScript + Vite + Tailwind, served from an ICP asset canister; ABC
  rendered client-side. Responsive and installable as a PWA.
- **Auth:** Internet Identity (principal-based; no email/passwords).
- **Naming note:** the product is simply **"Tunebook."** "v2" is an internal codebase revision (the
  second build), not a public-facing product version. This document should not use "V1/V2/V3"
  language in product copy.

---

## 17. Changes From the Current Build (delta)

This summarizes what `plan.md` must deliver on top of what exists today (§5).

1. **Follows replace friends.** Introduce a one-way `Follow` edge and a "follows you" indicator;
   migrate/retire the two-way friend-request model and update all "friends who…" queries to
   "people you follow who…".
2. **First-class Tunebook Entry.** Replace implicit known/wishlist arrays with an explicit entry
   carrying status (6 states), optional per-entry key, optional setting, and optional note.
3. **Activity feed.** Add feed events (broad type set), grouping, reactions, and comments.
4. **Discovery surfaces & ranking** (follows → local → overlap; plus trending, new, instrument).
5. **Session attendance** check-ins distinct from membership.
6. **In-app notifications.**
7. **Bulk TheSession tunebook import** + explicit tune↔TheSession linking (single import exists).
8. **External media links** on tunes (audio / video / sheet music).
9. **Usernames** (unique, editable) alongside optional display name.
10. **Tune type vocabulary** expanded to the closed list in §8 (adds March, Air, Strathspey, Slip
    Jig naming, etc.).
11. **Tune discussion threads.**

---

## 18. What Good Looks Like

This is a passion project with **no launch targets, no user-count goals, and no revenue**. Success is
qualitative:

- A trad musician can build a real tunebook in a few minutes and enjoy doing it.
- Opening the app feels warm and alive — you see people you recognize doing things you care about.
- It respects the tradition and the player (taste, accuracy-where-it-counts, no kitsch, no dark
  patterns).
- The tune catalog gets a little richer and a little more accurate over time.
- The author and a handful of fellow musicians actually want to keep using it.

If a feature or metric pushes toward growth-hacking or engagement-farming, it is out of step with the
project's purpose.

---

## 19. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Weak tune identity creates a data mess | Canonical title + aliases + TheSession linkage now; fuzzy-match + community + light moderation for merges; assistive merge agent later. |
| Empty-network cold start | Guided (skippable) onboarding, seeded tunes + notable accounts, TheSession bulk import, and local/overlap recommendations. |
| Product becomes "database homework" | Lead with the feed, visible activity, and fast social payoff; tunes-first onboarding. |
| Product becomes a generic social app with music styling | Every key action and feed event stays anchored to a tune, session, or player; no contentless posts. |
| Over-scoping for a passion project | Ruthless YAGNI; the §6.2 out-of-scope list is a feature, not a gap. |

---

## 20. Open Questions / Future

**Deliberately deferred (revisit when demand is real):** privacy controls and private tunebooks;
blocking/muting; push and email notifications; native mobile apps; a full tune-family/version graph;
an automated catalog merge agent; account deletion/data export.

**Left to implementation judgment (sensible defaults assumed in this spec):** exact reaction set;
notification digest cadence; feed grouping thresholds; the precise popularity ranking behind the tune
picker and trending; default status applied to bulk-imported tunes.

**Now / Next / Later**
- **Now:** finalize this spec; write `plan.md`; choose the initial seed-tune approach (curated
  starter set vs. TheSession import vs. hybrid).
- **Next:** build the deltas in §17 on the existing base; seed tunes and notable accounts; validate
  the feed feels alive with real or simulated activity.
- **Later:** tune-graph depth, richer local/session intelligence, recommendation quality, and
  moderation/merge tooling.
