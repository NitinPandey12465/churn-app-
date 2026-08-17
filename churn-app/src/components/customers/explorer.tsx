"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Panel, ShapWaterfall } from "@/components/charts";
import { LiveDot, Skeleton, Tag } from "@/components/ui";
import { BAND_STYLES, type ChurnInput, type RiskBand } from "@/lib/churn";

type Row = ChurnInput & {
  customerId: string;
  gender: string;
  totalCharges: number;
  churn: boolean;
  riskScore: number;
  band: RiskBand;
};

type ApiResponse = {
  source: string;
  total: number;
  page: number;
  pages: number;
  rows: Row[];
  revenueAtRisk: number;
};

type Detail = {
  probability: number;
  band: string;
  drivers: { label: string; value: number }[];
  actions: { title: string; detail: string; lift: number; owner: string }[];
  counterfactuals: { label: string; probability: number; delta: number }[];
  revenueAtRisk: number;
};

const money = (v: number) => `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const SELECTS = [
  {
    key: "contract",
    label: "contract",
    options: ["all", "Month-to-month", "One year", "Two year"],
  },
  { key: "internet", label: "internet", options: ["all", "DSL", "Fiber optic", "No"] },
  { key: "band", label: "risk band", options: ["all", "Critical", "High", "Watch", "Stable"] },
  { key: "status", label: "status", options: ["all", "active", "churned"] },
] as const;

export function Explorer() {
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({
    contract: "all",
    internet: "all",
    band: "all",
    status: "active",
  });
  const [sort, setSort] = useState("riskScore");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Row | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);

  const query = useMemo(() => {
    const p = new URLSearchParams({ ...filters, sort, dir, page: String(page), pageSize: "12" });
    if (q) p.set("q", q);
    return p.toString();
  }, [filters, sort, dir, page, q]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const id = setTimeout(async () => {
      const res = await fetch(`/api/customers?${query}`);
      const json = (await res.json()) as ApiResponse;
      if (alive) {
        setData(json);
        setLoading(false);
      }
    }, 200);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [query]);

  const openRow = useCallback(async (row: Row) => {
    setSelected(row);
    setDetail(null);
    const res = await fetch("/api/predict", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(row),
    });
    setDetail((await res.json()) as Detail);
  }, []);

  const toggleSort = (key: string) => {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir("desc");
    }
    setPage(1);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <Panel
          title="Filters"
          subtitle="Slice the book by contract, connectivity, risk band or lifecycle status."
          action={<LiveDot label={data?.source ?? "loading"} />}
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block sm:col-span-2 lg:col-span-1">
              <span className="mono-label text-[10px]">search customer id</span>
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="e.g. 4821-K"
                className="mt-2 w-full rounded-lg border border-sky-200/70 bg-white/70 px-3 py-2.5 font-mono text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-sky-500/70 focus:outline-none"
              />
            </label>
            {SELECTS.map((s) => (
              <label key={s.key} className="block">
                <span className="mono-label text-[10px]">{s.label}</span>
                <select
                  value={filters[s.key]}
                  onChange={(e) => {
                    setFilters((f) => ({ ...f, [s.key]: e.target.value }));
                    setPage(1);
                  }}
                  className="mt-2 w-full rounded-lg border border-sky-200/70 bg-white/70 px-3 py-2.5 text-[13px] text-slate-800 focus:border-sky-500/70 focus:outline-none"
                >
                  {s.options.map((o) => (
                    <option key={o} value={o} className="bg-white">
                      {o}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-sky-200/70 pt-4">
            <Tag tone="cyan">{(data?.total ?? 0).toLocaleString("en-US")} matches</Tag>
            <Tag tone="amber">{money(data?.revenueAtRisk ?? 0)} MRR at risk in selection</Tag>
          </div>
        </Panel>

        <Panel
          title="Scored customer base"
          subtitle="Click any row to open its live explanation."
          action={
            <div className="flex gap-1.5">
              {[
                { k: "riskScore", l: "risk" },
                { k: "monthlyCharges", l: "bill" },
                { k: "tenure", l: "tenure" },
              ].map((s) => (
                <button
                  key={s.k}
                  type="button"
                  onClick={() => toggleSort(s.k)}
                  className={`rounded-lg border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest transition ${
                    sort === s.k
                      ? "border-sky-400/70 bg-sky-100/80 text-sky-700"
                      : "border-sky-200/70 text-slate-500 hover:text-sky-800"
                  }`}
                >
                  {s.l} {sort === s.k ? (dir === "asc" ? "↑" : "↓") : ""}
                </button>
              ))}
            </div>
          }
        >
          {loading && !data ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-sky-200/70">
                    {["Customer", "Contract", "Tenure", "Monthly", "Lifetime", "Risk"].map((h) => (
                      <th
                        key={h}
                        className="pb-3 pr-4 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.rows ?? []).map((r) => {
                    const style = BAND_STYLES[r.band];
                    const active = selected?.customerId === r.customerId;
                    return (
                      <tr
                        key={r.customerId}
                        onClick={() => openRow(r)}
                        className={`cursor-pointer border-b border-sky-100 transition hover:bg-sky-50 ${
                          active ? "bg-sky-100/70" : ""
                        }`}
                      >
                        <td className="py-3 pr-4">
                          <span className="font-mono text-[12px] text-slate-700">{r.customerId}</span>
                          <span className="mt-0.5 block text-[11px] text-slate-500">
                            {r.internetService} · {r.paymentMethod.replace(" (automatic)", " auto")}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-[12.5px] text-slate-600">{r.contract}</td>
                        <td className="py-3 pr-4 font-mono text-[12.5px] text-slate-600">{r.tenure}mo</td>
                        <td className="py-3 pr-4 font-mono text-[12.5px] text-slate-600">
                          ${r.monthlyCharges.toFixed(2)}
                        </td>
                        <td className="py-3 pr-4 font-mono text-[12.5px] text-slate-500">
                          {money(r.totalCharges)}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-14 overflow-hidden rounded-full bg-sky-100">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-sky-500 via-amber-400 to-rose-500"
                                style={{ width: `${Math.max(5, r.riskScore * 100)}%` }}
                              />
                            </div>
                            <span
                              className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ring-1 ${style.bg} ${style.text} ${style.ring}`}
                            >
                              {(r.riskScore * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-sky-200/70 px-4 py-2 text-[12.5px] text-slate-600 transition enabled:hover:border-sky-400/80 disabled:opacity-30"
            >
              ← Previous
            </button>
            <span className="font-mono text-[11px] text-slate-500">
              page {data?.page ?? 1} / {data?.pages ?? 1}
            </span>
            <button
              type="button"
              disabled={(data?.page ?? 1) >= (data?.pages ?? 1)}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-sky-200/70 px-4 py-2 text-[12.5px] text-slate-600 transition enabled:hover:border-sky-400/80 disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </Panel>
      </div>

      {/* ------------------------------ drawer ------------------------------ */}
      <div className="xl:sticky xl:top-20 xl:self-start">
        <Panel
          title={selected ? `Account ${selected.customerId}` : "Account inspector"}
          subtitle={
            selected
              ? `${selected.contract} · ${selected.internetService} · ${selected.tenure} months tenure`
              : "Select a customer from the table to generate a live explanation."
          }
          action={selected ? <Tag tone={selected.churn ? "rose" : "emerald"}>{selected.churn ? "churned" : "active"}</Tag> : undefined}
        >
          {!selected && (
            <div className="grid place-items-center rounded-2xl border border-dashed border-sky-200/70 py-16 text-center">
              <div>
                <p className="text-4xl">◎</p>
                <p className="mt-3 text-sm text-slate-500">No account selected</p>
                <p className="mt-1 text-[12px] text-slate-500">
                  The inspector runs the model on demand and returns SHAP attributions.
                </p>
              </div>
            </div>
          )}

          {selected && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { k: "risk score", v: `${(selected.riskScore * 100).toFixed(1)}%` },
                  { k: "monthly charge", v: `$${selected.monthlyCharges.toFixed(2)}` },
                  { k: "lifetime billed", v: money(selected.totalCharges) },
                  {
                    k: "18-mo exposure",
                    v: money(selected.riskScore * selected.monthlyCharges * 18),
                  },
                ].map((s) => (
                  <div key={s.k} className="rounded-xl border border-sky-200/60 bg-white/70 p-3">
                    <p className="mono-label text-[9px]">{s.k}</p>
                    <p className="mt-1 font-mono text-base font-semibold text-slate-800">{s.v}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  ["Phone", selected.phoneService],
                  ["Multi-line", selected.multipleLines],
                  ["Security", selected.onlineSecurity],
                  ["Backup", selected.onlineBackup],
                  ["Protection", selected.deviceProtection],
                  ["Support", selected.techSupport],
                  ["TV", selected.streamingTv],
                  ["Movies", selected.streamingMovies],
                  ["Paperless", selected.paperlessBilling],
                  ["Partner", selected.partner],
                  ["Dependents", selected.dependents],
                  ["Senior", selected.seniorCitizen],
                ].map(([label, on]) => (
                  <span
                    key={String(label)}
                    className={`rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${
                      on
                        ? "border-emerald-300/70 bg-emerald-100/70 text-emerald-600"
                        : "border-sky-200/70 bg-white/60 text-slate-500"
                    }`}
                  >
                    {String(label)}
                  </span>
                ))}
              </div>

              {detail ? (
                <>
                  <div>
                    <p className="mono-label text-[10px]">why this score</p>
                    <div className="mt-3">
                      <ShapWaterfall drivers={detail.drivers.slice(0, 6)} />
                    </div>
                  </div>
                  <div>
                    <p className="mono-label text-[10px]">best available levers</p>
                    <div className="mt-3 space-y-2">
                      {detail.counterfactuals.slice(0, 3).map((c) => (
                        <div
                          key={c.label}
                          className="flex items-center justify-between rounded-lg border border-sky-200/60 bg-white/70 px-3 py-2"
                        >
                          <span className="text-[12.5px] text-slate-600">{c.label}</span>
                          <span
                            className={`font-mono text-[12px] font-semibold ${
                              c.delta < 0 ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {c.delta > 0 ? "+" : ""}
                            {(c.delta * 100).toFixed(1)} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mono-label text-[10px]">next best action</p>
                    <div className="mt-3 rounded-xl border border-sky-200/80 bg-sky-50/90 p-4">
                      <p className="text-[13.5px] font-semibold text-slate-800">
                        {detail.actions[0]?.title}
                      </p>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500">
                        {detail.actions[0]?.detail}
                      </p>
                      <p className="mono-label mt-2 text-[9px]">
                        owner · {detail.actions[0]?.owner}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-24 w-full" />
                </div>
              )}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
