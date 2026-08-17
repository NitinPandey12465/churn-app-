import type { Metadata } from "next";
import { Explorer } from "@/components/customers/explorer";
import { Tag } from "@/components/ui";
import { fmtMoney, kpis } from "@/lib/analytics";
import { loadCustomers } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Customer 360",
  description:
    "Search, filter and inspect every scored subscriber. Each account opens a live SHAP explanation and a ranked list of retention levers.",
};

export default async function CustomersPage() {
  const snap = await loadCustomers();
  const k = kpis(snap.rows);

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <header className="mb-9 flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className="mono-label">customer 360</span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">
            Every account, <span className="grad-text">ranked by what it costs to lose</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
            {k.customers.toLocaleString("en-US")} subscribers · {k.highRisk.toLocaleString("en-US")}{" "}
            flagged high-risk · {fmtMoney(k.revenueAtRisk)} of monthly recurring revenue exposed.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Tag tone="rose">Critical ≥ 70%</Tag>
          <Tag tone="amber">High ≥ 50%</Tag>
          <Tag tone="cyan">Watch ≥ 30%</Tag>
          <Tag tone="emerald">Stable &lt; 30%</Tag>
        </div>
      </header>
      <Explorer />
    </div>
  );
}
