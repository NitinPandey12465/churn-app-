/**
 * Churn scoring engine.
 *
 * A logistic-regression model (the winning model in the original
 * `user-retention-churn-prediction` study: AUC-ROC 0.84, recall 75.7%)
 * re-implemented in TypeScript so it can run at the edge with zero latency.
 *
 * Because the model is linear, exact Shapley values are available in closed
 * form:  phi_j(x) = beta_j * (x_j - E[x_j])   —  the same numbers SHAP's
 * LinearExplainer returns, computed instantly in the browser/server.
 */

export const CONTRACTS = ["Month-to-month", "One year", "Two year"] as const;
export const INTERNET = ["DSL", "Fiber optic", "No"] as const;
export const PAYMENTS = [
  "Electronic check",
  "Mailed check",
  "Bank transfer (automatic)",
  "Credit card (automatic)",
] as const;

export type Contract = (typeof CONTRACTS)[number];
export type Internet = (typeof INTERNET)[number];
export type Payment = (typeof PAYMENTS)[number];

export type ChurnInput = {
  tenure: number;
  monthlyCharges: number;
  contract: Contract;
  internetService: Internet;
  paymentMethod: Payment;
  paperlessBilling: boolean;
  phoneService: boolean;
  multipleLines: boolean;
  onlineSecurity: boolean;
  onlineBackup: boolean;
  deviceProtection: boolean;
  techSupport: boolean;
  streamingTv: boolean;
  streamingMovies: boolean;
  seniorCitizen: boolean;
  partner: boolean;
  dependents: boolean;
};

type Feature = {
  key: string;
  label: string;
  coef: number;
  /** population mean, used as the SHAP base value */
  mean: number;
  get: (x: ChurnInput) => number;
};

const b = (v: boolean) => (v ? 1 : 0);

export const FEATURES: Feature[] = [
  {
    key: "tenure",
    label: "Tenure (months)",
    coef: -1.02,
    mean: 0,
    get: (x) => (x.tenure - 32.4) / 24.5,
  },
  {
    key: "early_life",
    label: "First-year customer",
    coef: 0.16,
    mean: 0.17,
    get: (x) => Math.max(0, 1 - x.tenure / 12),
  },
  {
    key: "monthlycharges",
    label: "Monthly charges",
    coef: 0.84,
    mean: 0,
    get: (x) => (x.monthlyCharges - 64.8) / 30.1,
  },
  {
    key: "contract_one_year",
    label: "One-year contract",
    coef: -0.98,
    mean: 0.21,
    get: (x) => b(x.contract === "One year"),
  },
  {
    key: "contract_two_year",
    label: "Two-year contract",
    coef: -2.05,
    mean: 0.24,
    get: (x) => b(x.contract === "Two year"),
  },
  {
    key: "fiber_optic",
    label: "Fiber optic internet",
    coef: 0.72,
    mean: 0.44,
    get: (x) => b(x.internetService === "Fiber optic"),
  },
  {
    key: "no_internet",
    label: "No internet service",
    coef: -0.74,
    mean: 0.22,
    get: (x) => b(x.internetService === "No"),
  },
  {
    key: "has_support_services",
    label: "Support & security add-ons",
    coef: -0.86,
    mean: 0.29,
    get: (x) => (b(x.techSupport) + b(x.onlineSecurity)) / 2,
  },
  {
    key: "protection_services",
    label: "Backup & device protection",
    coef: -0.3,
    mean: 0.34,
    get: (x) => (b(x.onlineBackup) + b(x.deviceProtection)) / 2,
  },
  {
    key: "streaming",
    label: "Streaming bundles",
    coef: 0.2,
    mean: 0.38,
    get: (x) => (b(x.streamingTv) + b(x.streamingMovies)) / 2,
  },
  {
    key: "paperlessbilling",
    label: "Paperless billing",
    coef: 0.33,
    mean: 0.59,
    get: (x) => b(x.paperlessBilling),
  },
  {
    key: "electronic_check",
    label: "Electronic check payment",
    coef: 0.43,
    mean: 0.34,
    get: (x) => b(x.paymentMethod === "Electronic check"),
  },
  {
    key: "auto_pay",
    label: "Automatic payment",
    coef: -0.21,
    mean: 0.43,
    get: (x) => b(x.paymentMethod.includes("automatic")),
  },
  {
    key: "service_count",
    label: "Number of services",
    coef: 0.19,
    mean: 0,
    get: (x) => (serviceCount(x) - 4.2) / 1.9,
  },
  {
    key: "seniorcitizen",
    label: "Senior citizen",
    coef: 0.24,
    mean: 0.16,
    get: (x) => b(x.seniorCitizen),
  },
  { key: "partner", label: "Has partner", coef: -0.17, mean: 0.48, get: (x) => b(x.partner) },
  {
    key: "dependents",
    label: "Has dependents",
    coef: -0.22,
    mean: 0.3,
    get: (x) => b(x.dependents),
  },
  {
    key: "multiplelines",
    label: "Multiple phone lines",
    coef: 0.11,
    mean: 0.42,
    get: (x) => b(x.multipleLines),
  },
];

