# Tunebook V1 Implementation Plan

> **For execution:** Use the subagent-driven-development skill to implement this plan. Route each task by its ownership tag.

**Goal:** Build Tunebook v1 as a social layer for traditional music where people track tunes they know, are learning, or want to learn, follow other musicians, and discover what tunes are moving through their scene.

**Architecture:** Use a tune-first domain model underneath a social-first user experience. The core record is a tunebook entry that links a user to a canonical tune plus a learning status. Public profiles, public tunebooks, follows, and a feed create immediate social value; tune normalization, richer tune metadata, and deeper session intelligence evolve over time without changing the core user mental model.

**Tech Stack:** Web app with authenticated user accounts, relational data model for users/tunes/entries/follows/feed events, search/import pipeline for tune seeding, and basic analytics for onboarding/retention.

---

## Product Summary

**Working one-line pitch:**
Tunebook helps you see what tunes are moving through your musical world.

**Core promise:**
Build your tunebook, follow musicians, and see what tunes are active in your local and extended trad scene.

**Immediate fix:** Traditional music discovery online feels fragmented and socially thin. Tunebook v1 fixes that by making tune learning visible, followable, and easy to browse.

**Strategic path:** Over time, Tunebook becomes the strongest living tune graph in the space: canonical tune identities, aliases, versioning, ABC linkage, session intelligence, and a durable social graph built on real tune activity.

---

## V1 Product Principles

1. **Tune-first data, social-first experience**
   - The system is organized around tunes, not around generic posts.
   - The user experience feels alive because people and activity are foregrounded.

2. **Fast emotional payoff**
   - A new user should feel connected within minutes.
   - The product should quickly answer: who is learning what, and what should I learn next?

3. **Public by default**
   - Tunebooks and profiles are public unless privacy controls are explicitly added later.
   - Public data creates discovery and network effects.

4. **Lightweight v1**
   - Do not overbuild tune versioning, notation tooling, or session logistics in v1.
   - Preserve room for better data architecture later without slowing launch.

5. **Social proof over perfect metadata**
   - It is better for v1 to feel alive with slightly imperfect tune normalization than to be academically complete but emotionally flat.

---

## V1 Scope

### In Scope
- User accounts and profiles
- Tunebook entries
- Tune statuses: `know`, `learning`, `want to learn`
- Public tunebooks
- One-way follows
- Activity feed homepage
- Discovery based on follows, local scene, and overlap
- Onboarding flow with guided mix: tunes first, then follows, then location/session context
- Lightweight tune catalog/search/import
- Basic local scene metadata

### Explicitly Out of Scope for V1
- Full scholarly tune identity/version graph
- Advanced ABC editor or notation workspace
- Audio/video hosting pipeline
- Complex messaging/chat
- Two-way friend model
- Reputation systems, badges, or gamification beyond feed signals
- Session management as a full event platform
- Marketplace, booking, lessons, or monetization layer
- Private tunebooks / nuanced privacy matrix

---

## Core Objects

### 1. User
Represents a musician using Tunebook.

**Fields:**
- `id`
- `display_name`
- `username`
- `bio`
- `instrument_tags[]`
- `location_text`
- `home_region`
- `avatar_url`
- `joined_at`

### 2. Tune
Canonical tune record used across the product.

**Fields:**
- `id`
- `canonical_title`
- `alternate_titles[]`
- `tradition_tags[]`
- `tune_type` (reel / jig / hornpipe / polka / etc.)
- `key_signatures[]` (optional, lightweight)
- `source_ref` (optional import/source marker)
- `is_seeded`
- `created_at`

**V1 note:** tune identity should support aliases, but not full-blown version resolution yet.

### 3. Tunebook Entry
The core user object in the product: a user’s relationship to a tune.

**Fields:**
- `id`
- `user_id`
- `tune_id`
- `status` = `know | learning | want_to_learn`
- `note` (optional short text)
- `updated_at`
- `created_at`

### 4. Follow
One-way social graph edge.

**Fields:**
- `follower_user_id`
- `followed_user_id`
- `created_at`

### 5. Feed Event
Activity unit rendered in the homepage feed.

**Examples:**
- user added a tune to `learning`
- user moved a tune from `want to learn` to `learning`
- user marked a tune as `know`
- user followed another musician
- user added a new batch of tunes

### 6. Session / Scene Marker
Lightweight location context.

**Fields:**
- `user_id`
- `region`
- `city`
- `session_name` (optional free text)
- `venue_name` (optional)

