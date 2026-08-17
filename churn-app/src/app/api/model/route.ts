import { bestThreshold, confusionAt, globalShap, rocCurve, survivalByContract } from "@/lib/analytics";
import { loadCustomers } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const threshold = Math.min(0.95, Math.max(0.05, Number(url.searchParams.get("t") ?? 0.5)));
  const snap = await loadCustomers();
  const rows = snap.rows;
  const roc = rocCurve(rows);
  return Response.json({
    source: snap.source,
    auc: roc.auc,
    roc: roc.points,
    confusion: confusionAt(rows, threshold),
    best: bestThreshold(rows),
    shap: globalShap(rows, 10),
    survival: survivalByContract(rows),
  });
}
