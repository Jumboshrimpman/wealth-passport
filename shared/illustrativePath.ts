/**
 * Deterministic demo index for a strategy chart. Seeded so the same name
 * always draws the same path. This is not a return series.
 */
export function illustrativeNav(seed: string, points = 36): number[] {
  const count = Math.max(2, Math.floor(points));
  const rand = mulberry32(fnv(seed));
  const drift = 0.0016 + rand() * 0.0028;
  const vol = 0.42 + rand() * 0.7;
  const raw: number[] = [100];
  let level = 100;
  for (let index = 1; index < count; index += 1) {
    const shock = (rand() * 2 - 1) * vol;
    level = level * (1 + drift) + shock;
    if (level < 84) level = 84 + rand();
    if (level > 142) level = 142 - rand();
    raw.push(level);
  }
  const smooth = raw.map((value, index) => {
    if (index === 0) return 100;
    const prev = raw[index - 1] ?? value;
    const next = raw[index + 1] ?? value;
    return (prev + value * 2 + next) / 4;
  });
  smooth[0] = 100;
  return smooth.map((value) => Math.round(value * 100) / 100);
}

function fnv(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}
