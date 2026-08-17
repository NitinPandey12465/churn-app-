import { desc } from "drizzle-orm";
import { db } from "@/db";
import { predictions } from "@/db/schema";
import {
  CONTRACTS,
  INTERNET,
  PAYMENTS,
  explain,
  predictProbability,
  recommendations,
  riskBand,
  serviceCount,
  type ChurnInput,
  type Contract,
  type Internet,
  type Payment,
} from "@/lib/churn";

export const dynamic = "force-dynamic";

const bool = (v: unknown) => v === true || v === "true" || v === 1 || v === "1";

function parse(body: Record<string, unknown>): ChurnInput {
  const contract = (CONTRACTS as readonly string[]).includes(String(body.contract))
    ? (body.contract as Contract)
    : "Month-to-month";
  const internetService = (INTERNET as readonly string[]).includes(String(body.internetService))
    ? (body.internetService as Internet)
    : "Fiber optic";
  const paymentMethod = (PAYMENTS as readonly string[]).includes(String(body.paymentMethod))
    ? (body.paymentMethod as Payment)
    : "Electronic check";
  return {
    tenure: Math.max(0, Math.min(72, Math.round(Number(body.tenure ?? 6)))),
    monthlyCharges:
      Math.round(Math.max(18.25, Math.min(118.75, Number(body.monthlyCharges ?? 79))) * 100) / 100,
    contract,
    internetService,
    paymentMethod,
    paperlessBilling: bool(body.paperlessBilling),
    phoneService: bool(body.phoneService),
    multipleLines: bool(body.multipleLines),
    onlineSecurity: bool(body.onlineSecurity),
    onlineBackup: bool(body.onlineBackup),
    deviceProtection: bool(body.deviceProtection),
    techSupport: bool(body.techSupport),
    streamingTv: bool(body.streamingTv),
    streamingMovies: bool(body.streamingMovies),
    seniorCitizen: bool(body.seniorCitizen),
    partner: bool(body.partner),
    dependents: bool(body.dependents),
  };
}

type Counterfactual = { label: string; probability: number; delta: number; note: string };

/** "what would actually move the needle" — each lever re-scored by the model */
function buildCounterfactuals(input: ChurnInput, current: number): Counterfactual[] {
  const levers: { label: string; note: string; patch: Partial<ChurnInput> }[] = [
    {
      label: "Move to a one-year contract",
      note: "Retention marketing · 20% first-year discount",
      patch: { contract: "One year" },
    },
    {
      label: "Move to a two-year contract",
      note: "Strongest structural lever in the dataset",
      patch: { contract: "Two year" },
    },
    {
      label: "Add TechSupport + OnlineSecurity",
      note: "Free 60-day trial, then $10/mo bundle",
      patch: { techSupport: true, onlineSecurity: true },
    },
    {
      label: "Switch to automatic card payment",
      note: "$5 bill credit to migrate off electronic check",
      patch: { paymentMethod: "Credit card (automatic)" },
    },
    {
      label: "Retention discount: −15% on the bill",
      note: "Price-to-value correction",
      patch: { monthlyCharges: Math.max(18.25, Math.round(input.monthlyCharges * 0.85 * 100) / 100) },
    },
  ];

  return levers
    .map((l) => {
      const p = predictProbability({ ...input, ...l.patch });
      return {
        label: l.label,
        note: l.note,
        probability: Math.round(p * 10000) / 10000,
        delta: Math.round((p - current) * 10000) / 10000,
      };
    })
    .filter((l) => Math.abs(l.delta) > 0.0005)
    .sort((a, b) => a.delta - b.delta);
}

export async function POST(request: Request) {
  const started = performance.now();
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const input = parse(body);
  const probability = predictProbability(input);
  const { base, drivers } = explain(input);
  const band = riskBand(probability);
  const actions = recommendations(input, probability);
  const retainable = actions.reduce((s, a) => s + a.lift, 0);
  const revenueAtRisk = Math.round(input.monthlyCharges * probability * 18);

  const counterfactuals = buildCounterfactuals(input, probability);

  const payload = {
    probability: Math.round(probability * 10000) / 10000,
    baseline: Math.round(base * 10000) / 10000,
    band,
    drivers: drivers.slice(0, 8),
    actions,
    counterfactuals,
    serviceCount: serviceCount(input),
    revenueAtRisk,
    projectedSave: Math.round(input.monthlyCharges * Math.min(0.6, retainable) * 18),
    latencyMs: Math.round((performance.now() - started) * 100) / 100,
    input,
  };

  try {
    await db.insert(predictions).values({
      probability: payload.probability,
      band,
      revenueAtRisk,
      features: input as unknown as Record<string, string | number | boolean>,
      drivers: drivers.slice(0, 5).map((d) => ({ label: d.label, value: d.value })),
    });
  } catch {
    /* scoring must never fail because of a logging write */
  }

  return Response.json(payload);
}

export async function GET() {
  try {
    const rows = await db
      .select({
        id: predictions.id,
        probability: predictions.probability,
        band: predictions.band,
        revenueAtRisk: predictions.revenueAtRisk,
        createdAt: predictions.createdAt,
        features: predictions.features,
      })
      .from(predictions)
      .orderBy(desc(predictions.id))
      .limit(8);
    return Response.json({ rows });
  } catch {
    return Response.json({ rows: [] });
  }
}
