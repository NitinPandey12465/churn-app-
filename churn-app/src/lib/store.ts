import { sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, type NewCustomerRow } from "@/db/schema";
import { generatePopulation, type CustomerRecord } from "./churn";

type Snapshot = {
  rows: CustomerRecord[];
  source: "postgres" | "in-memory";
  loadedAt: number;
  ms: number;
};

const TTL = 4 * 60 * 1000;
/** short TTL while running on the fallback population so we re-check Postgres soon */
const FALLBACK_TTL = 20 * 1000;

const globalCache = globalThis as typeof globalThis & {
  __churnSnapshot?: Snapshot;
  __churnSeeding?: Promise<unknown>;
};

function toRecord(r: typeof customers.$inferSelect): CustomerRecord {
  return {
    customerId: r.customerId,
    gender: r.gender,
    seniorCitizen: r.seniorCitizen,
    partner: r.partner,
    dependents: r.dependents,
    tenure: r.tenure,
    phoneService: r.phoneService,
    multipleLines: r.multipleLines,
    internetService: r.internetService as CustomerRecord["internetService"],
    onlineSecurity: r.onlineSecurity,
    onlineBackup: r.onlineBackup,
    deviceProtection: r.deviceProtection,
    techSupport: r.techSupport,
    streamingTv: r.streamingTv,
    streamingMovies: r.streamingMovies,
    contract: r.contract as CustomerRecord["contract"],
    paperlessBilling: r.paperlessBilling,
    paymentMethod: r.paymentMethod as CustomerRecord["paymentMethod"],
    monthlyCharges: r.monthlyCharges,
    totalCharges: r.totalCharges,
    churn: r.churn,
    riskScore: r.riskScore,
  };
}

/**
 * Loads the scored customer base. Postgres is the source of truth; if the
 * database is unreachable (e.g. a preview deploy without DATABASE_URL) the
 * app degrades gracefully to the deterministic in-memory population so every
 * chart still renders.
 */
export async function loadCustomers(): Promise<Snapshot> {
  const cached = globalCache.__churnSnapshot;
  const ttl = cached?.source === "in-memory" ? FALLBACK_TTL : TTL;
  if (cached && Date.now() - cached.loadedAt < ttl) return cached;

  const started = Date.now();
  try {
    const rows = await db.select().from(customers);
    if (rows.length === 0 && !globalCache.__churnSeeding) {
      // first boot (fresh Vercel/Neon deploy): materialise the dataset in the
      // background and serve the deterministic population for this request
      globalCache.__churnSeeding = seedCustomers().catch(() => undefined);
    }
    if (rows.length > 0) {
      const snap: Snapshot = {
        rows: rows.map(toRecord),
        source: "postgres",
        loadedAt: Date.now(),
        ms: Date.now() - started,
      };
      globalCache.__churnSnapshot = snap;
      return snap;
    }
  } catch {
    /* fall through to synthetic population */
  }

  const snap: Snapshot = {
    rows: generatePopulation(),
    source: "in-memory",
    loadedAt: Date.now(),
    ms: Date.now() - started,
  };
  globalCache.__churnSnapshot = snap;
  return snap;
}

export function invalidateSnapshot() {
  globalCache.__churnSnapshot = undefined;
  globalCache.__churnSeeding = undefined;
}

export async function seedCustomers(force = false) {
  const existing = await db.execute<{ count: string }>(sql`select count(*)::text as count from customers`);
  const count = Number(existing.rows?.[0]?.count ?? 0);
  if (count > 0 && !force) return { inserted: 0, skipped: true, total: count };

  if (force) await db.execute(sql`truncate table customers restart identity`);

  const population = generatePopulation();
  const payload: NewCustomerRow[] = population.map((r) => ({
    customerId: r.customerId,
    gender: r.gender,
    seniorCitizen: r.seniorCitizen,
    partner: r.partner,
    dependents: r.dependents,
    tenure: r.tenure,
    phoneService: r.phoneService,
    multipleLines: r.multipleLines,
    internetService: r.internetService,
    onlineSecurity: r.onlineSecurity,
    onlineBackup: r.onlineBackup,
    deviceProtection: r.deviceProtection,
    techSupport: r.techSupport,
    streamingTv: r.streamingTv,
    streamingMovies: r.streamingMovies,
    contract: r.contract,
    paperlessBilling: r.paperlessBilling,
    paymentMethod: r.paymentMethod,
    monthlyCharges: r.monthlyCharges,
    totalCharges: r.totalCharges,
    churn: r.churn,
    riskScore: r.riskScore,
  }));

  for (let i = 0; i < payload.length; i += 500) {
    await db.insert(customers).values(payload.slice(i, i + 500)).onConflictDoNothing();
  }
  invalidateSnapshot();
  return { inserted: payload.length, skipped: false, total: payload.length };
}
