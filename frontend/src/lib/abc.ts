// Parse metadata fields from ABC notation text

export function extractTitle(abc: string): string | null {
  const match = abc.match(/^T:\s*(.+)$/m);
  return match ? match[1].trim() : null;
}

export function extractTuneType(abc: string): string | null {
  const match = abc.match(/^R:\s*(.+)$/m);
  return match ? match[1].trim().toLowerCase() : null;
}

export function extractKey(abc: string): string | null {
  const match = abc.match(/^K:\s*(.+)$/m);
  return match ? match[1].trim() : null;
}

// Map ABC key field to clean display label
export function formatKey(rawKey: string): string {
  const key = rawKey.trim();

  // Handle full mode names (e.g., "Gmajor", "Aminor", "Ddorian")
  const fullModeMap: Record<string, string> = {
    major: "major",
    minor: "minor",
    mixolydian: "mixolydian",
    dorian: "dorian",
    phrygian: "phrygian",
    lydian: "lydian",
    locrian: "locrian",
  };

  // Handle abbreviated mode names (e.g., "Gmaj", "Amin", "Ddor")
  const abbrModeMap: Record<string, string> = {
    maj: "major",
    min: "minor",
    mix: "mixolydian",
    dor: "dorian",
    phr: "phrygian",
    lyd: "lydian",
    loc: "locrian",
  };

  const lower = key.toLowerCase();

  // Check full names first (longer match)
  for (const [suffix, mode] of Object.entries(fullModeMap)) {
    if (lower.endsWith(suffix)) {
      const root = key.slice(0, -suffix.length).trim();
      return mode === "major" ? root : `${root} ${mode}`;
    }
  }

  // Then abbreviations
  for (const [suffix, mode] of Object.entries(abbrModeMap)) {
    if (lower.endsWith(suffix)) {
      const root = key.slice(0, -suffix.length).trim();
      return mode === "major" ? root : `${root} ${mode}`;
    }
  }

  // Handle "m" suffix for minor (e.g., "Am", "Em")
  if (key.length <= 3 && key.endsWith("m")) {
    return `${key.slice(0, -1)} minor`;
  }

  return key;
}

// Map R: field to our TuneType variant name
export function mapTuneType(rhythm: string): string {
  const normalized = rhythm.toLowerCase().trim();
  const map: Record<string, string> = {
    reel: "reel",
    jig: "jig",
    hornpipe: "hornpipe",
    "slip jig": "slipJig",
    polka: "polka",
    slide: "slide",
    waltz: "waltz",
    mazurka: "mazurka",
    "barn dance": "barnDance",
  };
  return map[normalized] ?? "other";
}

export function formatTuneType(type: string): string {
  const map: Record<string, string> = {
    reel: "Reel",
    jig: "Jig",
    hornpipe: "Hornpipe",
    slipJig: "Slip Jig",
    polka: "Polka",
    slide: "Slide",
    waltz: "Waltz",
    mazurka: "Mazurka",
    barnDance: "Barn Dance",
  };
  return map[type] ?? type;
}
