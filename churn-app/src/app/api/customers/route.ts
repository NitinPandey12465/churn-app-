import { PRODUCTION_THRESHOLD, riskBand } from "@/lib/churn";
import { loadCustomers } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const contract = url.searchParams.get("contract") ?? "all";
  const internet = url.searchParams.get("internet") ?? "all";
  const band = url.searchParams.get("band") ?? "all";
  const status = url.searchParams.get("status") ?? "all";
  const sort = url.searchParams.get("sort") ?? "riskScore";
  const dir = url.searchParams.get("dir") === "asc" ? 1 : -1;
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(50, Math.max(5, Number(url.searchParams.get("pageSize") ?? 12)));

  const snap = await loadCustomers();
  let rows = snap.rows;

  if (q) rows = rows.filter((r) => r.customerId.toLowerCase().includes(q));
  if (contract !== "all") rows = rows.filter((r) => r.contract === contract);
  if (internet !== "all") rows = rows.filter((r) => r.internetService === internet);
  if (band !== "all") rows = rows.filter((r) => riskBand(r.riskScore) === band);
  if (status === "active") rows = rows.filter((r) => !r.churn);
  if (status === "churned") rows = rows.filter((r) => r.churn);

  const key = (["riskScore", "tenure", "monthlyCharges", "totalCharges"] as const).includes(
    sort as "riskScore",
  )
    ? (sort as "riskScore" | "tenure" | "monthlyCharges" | "totalCharges")
    : "riskScore";

  const sorted = [...rows].sort((a, b) => (a[key] - b[key]) * dir);
  const total = sorted.length;
  const slice = sorted.slice((page - 1) * pageSize, page * pageSize);

  return Response.json({
    source: snap.source,
    total,
    page,
    pageSize,
    pages: Math.max(1, Math.ceil(total / pageSize)),
    revenueAtRisk:
      Math.round(
        rows.filter((r) => !r.churn && r.riskScore >= PRODUCTION_THRESHOLD).reduce((s, r) => s + r.monthlyCharges, 0),
      ) * 1,
    rows: slice.map((r) => ({ ...r, band: riskBand(r.riskScore) })),
  });
}