**V1 note:** this is for relevance and discovery, not a full event system.

---

## Core Screens

### Screen 1: Home Feed
**Purpose:** make the product feel alive immediately.

**Contents:**
- activity from followed users
- suggested local activity
- tune overlap suggestions
- recommendations like “3 people you follow are learning this tune”

**Primary actions:**
- add a tune
- update status
- follow a musician
- click through to tune or profile

### Screen 2: My Tunebook
**Purpose:** let users manage their own tune inventory.

**Sections:**
- Know
- Learning
- Want to Learn

**Capabilities:**
- search and add tunes
- change status
- remove accidental entries
- optional personal note per tune
- sort/filter by recent activity or type

### Screen 3: User Profile
**Purpose:** public identity and social discovery.

**Contents:**
- profile header
- instrument and location cues
- follow button
- stats summary (counts by status)
- recent activity
- public tunebook preview

### Screen 4: Tune Detail
**Purpose:** give a tune a home page in the network.

**Contents:**
- canonical title + aliases
- tune type / tags
- who knows it
- who is learning it
- who wants to learn it
- local relevance where available

**Strategic importance:** this becomes the seed of the future living tune graph.

### Screen 5: Search / Add Tune
**Purpose:** reduce onboarding friction.

**Capabilities:**
- typeahead search
- alias matching
- create provisional tune if not found
- quick-add status action from search results

### Screen 6: Discovery
**Purpose:** help users find people and tunes that matter.

**Sections:**
- people to follow
- tunes active in your area
- tunes common among people you follow
- overlap with another player

---

## Primary User Flows

### Flow 1: New User Onboarding
**Target outcome:** user reaches a personalized feed with enough signal to care.

**Recommended flow:** guided mix, with tunes first.

**Steps:**
1. Create account
2. Pick instrument(s)
3. Add 5–10 tunes via search/import
4. Set status on each added tune
5. Follow a few suggested musicians
6. Add location / home scene details
7. Land on a populated feed

**Success condition:** user sees recognizable people, recognizable tunes, and obvious next actions.

### Flow 2: Add a Tune to Tunebook
1. Open search/add
2. Search tune title or alias
3. Select tune
4. Choose status: know / learning / want to learn
5. Save
6. Generate feed event if appropriate

### Flow 3: Follow Another Musician
1. Open profile or suggestion card
2. Tap follow
3. Feed recalculates to include that musician’s activity
4. Discovery recommendations improve from this edge

### Flow 4: Check What’s Moving in the Scene
1. Open home or discovery
2. See tune activity from followed musicians first
3. See local scene recommendations second
4. See overlap-based suggestions third

---

## Discovery Ranking Logic

V1 discovery priority should be:

1. **Follows first**
   - strongest signal
   - most emotionally relevant

2. **Local scene second**
   - people and tunes near user’s stated region/session context

3. **Overlap third**
   - tunes shared across musicians
   - users with similar tunebooks

This ordering keeps discovery personal before it becomes abstract.

---

## Feed Design Rules

The feed should not feel like generic social media.

**Good feed events:**
- “Aoife is learning The Silver Spear”
- “3 musicians near Boston added Cooley’s this week”
- “Rob and 5 players you follow know The Banshee”

**Avoid in v1:**
- generic status posts with no tune object
- engagement bait
- empty social shells that are not tied to music behavior

---

## Tune Catalog Strategy

### V1 Approach
- Seed enough tune data to make search useful quickly
- Support aliases from day one
- Allow provisional tune creation when a tune is missing
- Avoid blocking user progress on metadata perfection

### Likely Data Strategy
- Seed from an external tune source if legally and technically feasible
- Normalize titles lightly
- Store alternate titles for searchability
- Leave room for later canonical merge tooling

### Strategic Path
Later versions can add:
- tune families / variants
- ABC references
- recording links
- source provenance
- version clustering
- moderation / merge workflows

---

## Retention Loop

The core retention loop is:
1. I follow musicians I care about
2. I see what they are learning / know / want to learn
3. I discover tunes through real people
4. I update my own tunebook
5. My activity becomes signal for others

That loop is the emotional engine of the product.

---

## Success Metrics for V1

### Activation
- % of new users who add at least 5 tunes
- % of new users who follow at least 3 people
- % of new users who reach a feed with at least 10 relevant events

### Engagement
- weekly tunebook updates per active user
- follow actions per active user
- feed clickthrough to tune/profile
- repeat visits within 7 and 30 days

