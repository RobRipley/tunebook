#!/usr/bin/env node
/**
 * seed-tunes.mjs
 *
 * Parses ABC notation files from O'Neill's "Dance Music of Ireland" and seeds
 * the Tunebook backend canister with the first 200 tunes.
 *
 * Usage:
 *   node scripts/seed-tunes.mjs            # live run against mainnet
 *   node scripts/seed-tunes.mjs --dry-run  # parse only, no canister calls
 */

import { execSync } from 'child_process';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// ── Config ────────────────────────────────────────────────────────────────────

const CANISTER_ID = 'vthx3-dqaaa-aaaam-qiela-cai'; // backend on mainnet
const NETWORK = 'ic';
const IDENTITY = 'robvector';
const LIMIT = 200;
const DELAY_MS = 500;

const ABC_DIRS = [
  '/Users/robertripley/coding/TuneBook_v1/Books/O_Neill_s-Dance-Music-of-Ireland',
  // Music of Ireland included as a secondary source, but Dance Music fills quota
  '/Users/robertripley/coding/TuneBook_v1/Books/O_Neill_s-Music-of-Ireland',
];

const isDryRun = process.argv.includes('--dry-run');

// ── Tune-type mapping ─────────────────────────────────────────────────────────

/**
 * Maps an R: field value to the canister's TuneType variant name.
 * Returns a string like "jig", "reel", "slipJig", "other" etc.
 */
function mapTuneType(raw) {
  if (!raw) return 'other';
  const r = raw.toLowerCase().trim();

  if (r.includes('slip jig') || r === 'hop, slip jig' || r === 'hop, slip jig') return 'slipJig';
  if (r.includes('jig')) return 'jig';
  if (r.includes('reel')) return 'reel';
  if (r.includes('hornpipe')) return 'hornpipe';
  if (r.includes('polka')) return 'polka';
  if (r.includes('slide')) return 'slide';
  if (r.includes('waltz')) return 'waltz';
  if (r.includes('mazurka')) return 'mazurka';
  if (r.includes('barn dance')) return 'barnDance';
  return 'other';
}

/**
 * Renders a TuneType name as a Candid variant literal.
 * Simple variants: variant { jig }
 * "other" with text: variant { other = "..." }
 */
function tuneTypeVariant(typeName) {
  if (typeName === 'other') return 'variant { other = "other" }';
  return `variant { ${typeName} }`;
}

// ── Key parsing ───────────────────────────────────────────────────────────────

/**
 * Parses a K: field value into a simple key string understood by the canister.
 *
 * Examples:
 *   "G"    → "G"
 *   "D"    → "D"
 *   "Am"   → "Am"
 *   "Amin" → "Am"
 *   "Ador" → "Am"   (dorian on A is effectively A minor)
 *   "Ddor" → "Dm"
 *   "Dmix" → "D"    (mixolydian keeps the major root)
 *   "Gmix" → "G"
 *   "Amix" → "A"
 */
function parseKey(raw) {
  if (!raw) return 'D';
  const k = raw.trim();

  // Match root note (A–G, optionally #/b), then mode suffix
  const m = k.match(/^([A-G][#b]?)(.*)/);
  if (!m) return k; // fall back to raw if unparseable

  const root = m[1];
  const mode = m[2].toLowerCase();

  if (mode === '' || mode === 'maj' || mode === 'mix' || mode === 'lyd') {
    return root; // major / mixolydian / lydian → plain root
  }
  if (mode === 'm' || mode === 'min' || mode === 'dor' || mode === 'aeo' || mode === 'phr') {
    return root + 'm'; // minor / dorian / aeolian / phrygian → minor
  }
  // Anything else (e.g. "HP" for hornpipe key indicators): strip and return root
  return root;
}

// ── ABC parser ────────────────────────────────────────────────────────────────

/**
 * Splits a file's text content into individual tunes (blocks starting with X:).
 * Returns an array of objects: { title, tuneType, key, abc }
 * Skips tunes that have no title, key, or whose body appears empty.
 */
function parseTunes(fileText) {
  // Split on lines that start with "X:" — each chunk is one tune
  const chunks = fileText.split(/(?=^X:\s*\d)/m).filter(c => c.trim().length > 0);
  const tunes = [];

  for (const chunk of chunks) {
    const lines = chunk.split('\n');

    let title = null;
    let rhythm = null;
    let key = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!title && trimmed.startsWith('T:')) {
        title = trimmed.slice(2).trim();
      } else if (!rhythm && trimmed.startsWith('R:')) {
        rhythm = trimmed.slice(2).trim();
      } else if (!key && trimmed.startsWith('K:')) {
        key = trimmed.slice(2).trim();
      }
    }

    if (!title || !key) continue;

    const tuneType = mapTuneType(rhythm);
    const parsedKey = parseKey(key);

    // Clean the ABC text: strip trailing W: lines and blank lines at the end,
    // but keep the full body so it round-trips to ABC notation cleanly.
    const cleanedAbc = chunk.trimEnd();

    tunes.push({
      title,
      tuneType,
      key: parsedKey,
      rawKey: key,
      rawRhythm: rhythm,
      abc: cleanedAbc,
    });
  }

  return tunes;
}

/**
 * Loads all .abc files from the given directory and returns parsed tunes.
 */
function loadDir(dir) {
  let files;
  try {
    files = readdirSync(dir)
      .filter(f => f.endsWith('.abc'))
      .sort() // alphabetical = numerical order for these files
      .map(f => join(dir, f));
  } catch (e) {
    console.warn(`Warning: could not read directory ${dir}: ${e.message}`);
    return [];
  }

  const tunes = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const parsed = parseTunes(text);
    tunes.push(...parsed);
  }
  return tunes;
}

