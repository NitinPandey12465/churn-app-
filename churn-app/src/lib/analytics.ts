import { CustomerRecord, FEATURES, PRODUCTION_THRESHOLD, type ChurnInput } from "./churn";

const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
const rate = (part: number, total: number) => (total === 0 ? 0 : part / total);

export type Kpis = {
  customers: number;
  churned: number;
  churnRate: number;
  mrr: number;
  revenueAtRisk: number;
  highRisk: number;
  avgTenureChurned: number;
  avgTenureRetained: number;
  avgMonthly: number;
  clvAtRisk: number;
};

export function kpis(rows: CustomerRecord[]): Kpis {
  const churned = rows.filter((r) => r.churn);
  const active = rows.filter((r) => !r.churn);
  const high = active.filter((r) => r.riskScore >= PRODUCTION_THRESHOLD);
  return {
    customers: rows.length,
    churned: churned.length,
    churnRate: round(rate(churned.length, rows.length), 4),
    mrr: round(rows.reduce((s, r) => s + r.monthlyCharges, 0)),
    revenueAtRisk: round(high.reduce((s, r) => s + r.monthlyCharges, 0)),
    highRisk: high.length,
    avgTenureChurned: round(rate(churned.reduce((s, r) => s + r.tenure, 0), churned.length), 1),
    avgTenureRetained: round(rate(active.reduce((s, r) => s + r.tenure, 0), active.length), 1),
    avgMonthly: round(rate(rows.reduce((s, r) => s + r.monthlyCharges, 0), rows.length)),
    clvAtRisk: round(high.reduce((s, r) => s + r.monthlyCharges * 18, 0)),
  };
}

export type Segment = {
  label: string;
  total: number;
  churned: number;
  rate: number;
  mrr: number;
  atRisk: number;
};

function segmentBy(rows: CustomerRecord[], keyOf: (r: CustomerRecord) => string, order?: string[]) {
  const map = new Map<string, CustomerRecord[]>();
  for (const r of rows) {
    const k = keyOf(r);
    const bucket = map.get(k);
    if (bucket) bucket.push(r);
    else map.set(k, [r]);
  }
  const keys = order ?? [...map.keys()].sort();
  const out: Segment[] = [];
  for (const k of keys) {
    const list = map.get(k) ?? [];
    if (!list.length) continue;
    const churned = list.filter((r) => r.churn).length;
    out.push({
      label: k,
      total: list.length,
      churned,
      rate: round(rate(churned, list.length), 4),
      mrr: round(list.reduce((s, r) => s + r.monthlyCharges, 0)),
      atRisk: round(
        list.filter((r) => !r.churn && r.riskScore >= PRODUCTION_THRESHOLD).reduce((s, r) => s + r.monthlyCharges, 0),
      ),
    });
  }
  return out;
}

export const TENURE_BUCKETS = ["0-6", "7-12", "13-24", "25-48", "49-72"] as const;

export function tenureBucket(t: number) {
  if (t <= 6) return "0-6";
  if (t <= 12) return "7-12";
  if (t <= 24) return "13-24";
  if (t <= 48) return "25-48";
  return "49-72";
}

export function byContract(rows: CustomerRecord[]) {
  return segmentBy(rows, (r) => r.contract, ["Month-to-month", "One year", "Two year"]);
}
export function byInternet(rows: CustomerRecord[]) {
  return segmentBy(rows, (r) => r.internetService, ["DSL", "Fiber optic", "No"]);
}
export function byPayment(rows: CustomerRecord[]) {
  return segmentBy(rows, (r) => r.paymentMethod);
}
export function byTenure(rows: CustomerRecord[]) {
  return segmentBy(rows, (r) => tenureBucket(r.tenure), [...TENURE_BUCKETS]);
}

export type HeatCell = { contract: string; bucket: string; rate: number; total: number };

export function cohortHeatmap(rows: CustomerRecord[]): HeatCell[] {
  const cells: HeatCell[] = [];
  for (const contract of ["Month-to-month", "One year", "Two year"]) {
    for (const bucket of TENURE_BUCKETS) {
      const list = rows.filter((r) => r.contract === contract && tenureBucket(r.tenure) === bucket);
      cells.push({
        contract,
        bucket,
        total: list.length,
        rate: round(rate(list.filter((r) => r.churn).length, list.length), 4),
      });
    }
  }
  return cells;
}

export type HeadlineCohort = {
  size: number;
  rate: number;
  monthlyRevenueAtRisk: number;
  multiple: number;
};

/** Month-to-month + Fiber optic + tenure < 12 — the project's headline finding */
export function headlineCohort(rows: CustomerRecord[]): HeadlineCohort {
  const list = rows.filter(
    (r) => r.contract === "Month-to-month" && r.internetService === "Fiber optic" && r.tenure < 12,
  );
  const churned = list.filter((r) => r.churn).length;
  const overall = rate(rows.filter((r) => r.churn).length, rows.length);
  const cohortRate = rate(churned, list.length);
  return {
    size: list.length,
    rate: round(cohortRate, 4),
    monthlyRevenueAtRisk: round(list.reduce((s, r) => s + r.monthlyCharges, 0)),
    multiple: round(overall === 0 ? 0 : cohortRate / overall, 2),
  };
}

/* -------------------------------- model lab ------------------------------- */

export type RocPoint = { fpr: number; tpr: number; threshold: number };