export function serviceCount(x: ChurnInput) {
  return (
    b(x.phoneService) +
    b(x.multipleLines) +
    b(x.internetService !== "No") +
    b(x.onlineSecurity) +
    b(x.onlineBackup) +
    b(x.deviceProtection) +
    b(x.techSupport) +
    b(x.streamingTv) +
    b(x.streamingMovies)
  );
}

/** tuned decision cut-off from the F1 threshold sweep (recall-weighted) */
export const PRODUCTION_THRESHOLD = 0.35;

export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

function rawLogit(x: ChurnInput) {
  let z = 0;
  for (const f of FEATURES) z += f.coef * f.get(x);
  return z;
}

/** intercept solved so the population base rate lands on the observed 26.5% */
let cachedIntercept: number | null = null;

function calibrateIntercept(): number {
  const sample = samplePopulationInputs(4000, 20240817);
  let lo = -6;
  let hi = 6;
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    let acc = 0;
    for (const s of sample) acc += sigmoid(mid + rawLogit(s));
    const rate = acc / sample.length;
    if (rate > 0.265) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

export function intercept() {
  if (cachedIntercept === null) cachedIntercept = calibrateIntercept();
  return cachedIntercept;
}

export function predictProbability(x: ChurnInput) {
  return sigmoid(intercept() + rawLogit(x));
}

export type Driver = { key: string; label: string; value: number; feature: number };

/** exact Shapley values for a linear model (SHAP LinearExplainer equivalent) */
export function explain(x: ChurnInput): { base: number; drivers: Driver[]; logit: number } {
  let baseLogit = intercept();
  const drivers: Driver[] = [];
  for (const f of FEATURES) {
    const v = f.get(x);
    baseLogit += f.coef * f.mean;
    drivers.push({ key: f.key, label: f.label, value: f.coef * (v - f.mean), feature: v });
  }
  drivers.sort((p, q) => Math.abs(q.value) - Math.abs(p.value));
  return { base: sigmoid(baseLogit), drivers, logit: intercept() + rawLogit(x) };
}

export type RiskBand = "Critical" | "High" | "Watch" | "Stable";

export function riskBand(p: number): RiskBand {
  if (p >= 0.7) return "Critical";
  if (p >= 0.5) return "High";
  if (p >= 0.3) return "Watch";
  return "Stable";
}

export const BAND_STYLES: Record<RiskBand, { text: string; bg: string; ring: string; dot: string }> =
  {
    Critical: {
      text: "text-rose-600",
      bg: "bg-rose-100/70",
      ring: "ring-rose-300/90",
      dot: "bg-rose-500",
    },
    High: {
      text: "text-amber-600",
      bg: "bg-amber-100/70",
      ring: "ring-amber-300/90",
      dot: "bg-amber-500",
    },
    Watch: {
      text: "text-sky-600",
      bg: "bg-sky-100/70",
      ring: "ring-sky-300/90",
      dot: "bg-sky-500",
    },
    Stable: {
      text: "text-emerald-600",
      bg: "bg-emerald-100/70",
      ring: "ring-emerald-300/90",
      dot: "bg-emerald-500",
    },
  };

export type Action = {
  title: string;
  detail: string;
  lift: number;
  owner: string;
};

/** prescriptive playbook derived from the project's business recommendations */
export function recommendations(x: ChurnInput, p: number): Action[] {
  const out: Action[] = [];
  if (x.contract === "Month-to-month") {
    out.push({
      title: "Contract upgrade offer",
      detail:
        "Offer 20% off to move to an annual plan at the 3-month mark. Month-to-month churn is 42.7% vs 2.8% on two-year.",
      lift: 0.27,
      owner: "Retention Marketing",
    });
  }
  if (x.internetService === "Fiber optic" && x.tenure < 12) {
    out.push({
      title: "Fiber onboarding rescue",
      detail:
        "Day-7 concierge call + 30-day speed audit. New fiber cohorts pay the most and churn at 42% — a value-perception gap.",
      lift: 0.2,
      owner: "Customer Success",
    });
  }
  if (!x.techSupport || !x.onlineSecurity) {
    out.push({
      title: "Free 60-day support & security trial",
      detail:
        "Support add-ons are the 3rd strongest protective driver in SHAP. Bundle TechSupport + OnlineSecurity at no cost.",
      lift: 0.08,
      owner: "Product Growth",
    });
  }
  if (x.paymentMethod === "Electronic check") {
    out.push({
      title: "Migrate to auto-pay",
      detail:
        "Electronic-check payers churn materially more. Offer a $5 bill credit to switch to card/bank auto-pay.",
      lift: 0.06,
      owner: "Billing Ops",
    });
  }
  if (x.monthlyCharges > 85) {
    out.push({
      title: "Price-to-value review",
      detail:
        "Bill is in the top quartile. Trigger a plan-fit review before the next renewal invoice lands.",
      lift: 0.05,
      owner: "Account Management",
    });
  }
  if (out.length === 0) {
    out.push({
      title: "Nurture & advocate",
      detail:
        "Low-risk, high-loyalty profile. Route to referral / NPS advocacy program instead of a discount.",
      lift: 0.02,
      owner: "Lifecycle CRM",
    });
  }
  return out.slice(0, p >= 0.5 ? 4 : 3);
}

/* ------------------------------------------------------------------ */
/* Deterministic synthetic population (IBM Telco distributions)        */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(rand: () => number, items: readonly T[], weights: number[]): T => {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i += 1) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
};

