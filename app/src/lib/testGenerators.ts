// src/lib/testGenerators.ts
// Builds one candidate's test paper. Every numerical, data, logical, mechanical,
// spatial and checking item is generated with fresh random values, so two
// candidates never see the same numbers (answers cannot be passed along), and
// correct answers are COMPUTED, never typed. Verbal and personality items come
// from the database bank (never shipped in this bundle). This runs only in the
// administrator's browser; candidates receive items one at a time from the server.

export interface GenItem {
  section: string;
  kind: "mcq" | "likert";
  prompt: string;
  stimulus?: Record<string, unknown> | null;
  options: string[];
  correct?: string | null;
  trait?: string | null;
  reverse?: boolean;
  time_limit: number;
}

export interface BankItem {
  section: string; kind: string; prompt: string; options: string[];
  correct: string | null; trait: string | null; reverse: boolean; time_limit: number; form_code: string | null;
}

export const FORM_CODES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

export const SECTION_LABELS: Record<string, string> = {
  verbal: "Verbal Reasoning", numerical: "Numerical Reasoning", data: "Data Interpretation",
  logical: "Logical Reasoning", mechanical: "Mechanical Reasoning", spatial: "Spatial Reasoning",
  detail: "Attention to Detail", personality: "Personality Questionnaire",
};
export const COGNITIVE_SECTIONS = ["verbal", "numerical", "data", "logical", "mechanical", "spatial", "detail"];

const rint = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const shuffle = <T,>(arr: T[]): T[] => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmt = (n: number) => (Number.isInteger(n) ? n.toLocaleString("en-US") : n.toLocaleString("en-US", { maximumFractionDigits: 2 }));

/** Correct answer + distinct distractors, numeric options sorted ascending. */
function opts(correct: number, distractors: number[], format: (n: number) => string, count = 4): { options: string[]; correct: string } {
  const seen = new Set<number>([correct]);
  const out = [correct];
  for (const d of distractors) {
    const v = Math.round(d * 100) / 100;
    if (v > 0 && !seen.has(v) && out.length < count) { seen.add(v); out.push(v); }
  }
  let step = 1;
  while (out.length < count) { const v = correct + step * (out.length % 2 ? 1 : -1) * Math.max(1, Math.round(correct * 0.07)); if (v > 0 && !seen.has(v)) { seen.add(v); out.push(v); } step++; }
  return { options: out.sort((a, b) => a - b).map(format), correct: format(correct) };
}

// ---------------- Numerical (8 templates) ----------------
const numerical: (() => GenItem)[] = [
  () => { const A = rint(8, 15) * 100, p = pick([5, 8, 12, 15, 20, 25]), B = A + (A * p) / 100;
    return { section: "numerical", kind: "mcq", time_limit: 75, prompt: `Ore milled at a plant rose from ${fmt(A)} tonnes in March to ${fmt(B)} tonnes in April. What was the percentage increase?`,
      ...opts(p, [p + 3, p - 3, Math.round(((B - A) / B) * 1000) / 10, p * 2], (n) => `${n}%`) }; },
  () => { const R = rint(20, 80) * 1000, m = pick([10, 15, 20, 25, 30, 35]), C = (R * (100 - m)) / 100;
    return { section: "numerical", kind: "mcq", time_limit: 75, prompt: `A site's monthly revenue was USD ${fmt(R)} and its costs were USD ${fmt(C)}. What was the profit as a percentage of revenue?`,
      ...opts(m, [m + 5, m - 5, Math.round(((R - C) / C) * 1000) / 10], (n) => `${n}%`) }; },
  () => { const [a, b] = pick([[2, 3], [3, 5], [1, 4], [3, 4], [2, 5], [4, 5]]), k = rint(3, 9), N = (a + b) * k;
    return { section: "numerical", kind: "mcq", time_limit: 75, prompt: `${N} new employees are split between Walden and Pickstone in the ratio ${a}:${b}. How many go to Walden?`,
      ...opts(a * k, [b * k, a * k + k, Math.round(N / 2) + 1], fmt) }; },
  () => { const X = pick([40, 50, 60, 75, 80, 120]), h = pick([2.5, 3, 4, 4.5, 6]), Y = X * h;
    return { section: "numerical", kind: "mcq", time_limit: 75, prompt: `A crusher processes ${X} tonnes per hour. How long will it take to process ${fmt(Y)} tonnes?`,
      ...opts(h, [h + 0.5, h - 0.5, h + 1, h * 2], (n) => `${n} hours`) }; },
  () => { const r = pick([12, 15, 18, 24, 26]), a = pick([150, 240, 375, 420, 560]);
    return { section: "numerical", kind: "mcq", time_limit: 75, prompt: `At an exchange rate of 1 USD = ${r} ZWG, how much is USD ${a} in ZWG?`,
      ...opts(a * r, [(a + 50) * r, a * (r - 2), Math.round(a * r * 1.1)], (n) => `ZWG ${fmt(n)}`) }; },
  () => { let off: number[]; do { off = [0, 0, 0, 0].map(() => rint(-50, 50)); off.push(-off.reduce((s, x) => s + x, 0)); } while (Math.abs(off[4]) > 90);
    const avg = rint(300, 500), vals = off.map((o) => avg + o);
    return { section: "numerical", kind: "mcq", time_limit: 75, prompt: `A shift recorded the following tonnes milled over five days: ${vals.join(", ")}. What was the average daily tonnage?`,
      ...opts(avg, [avg + 5, avg - 6, avg + 12], fmt) }; },
  () => { const N = pick([120, 160, 240, 300, 360]), k = pick([15, 20, 25, 35, 40]), ans = (N * k) / 100;
    return { section: "numerical", kind: "mcq", time_limit: 75, prompt: `A site employs ${N} people and ${k}% of them work underground. How many people work underground?`,
      ...opts(ans, [ans + N * 0.05, ans - N * 0.05, N - ans], fmt) }; },
  () => { const P = rint(4, 30) * 100, total = P * 1.15;
    return { section: "numerical", kind: "mcq", time_limit: 75, prompt: `A supplier quotes USD ${fmt(P)} excluding a 15% tax. What is the total amount payable including tax?`,
      ...opts(total, [P * 1.5, P + 15, P * 1.05, P * 1.25], (n) => `USD ${fmt(n)}`) }; },
];