### Network Health
- average follows per active user
- average number of public tunebook entries
- number of tunes with activity from multiple users

### Quality Signals
- search success rate
- provisional tune creation rate
- duplicate tune rate

---

## Risks and Mitigations

### Risk 1: Weak tune identity creates data mess
**Mitigation:** support canonical title + aliases + provisional merge path now.

### Risk 2: Empty-network cold start
**Mitigation:** guided onboarding, suggested follows, seeded tunes, and local recommendations.

### Risk 3: Product becomes database homework
**Mitigation:** lead with feed, visible activity, and social payoff.

### Risk 4: Product becomes generic social app with music paint
**Mitigation:** every key action and feed event must remain tune-centered.

---

## Recommended V1 Build Order

### Task 1: [JMAI] Lock product spec and success criteria

**Files:**
- Create: `docs/plans/2026-04-23-tunebook-v1-spec.md`

**Success criteria:**
- Spec saved
- Product direction clear enough for implementation planning

### Task 2: [IAMJ] Define core data schema

**Files:**
- Create/Modify: `app/db/schema/*` or project-equivalent
- Test: schema/model tests for users, tunes, tunebook entries, follows, feed events

**Steps:**
1. Write failing tests for tune/user/tunebook relationships
2. Implement minimal schema to support canonical tunes, aliases, statuses, follows
3. Run tests and confirm green
4. Commit

### Task 3: [IAMJ] Build onboarding flow

**Files:**
- Create/Modify: onboarding UI, API endpoints, state handlers
- Test: onboarding flow coverage

**Steps:**
1. Write failing tests for guided mixed onboarding
2. Implement tune-first onboarding sequence
3. Add follow suggestions and location step
4. Verify landing feed personalization
5. Commit

### Task 4: [IAMJ] Build tunebook management

**Files:**
- Create/Modify: tunebook pages/components/endpoints
- Test: add/update/remove status flows

**Steps:**
1. Write tests for add tune / change status / remove entry
2. Implement minimal CRUD for tunebook entries
3. Verify grouped rendering by status
4. Commit

### Task 5: [IAMJ] Build follow graph + public profiles

**Files:**
- Create/Modify: profile pages, follow endpoints, relationship queries
- Test: follow behavior and visibility tests

**Steps:**
1. Write failing tests for one-way follow model
2. Implement public profiles and follow action
3. Verify feed influence from follows
4. Commit

### Task 6: [IAMJ] Build feed and discovery

**Files:**
- Create/Modify: feed services, discovery ranking logic, homepage UI
- Test: feed ranking and relevance tests

**Steps:**
1. Write failing tests for follows-first ranking
2. Implement feed event generation
3. Implement local and overlap recommendations
4. Verify homepage feels populated after onboarding
5. Commit

### Task 7: [IAMJ] Build tune search and provisional tune creation

**Files:**
- Create/Modify: search index/import pipeline/tune creation forms
- Test: search, alias match, provisional create tests

**Steps:**
1. Write failing tests for alias search and create-if-missing
2. Implement search and provisional tune flow
3. Verify quick-add from search results
4. Commit

### Task 8: [GMAI] Product QA review

**Files:**
- Review spec + implementation branch + test outputs

**Success criteria:**
- Validate that v1 remains tune-centered
- Validate onboarding, feed usefulness, and discovery ordering
- Identify data-model or UX drift against spec

### Task 9: [HUMAN] Decide initial seed-data source

**Decision needed:**
Choose whether v1 should launch with:
- a manually curated starter catalog
- imported external source data
- hybrid seed + user-created provisional tunes

**Why it matters:**
This affects launch speed, search quality, and future tune normalization work.

---

## Now / Next / Later

### Now
- Lock this v1 product spec
- Decide initial seed-data approach
- Translate spec into implementation tickets

### Next
- Build schema, onboarding, tunebook, profiles, follows, and feed
- Seed initial tunes and validate search quality
- Test whether the feed feels alive with real or simulated usage

### Later
- Tune graph refinement
- ABC / notation depth
- richer local session intelligence
- moderation / canonical merge tools
- recommendation quality improvements

---

## Final Recommendation

Tunebook v1 should be built as a **social product with a tune-first backbone**.

That is the right balance:
- immediate value comes from visible learning activity and public tunebooks
- long-term defensibility comes from the underlying tune graph

Tactical is not enough here by itself. The app should launch with social energy now, but every v1 object should point toward the future system where tune identity, aliases, versions, and scene intelligence become a durable moat.