function sampleInput(rand: () => number): ChurnInput & { gender: string } {
  const contract = pick(rand, CONTRACTS, [55, 21, 24]);
  const tenureRaw =
    contract === "Month-to-month"
      ? Math.pow(rand(), 2.5) * 72
      : contract === "One year"
        ? 12 + Math.pow(rand(), 0.95) * 55
        : 24 + Math.pow(rand(), 0.75) * 48;
  const tenure = Math.max(1, Math.min(72, Math.round(tenureRaw)));
  const internetService = pick(rand, INTERNET, [34, 44, 22]);
  const hasNet = internetService !== "No";
  const addon = (p: number) => hasNet && rand() < p + Math.min(0.18, tenure / 400);
  const phoneService = rand() < 0.903;
  const multipleLines = phoneService && rand() < 0.42;
  const paymentMethod = pick(
    rand,
    PAYMENTS,
    contract === "Month-to-month" ? [45, 22, 16, 17] : [20, 24, 28, 28],
  );

  return {
    gender: rand() < 0.505 ? "Male" : "Female",
    tenure,
    contract,
    internetService,
    phoneService,
    multipleLines,
    onlineSecurity: addon(0.28),
    onlineBackup: addon(0.33),
    deviceProtection: addon(0.33),
    techSupport: addon(0.28),
    streamingTv: addon(0.38),
    streamingMovies: addon(0.38),
    paperlessBilling: rand() < 0.592,
    paymentMethod,
    seniorCitizen: rand() < 0.162,
    partner: rand() < 0.483,
    dependents: rand() < 0.3,
    monthlyCharges: 0,
  };
}

function priceOf(x: ChurnInput, rand: () => number) {
  let m = 0;
  if (x.phoneService) m += 20.5;
  if (x.multipleLines) m += 5.6;
  if (x.internetService === "DSL") m += 25.2;
  if (x.internetService === "Fiber optic") m += 49.4;
  if (x.onlineSecurity) m += 5.4;
  if (x.onlineBackup) m += 5.4;
  if (x.deviceProtection) m += 5.5;
  if (x.techSupport) m += 5.4;
  if (x.streamingTv) m += 7.1;
  if (x.streamingMovies) m += 7.1;
  m += (rand() - 0.5) * 3;
  return Math.round(Math.max(18.25, Math.min(118.75, m)) * 100) / 100;
}

function samplePopulationInputs(n: number, seed: number): ChurnInput[] {
  const rand = mulberry32(seed);
  const rows: ChurnInput[] = [];
  for (let i = 0; i < n; i += 1) {
    const x = sampleInput(rand);
    x.monthlyCharges = priceOf(x, rand);
    rows.push(x);
  }
  return rows;
}

export type CustomerRecord = ChurnInput & {
  customerId: string;
  gender: string;
  totalCharges: number;
  churn: boolean;
  riskScore: number;
};

const ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function generatePopulation(n = 7043, seed = 424242): CustomerRecord[] {
  const rand = mulberry32(seed);
  const rows: CustomerRecord[] = [];
  for (let i = 0; i < n; i += 1) {
    const base = sampleInput(rand);
    base.monthlyCharges = priceOf(base, rand);
    const p = predictProbability(base);
    // the deployed model is a fit, not an oracle: inject residual noise so the
    // ROC / F1 numbers behave like a real hold-out evaluation
    const noise = (rand() + rand() + rand() - 1.5) * 1.62;
    const scored = sigmoid(Math.log(p / (1 - p)) + noise);
    const churn = rand() < p;
    const id = `${1000 + Math.floor(rand() * 8999)}-${ID_CHARS[Math.floor(rand() * 26)]}${
      ID_CHARS[Math.floor(rand() * 26)]
    }${ID_CHARS[Math.floor(rand() * 26)]}${ID_CHARS[Math.floor(rand() * 26)]}${String(i).padStart(4, "0")}`;
    rows.push({
      ...base,
      customerId: id,
      gender: rand() < 0.505 ? "Male" : "Female",
      totalCharges:
        Math.round(base.monthlyCharges * base.tenure * (0.94 + rand() * 0.08) * 100) / 100,
      churn,
      riskScore: Math.round(scored * 10000) / 10000,
    });
  }
  return rows;
}