export function rocCurve(rows: CustomerRecord[]): { points: RocPoint[]; auc: number } {
  const sorted = [...rows].sort((a, b) => b.riskScore - a.riskScore);
  const positives = sorted.filter((r) => r.churn).length;
  const negatives = sorted.length - positives;
  let tp = 0;
  let fp = 0;
  const points: RocPoint[] = [{ fpr: 0, tpr: 0, threshold: 1 }];
  let auc = 0;
  let prevFpr = 0;
  let prevTpr = 0;
  const step = Math.max(1, Math.floor(sorted.length / 220));
  sorted.forEach((r, i) => {
    if (r.churn) tp += 1;
    else fp += 1;
    if (i % step === 0 || i === sorted.length - 1) {
      const tpr = rate(tp, positives);
      const fpr = rate(fp, negatives);
      auc += ((fpr - prevFpr) * (tpr + prevTpr)) / 2;
      prevFpr = fpr;
      prevTpr = tpr;
      points.push({ fpr: round(fpr, 4), tpr: round(tpr, 4), threshold: round(r.riskScore, 4) });
    }
  });
  auc += (1 - prevFpr) * (1 + prevTpr) * 0.5;
  return { points, auc: round(auc, 4) };
}

export type Confusion = {
  threshold: number;
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  precision: number;
  recall: number;
  f1: number;
  accuracy: number;
  specificity: number;
  capturedRevenue: number;
};

export function confusionAt(rows: CustomerRecord[], threshold: number): Confusion {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  let capturedRevenue = 0;
  for (const r of rows) {
    const flagged = r.riskScore >= threshold;
    if (flagged && r.churn) {
      tp += 1;
      capturedRevenue += r.monthlyCharges;
    } else if (flagged && !r.churn) fp += 1;
    else if (!flagged && r.churn) fn += 1;
    else tn += 1;
  }
  const precision = rate(tp, tp + fp);
  const recall = rate(tp, tp + fn);
  return {
    threshold: round(threshold, 2),
    tp,
    fp,
    tn,
    fn,
    precision: round(precision, 4),
    recall: round(recall, 4),
    f1: round(precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall), 4),
    accuracy: round(rate(tp + tn, rows.length), 4),
    specificity: round(rate(tn, tn + fp), 4),
    capturedRevenue: round(capturedRevenue),
  };
}

export function bestThreshold(rows: CustomerRecord[]) {
  let best = { t: 0.5, f1: 0 };
  for (let t = 0.1; t <= 0.9; t += 0.01) {
    const c = confusionAt(rows, t);
    if (c.f1 > best.f1) best = { t: round(t, 2), f1: c.f1 };
  }
  return best;
}

/* --------------------------- survival analysis ---------------------------- */

export type SurvivalCurve = {
  label: string;
  color: string;
  median: number | null;
  points: { t: number; s: number }[];
};

/**
 * Kaplan-Meier estimator. Churned customers are events at their tenure,
 * retained customers are right-censored at their tenure.
 */
export function kaplanMeier(rows: CustomerRecord[], label: string, color: string): SurvivalCurve {
  const maxT = 72;
  const events = new Array<number>(maxT + 1).fill(0);
  const censored = new Array<number>(maxT + 1).fill(0);
  for (const r of rows) {
    const t = Math.max(0, Math.min(maxT, r.tenure));
    if (r.churn) events[t] += 1;
    else censored[t] += 1;
  }
  let atRisk = rows.length;
  let s = 1;
  const points = [{ t: 0, s: 1 }];
  let median: number | null = null;
  for (let t = 1; t <= maxT; t += 1) {
    if (atRisk <= 0) break;
    if (events[t] > 0) s *= 1 - events[t] / atRisk;
    atRisk -= events[t] + censored[t];
    points.push({ t, s: round(s, 4) });
    if (median === null && s <= 0.5) median = t;
  }
  return { label, color, median, points };
}

export function survivalByContract(rows: CustomerRecord[]): SurvivalCurve[] {
  const palette: Record<string, string> = {
    "Month-to-month": "#be123c",
    "One year": "#c2680a",
    "Two year": "#0d9488",
  };
  return ["Month-to-month", "One year", "Two year"].map((c) =>
    kaplanMeier(
      rows.filter((r) => r.contract === c),
      c,
      palette[c],
    ),
  );
}

/* ------------------------------- global SHAP ------------------------------ */

export type ShapBar = { key: string; label: string; importance: number; direction: number };

export function globalShap(rows: CustomerRecord[], limit = 10): ShapBar[] {
  const sample = rows.length > 2500 ? rows.filter((_, i) => i % Math.ceil(rows.length / 2500) === 0) : rows;
  const acc = new Map<string, { abs: number; signed: number }>();
  for (const r of sample) {
    for (const f of FEATURES) {
      const phi = f.coef * (f.get(r as ChurnInput) - f.mean);
      const cur = acc.get(f.key) ?? { abs: 0, signed: 0 };
      cur.abs += Math.abs(phi);
      cur.signed += phi;
      acc.set(f.key, cur);
    }
  }
  return FEATURES.map((f) => {
    const a = acc.get(f.key) ?? { abs: 0, signed: 0 };
    return {
      key: f.key,
      label: f.label,
      importance: round(a.abs / sample.length, 4),
      direction: Math.sign(f.coef),
    };
  })
    .sort((p, q) => q.importance - p.importance)
    .slice(0, limit);
}

export const fmtMoney = (v: number, digits = 0) =>
  `$${v.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits })}`;
export const fmtPct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`;
