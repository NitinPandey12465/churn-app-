import {
  byContract,
  byInternet,
  byPayment,
  byTenure,
  cohortHeatmap,
  headlineCohort,
  kpis,
} from "@/lib/analytics";
import { loadCustomers } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await loadCustomers();
  const rows = snap.rows;
  return Response.json({
    source: snap.source,
    queryMs: snap.ms,
    kpis: kpis(rows),
    contract: byContract(rows),
    internet: byInternet(rows),
    payment: byPayment(rows),
    tenure: byTenure(rows),
    heatmap: cohortHeatmap(rows),
    headline: headlineCohort(rows),
  });
}