// ---------------- Data interpretation (4 templates, each with its own table) ----------------
const SITES = ["Walden", "Pickstone", "Amatola"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr"];
function oreTable() {
  const rows = SITES.map((s) => [s, ...MONTHS.map(() => rint(80, 160) * 10)]);
  return { rows, stimulus: { type: "table", caption: "Ore milled (tonnes)", columns: ["Site", ...MONTHS], rows } };
}
const data: (() => GenItem)[] = [
  () => { let t; let totals: number[]; do { t = oreTable(); totals = t.rows.map((r) => (r.slice(1) as number[]).reduce((s, x) => s + x, 0)); } while (new Set(totals).size < 3);
    const best = SITES[totals.indexOf(Math.max(...totals))];
    return { section: "data", kind: "mcq", time_limit: 90, stimulus: t.stimulus, prompt: "Which site milled the most ore in total over the four months?", options: [...SITES, "They milled the same amount"], correct: best }; },
  () => { const t = oreTable(); const i = rint(0, 2); const vals = t.rows[i].slice(1) as number[]; const sum = vals.reduce((s, x) => s + x, 0);
    return { section: "data", kind: "mcq", time_limit: 90, stimulus: t.stimulus, prompt: `What was ${SITES[i]}'s total ore milled from January to April?`,
      ...opts(sum, [sum - vals[3], sum + 100, sum - 100, sum + vals[0]], (n) => `${fmt(n)} t`) }; },
  () => { const t = oreTable(); const i = rint(0, 2); const jan = rint(8, 15) * 100; const p = pick([-20, -10, 10, 15, 20, 25]);
    t.rows[i][1] = jan; t.rows[i][4] = jan + (jan * p) / 100;
    const labeler = (n: number) => `${n > 0 ? "+" : ""}${n}%`;
    const o = opts(p + 100, [p + 105, p + 95, -p + 100, p + 110], (n) => labeler(n - 100));
    return { section: "data", kind: "mcq", time_limit: 90, stimulus: t.stimulus, prompt: `By what percentage did ${SITES[i]}'s ore milled change from January to April?`, options: o.options, correct: o.correct }; },
  () => { let t; let monthTotals: number[]; do { t = oreTable(); monthTotals = MONTHS.map((_, m) => t!.rows.reduce((s: number, r: (string | number)[]) => s + (r[m + 1] as number), 0)); } while (new Set(monthTotals).size < 4);
    return { section: "data", kind: "mcq", time_limit: 90, stimulus: t.stimulus, prompt: "In which month was the combined ore milled by all three sites the highest?", options: ["January", "February", "March", "April"], correct: ["January", "February", "March", "April"][monthTotals.indexOf(Math.max(...monthTotals))] }; },
];

// ---------------- Logical (8 series templates) ----------------
function seriesItem(terms: (number | string)[], answer: number | string, distractors: (number | string)[]): GenItem {
  const pool = distractors.filter((d, i, a) => d !== answer && a.indexOf(d) === i);
  if (typeof answer === "number") for (const extra of [answer + 2, answer - 3, answer + 4, answer - 5]) if (pool.length < 3 && extra > 0 && !pool.includes(extra)) pool.push(extra);
  const options = shuffle([answer, ...pool].slice(0, 4)).map(String);
  return { section: "logical", kind: "mcq", time_limit: 45, prompt: `What comes next in the series?\n\n${terms.join(",  ")},  ?`, options, correct: String(answer) };
}
const logical: (() => GenItem)[] = [
  () => { const a = rint(2, 30), d = rint(3, 12); const t = [0, 1, 2, 3, 4].map((i) => a + i * d); const n = a + 5 * d; return seriesItem(t, n, [n + 1, n - d + 2, n + d, n - 1]); },
  () => { const a = rint(2, 5), r = pick([2, 3]); const t = [0, 1, 2, 3, 4].map((i) => a * r ** i); const n = a * r ** 5; return seriesItem(t, n, [n + a * r, t[4] + (t[4] - t[3]), n - r, n * r]); },
  () => { const a = rint(10, 40), x = rint(5, 12), y = rint(2, 4); const t = [a]; for (let i = 1; i < 6; i++) t.push(t[i - 1] + (i % 2 ? x : -y)); const n = t[5] - y; return seriesItem(t, n, [t[5] + x, n + 1, t[5] + x - y, n - y]); },
  () => { const a = rint(1, 10), d0 = rint(1, 4); const t = [a]; for (let i = 0; i < 4; i++) t.push(t[i] + d0 + i); const n = t[4] + d0 + 4; return seriesItem(t, n, [n - 1, n + 1, t[4] + d0 + 3, n + 2]); },
  () => { const n0 = rint(2, 6), c = rint(-3, 5); const t = [0, 1, 2, 3, 4].map((i) => (n0 + i) ** 2 + c); const n = (n0 + 5) ** 2 + c; return seriesItem(t, n, [n + 1, n - 2, n + n0, t[4] + (t[4] - t[3])]); },
  () => { const a = rint(1, 5), b = rint(2, 7); const t = [a, b]; for (let i = 2; i < 6; i++) t.push(t[i - 1] + t[i - 2]); const n = t[5] + t[4]; return seriesItem(t, n, [n + 1, n - 2, t[5] * 2, n + t[3]]); },
  () => { const L = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; const k = rint(2, 4), s = rint(0, 25 - 5 * k); const t = [0, 1, 2, 3, 4].map((i) => L[s + i * k]); const n = L[s + 5 * k];
    return seriesItem(t, n, [L[s + 5 * k - 1], L[Math.min(25, s + 5 * k + 1)], L[Math.min(25, s + 6 * k)], L[s + 4 * k + 1], L[s + 5 * k - 2], L[Math.max(0, s + 4 * k - 1)]]); },
  () => { const a = rint(2, 9), b = rint(20, 40), d1 = rint(2, 5), d2 = -rint(1, 3); const t = [a, b, a + d1, b + d2, a + 2 * d1, b + 2 * d2]; const n = a + 3 * d1; return seriesItem(t, n, [b + 3 * d2, n + 1, n - d1 + 1, a + 4 * d1]); },
];

// ---------------- Mechanical (6 templates) ----------------
const mechanical: (() => GenItem)[] = [
  () => { const N = rint(3, 8); return { section: "mechanical", kind: "mcq", time_limit: 60,
    prompt: `${N} gears are arranged in a straight line, each meshing with the next. Gear 1 turns clockwise. In which direction does gear ${N} turn?`,
    options: ["Clockwise", "Anticlockwise", "It does not turn", "Cannot be determined"], correct: N % 2 ? "Clockwise" : "Anticlockwise" }; },
  () => { let T1: number, T2: number, R: number, s: number;
    do { T1 = pick([20, 24, 30, 36, 40, 48, 60]); T2 = pick([20, 24, 30, 36, 40, 48, 60]); R = pick([60, 90, 120, 180, 240]); s = (R * T1) / T2; } while (T1 === T2 || !Number.isInteger(s));
    return { section: "mechanical", kind: "mcq", time_limit: 60, prompt: `A driving gear with ${T1} teeth turns at ${R} rpm and meshes with a gear that has ${T2} teeth. How fast does the second gear turn?`,
      ...opts(s, [(R * T2) / T1, R, R + (T2 - T1)], (n) => `${fmt(n)} rpm`) }; },
  () => { let L: number, d1: number, d2: number, e: number;
    do { L = pick([200, 300, 400, 600, 900]); d1 = pick([0.5, 1, 1.5, 2]); d2 = pick([1, 2, 3, 4]); e = (L * d1) / d2; } while (d2 <= d1 || !Number.isInteger(e));
    return { section: "mechanical", kind: "mcq", time_limit: 60, prompt: `On a lever, a load of ${L} N sits ${d1} m from the fulcrum. What force, applied ${d2} m from the fulcrum on the other side, will balance it?`,
      ...opts(e, [(L * d2) / d1, L, L - e, e * 2], (n) => `${fmt(n)} N`) }; },
  () => { const n = pick([2, 3, 4, 6]), W = n * rint(50, 150);
    return { section: "mechanical", kind: "mcq", time_limit: 60, prompt: `A block-and-tackle pulley system lifts a load of ${fmt(W)} N using ${n} supporting rope sections. Ignoring friction, what effort is needed?`,
      ...opts(W / n, [W, W / (n + 1), (W / n) * 2, W - W / n], (x) => `${fmt(x)} N`) }; },
  () => { const F = pick([20, 30, 40, 60]), A = pick([50, 80, 100, 150]);
    return { section: "mechanical", kind: "mcq", time_limit: 60, prompt: `In a hydraulic jack, a force of ${F} N is applied to a piston of area 10 cm². The output piston has an area of ${A} cm². What force does the output piston exert?`,
      ...opts((F * A) / 10, [F * A, F + A, (F * 10) / A], (n) => `${fmt(n)} N`) }; },
  () => { let D1: number, D2: number, R: number, s: number;
    do { D1 = pick([100, 150, 200, 300]); D2 = pick([100, 150, 200, 300, 400, 600]); R = pick([600, 900, 1200, 1500]); s = (R * D1) / D2; } while (D1 === D2 || !Number.isInteger(s));
    return { section: "mechanical", kind: "mcq", time_limit: 60, prompt: `A motor pulley of ${D1} mm diameter turns at ${R} rpm and drives a ${D2} mm pulley by belt. How fast does the driven pulley turn?`,
      ...opts(s, [(R * D2) / D1, R, R - s], (n) => `${fmt(n)} rpm`) }; },
];

// ---------------- Spatial / direction (3 templates) ----------------
const DIRS = ["North", "East", "South", "West"];
const COMPASS8 = ["North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West"];
const spatial: (() => GenItem)[] = [
  () => { let f = rint(0, 3); const start = DIRS[f]; const turns: string[] = [];
    for (let i = 0; i < rint(3, 5); i++) { const t = pick(["right", "left", "about"]); turns.push(t === "about" ? "turns around (180°)" : `turns 90° ${t}`); f = (f + (t === "right" ? 1 : t === "left" ? 3 : 2)) % 4; }
    return { section: "spatial", kind: "mcq", time_limit: 60, prompt: `A surveyor starts facing ${start}. They then ${turns.join(", then ")}. Which direction are they now facing?`, options: [...DIRS], correct: DIRS[f] }; },
  () => { let dx = 0, dy = 0; const legs: string[] = [];
    do { dx = 0; dy = 0; legs.length = 0; for (let i = 0; i < rint(3, 4); i++) { const d = rint(0, 3), m = rint(1, 9) * 100; legs.push(`${m} m ${DIRS[d]}`); if (d === 0) dy += m; if (d === 2) dy -= m; if (d === 1) dx += m; if (d === 3) dx -= m; } } while (dx === 0 && dy === 0);
    const ang = (Math.atan2(dx, dy) * 180) / Math.PI; const idx = ((Math.round(ang / 45) % 8) + 8) % 8;
    const near = [COMPASS8[idx], COMPASS8[(idx + 1) % 8], COMPASS8[(idx + 7) % 8], COMPASS8[(idx + 4) % 8]];
    return { section: "spatial", kind: "mcq", time_limit: 60, prompt: `From the shaft head, a vehicle drives ${legs.join(", then ")}. In which general direction is it now from the shaft head?`, options: shuffle(near), correct: COMPASS8[idx] }; },
  () => { const k = rint(1, 4), a = rint(3 * k + 1, 3 * k + 8), c = a - 3 * k, b = 4 * k;
    return { section: "spatial", kind: "mcq", time_limit: 60, prompt: `A geologist walks ${a} km North, then ${b} km East, then ${c} km South. How far are they now from the starting point, in a straight line?`,
      ...opts(5 * k, [7 * k, a + b + c, 4 * k, 6 * k], (n) => `${n} km`) }; },
];

// ---------------- Attention to detail ----------------
const SIMILAR: Record<string, string> = { "3": "8", "8": "3", "5": "6", "6": "5", "1": "7", "7": "1", "0": "9", "9": "0", "2": "Z", B: "E", E: "F", F: "E", M: "N", N: "M", P: "R", R: "P", C: "G", G: "C" };
function assetCode() {
  const site = pick(["WAL", "PKS", "AMA", "KWE", "CHD", "BYO", "COM"]); const cls = pick(["LT", "DT", "PR", "PH", "TB", "SW", "UP"]);
  return `${site}-${cls}-${String(rint(1000, 99999)).padStart(5, "0")}-${pick("BCEFGMNPR".split(""))}${rint(1, 9)}`;
}
function alter(code: string) {
  const idx = shuffle([...code].map((c, i) => (SIMILAR[c] ? i : -1)).filter((i) => i >= 0))[0];
  return code.slice(0, idx) + SIMILAR[code[idx]] + code.slice(idx + 1);
}
function detailItem(): GenItem {
  const diff = rint(0, 4); const pairs = Array.from({ length: 5 }, () => { const c = assetCode(); return [c, c]; });
  shuffle([0, 1, 2, 3, 4]).slice(0, diff).forEach((i) => { pairs[i][1] = alter(pairs[i][0]); });
  return { section: "detail", kind: "mcq", time_limit: 40, stimulus: { type: "pairs", columns: ["Asset register", "Site record"], rows: pairs },
    prompt: "Compare the asset register with the site record. How many of the five pairs do NOT match exactly?", options: ["0", "1", "2", "3", "4", "5"], correct: String(diff) };
}

/** Choose `n` templates from a list, rotating which are left out by form. */
function rotateTemplates<T>(list: T[], n: number, formIndex: number): T[] {
  const skip = new Set<number>(); let i = 0;
  while (list.length - skip.size > n) { skip.add((formIndex * 3 + i * 5) % list.length); i++; }
  return list.filter((_, k) => !skip.has(k));
}

const KEEP_ORDER = (o: string[]) => o.join("|") === "True|False|Cannot say" || o.includes("Clockwise") || o[0] === "0" || o[0] === "January" || o[0] === "North" || o.every((x) => /^\d/.test(x) || /^(USD|ZWG)/.test(x));

/** Assemble a full test paper for one candidate. */
export function buildPaper(formCode: string, bank: BankItem[], includePersonality: boolean): GenItem[] {
  const fi = Math.max(0, FORM_CODES.indexOf(formCode));
  const sec = (items: GenItem[]) => shuffle(items).map((it) => (it.kind === "mcq" && !KEEP_ORDER(it.options) ? { ...it, options: shuffle(it.options) } : it));
  const verbal = bank.filter((b) => b.section === "verbal" && b.form_code === formCode)
    .map((b): GenItem => ({ section: "verbal", kind: "mcq", prompt: b.prompt, options: b.options, correct: b.correct, time_limit: b.time_limit }));
  const paper: GenItem[] = [
    ...sec(verbal),
    ...sec(rotateTemplates(numerical, 6, fi).map((g) => g())),
    ...sec(rotateTemplates(data, 3, fi).map((g) => g())),
    ...sec(rotateTemplates(logical, 5, fi).map((g) => g())),
    ...sec(rotateTemplates(mechanical, 4, fi).map((g) => g())),
    ...sec(spatial.map((g) => g())),
    ...sec([detailItem(), detailItem(), detailItem(), detailItem(), detailItem()]),
  ];
  if (includePersonality) {
    paper.push(...shuffle(bank.filter((b) => b.section === "personality")).map((b): GenItem => ({
      section: "personality", kind: "likert", prompt: b.prompt, options: b.options, trait: b.trait, reverse: b.reverse, time_limit: b.time_limit,
    })));
  }
  return paper;
}
