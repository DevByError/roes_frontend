
const FEMALE_FIRST = ["Aisha", "Nurul", "Siti", "Farah", "Iman", "Zara", "Mei Ling", "Xin Yi", "Priya", "Kavitha", "Sofia", "Lina", "Nadia", "Alya", "Qistina", "Thevi", "Siew Ling", "Anis", "Dewi", "Maryam", "Hui Min", "Aina", "Balqis", "Shalini"];
const MALAY_OR_MUSLIM_F = new Set(["Aisha", "Nurul", "Siti", "Farah", "Iman", "Zara", "Sofia", "Lina", "Nadia", "Alya", "Qistina", "Anis", "Dewi", "Maryam", "Aina", "Balqis"]);

const SKIN = ["#f6d3b3", "#ecc19c", "#d9a577", "#b98055", "#8f5d3b"];
const HAIR = ["#17120f", "#2a1b12", "#43271a", "#6a4125", "#9a9a9a"];
const SHIRT = ["#2665ae", "#159b80", "#1b2433", "#6f6e98", "#4f8bcb", "#1b2433", "#1f4f8c", "#0f7a64"];
const BG = [["#e9f0f7", "#c3d6ec"], ["#e3f3f0", "#b5ddd3"], ["#ffeee8", "#ffd5c4"], ["#ecebf3", "#d4d3e3"], ["#e9f0f7", "#d4d3e3"], ["#e3f3f0", "#d4d3e3"]];
const HIJAB = ["#2665ae", "#159b80", "#6f6e98", "#4f8bcb", "#1b2433", "#1b2433", "#0f7a64"];

function hash(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function isFemaleName(name: string) {
  return FEMALE_FIRST.some((f) => name === f || name.startsWith(f + " "));
}

const cache = new Map<string, string>();

export function portraitUri(name: string): string {
  const hit = cache.get(name);
  if (hit) return hit;
  let h = hash(name);
  const next = (n: number) => {
    const v = h % n;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return v;
  };
  const female = isFemaleName(name);
  const skin = SKIN[next(SKIN.length)];
  const hair = HAIR[next(HAIR.length)];
  const shirt = SHIRT[next(SHIRT.length)];
  const [bg1, bg2] = BG[next(BG.length)];
  const style = next(100);
  const glasses = next(100) < 22;

  const back: string[] = [];
  const front: string[] = [];
  let neckOverHair = false;

  if (female) {
    const hijab = MALAY_OR_MUSLIM_F.has(name.split(" ")[0]) && style < 55;
    if (hijab) {
      const c = HIJAB[next(HIJAB.length)];
      back.push(`<path d="M24 52C22 22 38 12 50 12s28 10 26 40c0 14 4 26 10 38H14c6-12 10-24 10-38z" fill="${c}"/>`);
      front.push(`<path d="M33 46c0-14 7-20 17-20s17 6 17 20" fill="none"/>`);
      neckOverHair = true;
    } else if (style < 78) {
      back.push(`<path d="M25 50C22 22 38 14 50 14s28 8 25 36l3 34H22z" fill="${hair}"/>`);
      front.push(`<path d="M32 44C32 26 42 20 50 20s20 6 19 24c-6-8-12-12-19-12s-13 4-18 12z" fill="${hair}"/>`);
    } else {
      back.push(`<circle cx="50" cy="12" r="9" fill="${hair}"/>`);
      front.push(`<path d="M32 44C31 26 41 19 50 19s20 7 18 25c-5-9-11-13-18-13s-13 4-18 13z" fill="${hair}"/>`);
    }
  } else if (style < 45) {
    front.push(`<path d="M32 44C30 25 41 18 50 18s21 7 18 26c-3-8-8-12-18-12s-15 4-18 12z" fill="${hair}"/>`);
  } else if (style < 70) {
    front.push(`<path d="M31 45C29 24 42 17 52 18c12 1 19 10 17 27-2-9-6-13-14-14-9 0-18 3-24 14z" fill="${hair}"/>`);
  } else if (style < 88) {
    front.push(`<path d="M33 35l1-15h32l1 15z" fill="#121826"/><rect x="33" y="31" width="34" height="3" fill="#fe9169"/>`);
  } else {
    front.push(`<path d="M33 40C33 24 42 19 50 19s17 5 17 21c-4-6-9-9-17-9s-13 3-17 9z" fill="#9a9a9a"/>`);
  }
  const beard = !female && next(100) < 32 && style < 88 ? `<path d="M33.5 50c1 17 8 22 16.5 22s15.500-5 16.500-22c-3 9-9 12-16.500 12S36.500 59 33.500 50z" fill="${hair}"/>` : "";

  const eye = (x: number) => `<ellipse cx="${x}" cy="47" rx="1.9" ry="2.2" fill="#1f2937"/><circle cx="${x + 0.7}" cy="46.2" r=".6" fill="#fff"/>`;
  const brow = (x1: number, x2: number) => `<path d="M${x1} 41.500Q${(x1 + x2) / 2} 39.500 ${x2} 41.500" stroke="${female ? "#3b2a20" : hair === "#9a9a9a" ? "#7a7a7a" : hair}" stroke-width="1.500" fill="none" stroke-linecap="round"/>`;
  const specs = glasses ? `<g fill="none" stroke="#1f2937" stroke-width="1.400"><circle cx="43" cy="47" r="5.200"/><circle cx="57" cy="47" r="5.200"/><path d="M48.200 47h3.600"/></g>` : "";
  const smile = next(2) ? `<path d="M44 56.500q6 5 12 0" stroke="#8a3b2c" stroke-width="1.800" fill="none" stroke-linecap="round"/>` : `<path d="M45 56.500q5 3.500 10 0" stroke="#8a3b2c" stroke-width="1.800" fill="none" stroke-linecap="round"/>`;

  const hijabFace = neckOverHair ? `<ellipse cx="50" cy="47" rx="14.500" ry="17.500" fill="${skin}"/>` : "";
  const head = neckOverHair ? hijabFace : `<ellipse cx="50" cy="46" rx="17" ry="20" fill="${skin}"/><circle cx="33" cy="48" r="3.200" fill="${skin}"/><circle cx="67" cy="48" r="3.200" fill="${skin}"/>`;
  const neck = `<rect x="42.500" y="58" width="15" height="20" rx="6" fill="${skin}"/><path d="M42.500 66q7.500 6 15 0v-4h-15z" fill="#000" opacity=".1"/>`;
  const body = `<path d="M8 100c0-20 17-28 42-28s42 8 42 28z" fill="${shirt}"/><path d="M40 73q10 9 20 0l3 3q-13 12-26 0z" fill="#fff" opacity=".85"/>`;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient></defs>` +
    `<rect width="100" height="100" fill="url(#g)"/>${back.join("")}${neckOverHair ? "" : neck}${body}${head}${beard}${front.join("")}${brow(37, 47)}${brow(53, 63)}${eye(43)}${eye(57)}${specs}` +
    `<path d="M50 49v6.500q-2 1-3.500 0" stroke="#000" stroke-opacity=".18" stroke-width="1.200" fill="none" stroke-linecap="round"/>${smile}</svg>`;
  const uri = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  cache.set(name, uri);
  return uri;
}
