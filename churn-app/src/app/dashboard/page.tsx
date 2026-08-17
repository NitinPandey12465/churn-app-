import type { Metadata } from "next";
import Link from "next/link";
import { BarSeries, Donut, Heatmap, Legend, LineChart, Panel } from "@/components/charts";
import { KpiTile, LiveDot, Reveal, Tag } from "@/components/ui";
import {
  TENURE_BUCKETS,
  byContract,
  byInternet,
  byPayment,
  byTenure,
  cohortHeatmap,
  fmtMoney,
  fmtPct,
  headlineCohort,
  kpis,
  survivalByContract,
} from "@/lib/analytics";
import { riskBand, BAND_STYLES } from "@/lib/churn";
import { loadCustomers } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Command Center",
  description:
    "Executive churn dashboard: revenue at risk, cohort heatmap, survival curves and the ranked save-list — computed live from PostgreSQL.",
};

export default async function DashboardPage() {
  const snap = await loadCustomers();
  const rows = snap.rows;
  const k = kpis(rows);
  const contracts = byContract(rows);
  const internet = byInternet(rows);
  const payment = byPayment(rows);
  const tenure = byTenure(rows);
  const heat = cohortHeatmap(rows);
  const headline = headlineCohort(rows);
  const survival = survivalByContract(rows);

  const saveList = [...rows]
    .filter((r) => !r.churn)
    .sort((a, b) => b.riskScore * b.monthlyCharges - a.riskScore * a.monthlyCharges)
    .slice(0, 8);

  const m2m = contracts.find((c) => c.label === "Month-to-month");
  const twoYear = contracts.find((c) => c.label === "Two year");

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="mono-label">executive command center</span>
            <LiveDot label={snap.source} />
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">
            Retention <span className="grad-text">P&amp;L control room</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
            {k.customers.toLocaleString("en-US")} subscribers aggregated in {snap.ms}ms. Churn,
            cohort and revenue metrics recomputed on every request.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Tag tone="cyan">refreshed {new Date().toUTCString().slice(17, 25)} UTC</Tag>
          <Link
            href="/customers"
            className="rounded-lg border border-sky-300/70 bg-white/75 px-4 py-2 text-[13px] font-semibold text-slate-800 transition hover:border-sky-400/80"
          >
            Open Customer 360 →
          </Link>
        </div>
      </header>

      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiTile label="customers" value={k.customers.toLocaleString("en-US")} accent="cyan" />
        <KpiTile label="churn rate" value={fmtPct(k.churnRate)} accent="rose" delay={60} />
        <KpiTile label="total MRR" value={fmtMoney(k.mrr)} accent="violet" delay={120} />
        <KpiTile label="MRR at risk" value={fmtMoney(k.revenueAtRisk)} accent="amber" delay={180} />
        <KpiTile
          label="high-risk accounts"
          value={k.highRisk.toLocaleString("en-US")}
          accent="rose"
          delay={240}
        />
        <KpiTile label="LTV exposed" value={fmtMoney(k.clvAtRisk)} accent="emerald" delay={300} />
      </div>

      <Reveal delay={80}>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Panel
            title="Cohort risk heatmap"
            subtitle="Churn rate by contract type × tenure band. The top-left block is where the money leaks."
          >
            <Heatmap
              cells={heat}
              rows={["Month-to-month", "One year", "Two year"]}
              cols={TENURE_BUCKETS}
            />
            <p className="mt-4 text-[12px] leading-relaxed text-slate-500">
              The 0–6 month / month-to-month block is the highest-risk window in the entire book —
              intervention must happen before day 90, not at renewal.
            </p>
          </Panel>

          <Panel
            title="Churn composition"
            subtitle="Where the churn volume actually sits."
            className="flex flex-col justify-between"
          >
            <div className="space-y-6">
              <Donut
                value={k.churnRate}
                label="Overall churn rate"
                caption={`${k.churned.toLocaleString("en-US")} customers lost`}
                color="#be123c"
              />
              <Donut
                value={m2m ? m2m.rate : 0}
                label="Month-to-month churn"
                caption={`${(m2m?.total ?? 0).toLocaleString("en-US")} customers on rolling contracts`}
                color="#ea580c"
              />
              <Donut
                value={twoYear ? twoYear.rate : 0}
                label="Two-year churn"
                caption="Contract length is the strongest structural defence"
                color="#059669"
              />
            </div>
          </Panel>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Panel title="By contract" subtitle="Churn rate and MRR exposure">
            <BarSeries
              data={contracts.map((c) => ({
                label: c.label,
                value: c.rate,
                caption: `${fmtMoney(c.atRisk)} MRR flagged at risk`,
              }))}
            />
          </Panel>
          <Panel title="By internet service" subtitle="Fiber pays the most and leaves the fastest">
            <BarSeries
              data={internet.map((c) => ({
                label: c.label,
                value: c.rate,
                caption: `${c.total.toLocaleString("en-US")} customers · avg bill ${fmtMoney(
                  c.mrr / Math.max(1, c.total),
                )}`,
              }))}
            />
          </Panel>
          <Panel title="By payment method" subtitle="Friction in billing predicts attrition">
            <BarSeries
              data={payment.map((c) => ({
                label: c.label,
                value: c.rate,
                caption: `${c.total.toLocaleString("en-US")} customers`,
              }))}
            />
          </Panel>
        </div>
      </Reveal>

      <Reveal delay={160}>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Panel
            title="Tenure cohort decay"
            subtitle="Churn rate by tenure band — the first 6 months are decisive."
          >
            <LineChart
              series={[
                {
                  label: "churn rate",
                  color: "#0284c7",
                  points: tenure.map((t, i) => ({ x: i, y: t.rate })),
                },
              ]}
              xMax={Math.max(1, tenure.length - 1)}
              yMax={Math.max(0.6, Math.max(...tenure.map((t) => t.rate)) * 1.15)}
              xTickFormat={(v) => tenure[Math.round(v)]?.label ?? ""}
              xLabel="tenure band (months)"
              yLabel="churn rate"
              area
              height={240}
            />
            <div className="mt-4 grid grid-cols-5 gap-2">
              {tenure.map((t) => (
                <div key={t.label} className="rounded-lg border border-sky-200/60 bg-white/70 p-2 text-center">
                  <p className="font-mono text-[10px] text-slate-500">{t.label}mo</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-slate-800">{fmtPct(t.rate, 0)}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title="Survival by contract"
            subtitle="Kaplan-Meier estimator with right-censoring on active accounts."
          >
            <LineChart
              series={survival.map((s) => ({
                label: s.label,
                color: s.color,
                points: s.points.map((p) => ({ x: p.t, y: p.s })),
              }))}
              xMax={72}
              xLabel="tenure (months)"
              yLabel="survival probability"
              height={240}
            />
            <div className="mt-4">
              <Legend
                items={survival.map((s) => ({
                  label: s.label,
                  color: s.color,
                  extra: s.median ? `median ${s.median}mo` : "median >72mo",
                }))}
              />
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-slate-500">
              Log-rank test in the original study confirms contract type has a statistically
              significant effect on survival (p &lt; 0.001).
            </p>
          </Panel>
        </div>
      </Reveal>

      <Reveal delay={200}>
        <Panel
          title="Priority save-list"
          subtitle="Active accounts ranked by expected revenue loss = risk × monthly charge."
          className="mt-4"
          action={<Tag tone="rose">action required</Tag>}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-sky-200/70">
                  {["Customer", "Contract", "Internet", "Tenure", "Monthly", "Risk", "Expected loss"].map(
                    (h) => (
                      <th key={h} className="pb-3 pr-4 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {saveList.map((r) => {
                  const band = riskBand(r.riskScore);
                  const style = BAND_STYLES[band];
                  return (
                    <tr key={r.customerId} className="border-b border-sky-100 transition hover:bg-sky-50">
                      <td className="py-3 pr-4 font-mono text-[12px] text-slate-600">{r.customerId}</td>
                      <td className="py-3 pr-4 text-slate-600">{r.contract}</td>
                      <td className="py-3 pr-4 text-slate-500">{r.internetService}</td>
                      <td className="py-3 pr-4 font-mono text-slate-600">{r.tenure} mo</td>
                      <td className="py-3 pr-4 font-mono text-slate-600">{fmtMoney(r.monthlyCharges, 2)}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${style.bg} ${style.text} ${style.ring}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                          {fmtPct(r.riskScore, 1)}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-mono font-semibold text-rose-600">
                        {fmtMoney(r.riskScore * r.monthlyCharges * 18)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </Reveal>

      <Reveal delay={240}>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <Panel title="Executive summary" subtitle="What a CRO should take away in 30 seconds.">
            <ul className="space-y-4 text-[13.5px] leading-relaxed text-slate-600">
              <li className="flex gap-3">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                <span>
                  <strong className="text-slate-800">Churn is structural, not random.</strong> Contract
                  type alone separates a {fmtPct(m2m?.rate ?? 0)} churn population from a{" "}
                  {fmtPct(twoYear?.rate ?? 0)} one.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>
                  <strong className="text-slate-800">The damage is front-loaded.</strong> The 0–6 month
                  band churns at {fmtPct(tenure[0]?.rate ?? 0)}; retention spend after month 12 is
                  largely wasted.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                <span>
                  <strong className="text-slate-800">Highest-value target is known.</strong>{" "}
                  {headline.size.toLocaleString("en-US")} customers in the fiber / month-to-month /
                  new-joiner intersection carry {fmtMoney(headline.monthlyRevenueAtRisk)} of monthly
                  revenue at a {fmtPct(headline.rate)} churn rate.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span>
                  <strong className="text-slate-800">Interventions pay for themselves.</strong> Three
                  costed plays protect roughly $60,000 of MRR while the model surfaces 75.7% of
                  churners before they leave.
                </span>
              </li>
            </ul>
          </Panel>

          <Panel title="Revenue exposure ladder" subtitle="From total book to actionable pipeline.">
            <div className="space-y-3">
              {[
                { label: "Total monthly recurring revenue", v: k.mrr, tone: "#0284c7" },
                { label: "MRR on month-to-month contracts", v: m2m?.mrr ?? 0, tone: "#6366f1" },
                { label: "MRR flagged at risk (score ≥ 0.35)", v: k.revenueAtRisk, tone: "#d97706" },
                {
                  label: "MRR in the headline cohort",
                  v: headline.monthlyRevenueAtRisk,
                  tone: "#e11d48",
                },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13px] text-slate-600">{row.label}</span>
                    <span className="font-mono text-[13px] font-semibold text-slate-800">
                      {fmtMoney(row.v)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-sky-100/80">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(3, (row.v / Math.max(1, k.mrr)) * 100)}%`,
                        background: `linear-gradient(90deg, ${row.tone}, ${row.tone}55)`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[12px] leading-relaxed text-slate-500">
              Assumes an 18-month remaining lifetime for retained accounts when converting MRR
              exposure into lifetime value.
            </p>
          </Panel>
        </div>
      </Reveal>
    </div>
  );
}