// ── Candid escaping ───────────────────────────────────────────────────────────

/**
 * Escapes a string for use inside a Candid text literal passed via shell.
 * The outer quoting uses single quotes, so we must replace ' with '\''
 * and replace literal newlines with \n.
 */
function escapeCandidText(s) {
  // First escape backslashes, then double-quotes (Candid text uses " delimiters),
  // then handle the single-quote shell escaping.
  return s
    .replace(/\\/g, '\\\\')   // \ → \\
    .replace(/"/g, '\\"')      // " → \"
    .replace(/\n/g, '\\n')    // newline → \n literal
    .replace(/'/g, "'\\''");  // ' → '\'' for shell single-quote context
}

// ── Canister call ─────────────────────────────────────────────────────────────

function callCreateTune(tune) {
  const titleEsc = escapeCandidText(tune.title);
  const abcEsc = escapeCandidText(tune.abc);
  const keyEsc = escapeCandidText(tune.key);
  const typeVariant = tuneTypeVariant(tune.tuneType);

  const candid = `(record { title = "${titleEsc}"; abcNotation = "${abcEsc}"; tuneType = ${typeVariant}; key = "${keyEsc}" })`;

  const cmd = `icp canister call ${CANISTER_ID} createTune '${candid}' -e ${NETWORK} --identity ${IDENTITY}`;

  const result = execSync(cmd, { encoding: 'utf8', timeout: 30000 });
  return result.trim();
}

// ── Sleep helper ──────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Seed script started. Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Target canister: ${CANISTER_ID} on ${NETWORK}`);
  console.log('');

  // Collect tunes from both books
  let allTunes = [];
  for (const dir of ABC_DIRS) {
    const parsed = loadDir(dir);
    console.log(`Loaded ${parsed.length} tunes from ${dir}`);
    allTunes.push(...parsed);
  }

  // Sample across tune types for variety
  const byType = {};
  for (const t of allTunes) {
    if (!byType[t.tuneType]) byType[t.tuneType] = [];
    byType[t.tuneType].push(t);
  }

  // Target: ~65 jigs, ~65 reels, ~35 hornpipes, ~20 slip jigs, ~15 other
  const quotas = { jig: 65, reel: 65, hornpipe: 35, slipJig: 20, polka: 5, slide: 5, waltz: 3, other: 2 };
  let tunes = [];
  for (const [type, quota] of Object.entries(quotas)) {
    const available = byType[type] || [];
    tunes.push(...available.slice(0, quota));
  }
  // Fill remaining slots with whatever's left
  if (tunes.length < LIMIT) {
    const usedTitles = new Set(tunes.map(t => t.title));
    for (const t of allTunes) {
      if (tunes.length >= LIMIT) break;
      if (!usedTitles.has(t.title)) {
        tunes.push(t);
        usedTitles.add(t.title);
      }
    }
  }
  tunes = tunes.slice(0, LIMIT);
  console.log(`\nParsed ${allTunes.length} total tunes. Will seed: ${tunes.length}\n`);

  // Show type breakdown
  const typeCounts = {};
  for (const t of tunes) {
    typeCounts[t.tuneType] = (typeCounts[t.tuneType] || 0) + 1;
  }
  console.log('Tune type breakdown:');
  for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }
  console.log('');

  // Show first 5 as a sample
  console.log('Sample (first 5 tunes):');
  for (const t of tunes.slice(0, 5)) {
    console.log(`  "${t.title}" (${t.tuneType}, ${t.key}) [R: ${t.rawRhythm}, K: ${t.rawKey}]`);
  }
  console.log('');

  if (isDryRun) {
    console.log('DRY RUN complete. No canister calls made.');
    console.log(`Would seed ${tunes.length} tunes.`);
    return;
  }

  // Live run
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < tunes.length; i++) {
    const tune = tunes[i];
    const label = `${i + 1}/${tunes.length}: ${tune.title} (${tune.tuneType}, ${tune.key})`;

    try {
      const result = callCreateTune(tune);
      succeeded++;
      console.log(`Seeded ${label} → ${result}`);
    } catch (err) {
      failed++;
      console.error(`FAILED ${label}: ${err.message.split('\n')[0]}`);
    }

    if (i < tunes.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\nDone. ${succeeded} succeeded, ${failed} failed.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
