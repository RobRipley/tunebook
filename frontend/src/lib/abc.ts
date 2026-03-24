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
  const modeMap: Record<string, string> = {
    maj: "Major",
    min: "Minor",
    mix: "Mixolydian",
    dor: "Dorian",
    phr: "Phrygian",
    lyd: "Lydian",
    loc: "Locrian",
  };

  for (const [abbr, full] of Object.entries(modeMap)) {
    if (key.toLowerCase().endsWith(abbr)) {
      const root = key.slice(0, -abbr.length).trim();
      return `${root} ${full}`;
    }
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
