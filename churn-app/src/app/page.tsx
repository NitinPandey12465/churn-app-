import Link from "next/link";
import { BarSeries, Legend, LineChart, Panel } from "@/components/charts";
import { Hero, type FeedItem } from "@/components/home/hero";
import { AudienceTabs, RoiSimulator } from "@/components/home/interactive";
import { GlassCard, KpiTile, Reveal, SectionHeading, Tag } from "@/components/ui";
import {
  byContract,
  fmtMoney,
  fmtPct,
  globalShap,
  headlineCohort,
  kpis,
  rocCurve,
  survivalByContract,
} from "@/lib/analytics";
import { riskBand } from "@/lib/churn";
import { loadCustomers } from "@/lib/store";

export const dynamic = "force-dynamic";

const STACK = [
  "Python",
  "pandas",
  "NumPy",
  "PostgreSQL",
  "SQL",
  "scikit-learn",
  "XGBoost",
  "SHAP",
  "Lifelines",
  "Kaplan-Meier",
  "Power BI",
  "DAX",
  "Next.js",
  "TypeScript",
  "Drizzle ORM",
  "Tailwind",
];

const PIPELINE = [
  { n: "01", t: "Ingest", d: "IBM Telco — 7,043 customers × 21 features", tag: "Kaggle CSV" },
  { n: "02", t: "Clean", d: "TotalCharges coercion, null repair, type casting", tag: "pandas" },
  { n: "03", t: "Model the data", d: "4-table normalized star schema + SQL analytics", tag: "PostgreSQL" },
  { n: "04", t: "Engineer features", d: "tenure bands, service_count, support flags", tag: "NumPy" },
  { n: "05", t: "Train & tune", d: "LogReg vs RF vs XGBoost, threshold sweep", tag: "scikit-learn" },
  { n: "06", t: "Explain", d: "SHAP contributions + Kaplan-Meier survival", tag: "SHAP · lifelines" },
  { n: "07", t: "Ship", d: "This app + a 4-page executive dashboard", tag: "Next.js · Power BI" },
];

const PLAYS = [
  {
    title: "Contract upgrade campaign",
    target: "3,875 month-to-month customers",
    action: "20% discount to switch to annual at the 3-month tenure mark",
    impact: "Churn 42% → ~15%",
    revenue: 45000,
    tone: "cyan" as const,
  },
  {
    title: "Fiber optic onboarding fix",
    target: "New fiber customers, tenure < 12 months",
    action: "Dedicated onboarding call at day 7 + 30-day check-in",
    impact: "Early fiber churn −20%",
    revenue: 10000,
    tone: "violet" as const,
  },
  {
    title: "Support services trial",
    target: "Customers without TechSupport / OnlineSecurity",
    action: "Free 60-day OnlineSecurity trial inside the first 6 months",
    impact: "Churn −8% in cohort",
    revenue: 5000,
    tone: "emerald" as const,
  },
];

export default async function HomePage() {
  const snap = await loadCustomers();
  const rows = snap.rows;
  const k = kpis(rows);
  const contracts = byContract(rows);
  const headline = headlineCohort(rows);
  const survival = survivalByContract(rows);
  const shap = globalShap(rows, 6);
  const { auc } = rocCurve(rows);

  const feed: FeedItem[] = [...rows]
    .filter((r) => !r.churn)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 40)
    .filter((_, i) => i % 2 === 0)
    .map((r) => ({
      id: r.customerId,
      risk: r.riskScore,
      band: riskBand(r.riskScore),
      contract: r.contract,
      tenure: r.tenure,
      mrr: r.monthlyCharges,
    }));

  return (
    <>
      <Hero
        feed={feed}
        churnRate={k.churnRate}
        revenueAtRisk={k.revenueAtRisk}
        customers={k.customers}
        headlineRate={headline.rate}
      />

      {/* marquee */}
      <div className="relative overflow-hidden border-y border-sky-200/60 bg-white/60 py-4">
        <div className="animate-marquee flex w-max gap-10">
          {[...STACK, ...STACK].map((s, i) => (
            <span
              key={`${s}-${i}`}
              className="flex items-center gap-10 font-mono text-[11px] uppercase tracking-[0.28em] text-slate-500"
            >
              {s}
              <span className="text-sky-400">❄</span>
            </span>
          ))}
        </div>
      </div>

      {/* live KPIs */}
      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <SectionHeading
            eyebrow="live from postgres"
            title={
              <>
                The book of business,{" "}
                <span className="grad-text">scored in real time</span>
              </>
            }
            sub="Every figure below is computed on request from the customer table — no static screenshots, no hardcoded numbers."
          />
          <div className="flex items-center gap-2">
            <Tag tone={snap.source === "postgres" ? "emerald" : "amber"}>
              source: {snap.source}
            </Tag>
            <Tag tone="cyan">{k.customers.toLocaleString("en-US")} rows</Tag>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile
            label="overall churn rate"
            value={fmtPct(k.churnRate)}
            hint={`${k.churned.toLocaleString("en-US")} of ${k.customers.toLocaleString("en-US")} customers lost`}
            accent="rose"
          />
          <KpiTile
            label="monthly revenue at risk"
            value={fmtMoney(k.revenueAtRisk)}
            hint={`${k.highRisk.toLocaleString("en-US")} active customers above the tuned 0.35 cut-off`}
            accent="amber"
            delay={80}
          />
          <KpiTile
            label="model AUC-ROC"
            value={auc.toFixed(3)}
            hint="Recomputed from live scores vs. observed churn labels"
            accent="cyan"
            delay={160}
          />
          <KpiTile
            label="tenure gap"
            value={`${k.avgTenureChurned} vs ${k.avgTenureRetained} mo`}
            hint="Average tenure of churned vs retained customers"
            accent="violet"
            delay={240}
          />
        </div>

        {/* headline finding */}
        <Reveal delay={120}>
          <div className="mt-6 overflow-hidden rounded-3xl border border-rose-300/70 bg-gradient-to-r from-rose-100/80 via-violet-200/45 to-transparent p-7 sm:p-9">
            <div className="flex flex-wrap items-center gap-3">
              <Tag tone="rose">headline finding</Tag>
              <span className="mono-label text-[9px]">cohort intersection analysis</span>
            </div>
            <p className="mt-5 max-w-4xl text-2xl font-semibold leading-snug tracking-tight text-slate-800 sm:text-3xl">
              Month-to-month <span className="text-rose-600">+</span> fiber optic{" "}
              <span className="text-rose-600">+</span> tenure under 12 months churn at{" "}
              <span className="grad-text">{fmtPct(headline.rate)}</span> — {headline.multiple}× the
              company average.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
              {[
                { k: "cohort size", v: `${headline.size.toLocaleString("en-US")} customers` },
                { k: "monthly revenue exposed", v: fmtMoney(headline.monthlyRevenueAtRisk) },
                { k: "vs company average", v: `${headline.multiple}×` },
                { k: "recommended play", v: "Contract upgrade + onboarding rescue" },
              ].map((s) => (
                <div key={s.k}>
                  <p className="mono-label text-[9px]">{s.k}</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-slate-800">{s.v}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* audience */}
      <section className="mx-auto max-w-7xl px-5 pb-20">
        <SectionHeading
          eyebrow="built for four rooms"
          title={
            <>
              Same product, <span className="grad-text">four different questions</span>
            </>
          }
          sub="Executives ask what it saves. HR asks how it was built. Recruiters ask what it proves. Engineers ask if the math holds. Pick your lens."
          align="center"
        />
        <Reveal className="mt-10">
          <AudienceTabs />
        </Reveal>
      </section>

      {/* pipeline */}
      <section className="mx-auto max-w-7xl px-5 pb-20">
        <SectionHeading
          eyebrow="architecture"
          title={
            <>
              Seven stages, <span className="grad-text">one reproducible pipeline</span>
            </>
          }
          sub="Raw CSV to a deployed decision product. Each stage is versioned, tested and re-runnable end to end."
        />
        <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {PIPELINE.map((step, i) => (
            <Reveal key={step.n} delay={i * 70}>
              <GlassCard className="group h-full p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-sky-600">{step.n}</span>
                  <span className="rounded-full border border-sky-200/70 bg-white/70 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-slate-500">
                    {step.tag}
                  </span>
                </div>
                <p className="mt-4 text-[15px] font-semibold text-slate-800">{step.t}</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500">{step.d}</p>
                <div className="mt-4 h-px w-full bg-gradient-to-r from-sky-400/70 via-indigo-300/60 to-transparent opacity-60 transition-opacity group-hover:opacity-100" />
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* analytics preview */}
      <section className="mx-auto max-w-7xl px-5 pb-20">
        <SectionHeading
          eyebrow="evidence"
          title={
            <>
              The three charts that <span className="grad-text">changed the roadmap</span>
            </>
          }
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <Reveal>
            <Panel
              title="Churn rate by contract"
              subtitle="Contract type is the single strongest structural lever."
              className="h-full"
            >
              <BarSeries
                data={contracts.map((c) => ({
                  label: c.label,
                  value: c.rate,
                  caption: `${c.total.toLocaleString("en-US")} customers · ${fmtMoney(c.mrr)} MRR`,
                }))}
              />
            </Panel>
          </Reveal>
          <Reveal delay={100}>
            <Panel
              title="Kaplan-Meier survival"
              subtitle={`Median survival: ${survival[0]?.median ?? ">72"} months on month-to-month vs beyond the 72-month window on two-year.`}
              className="h-full"
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
                height={230}
              />
              <div className="mt-3">
                <Legend
                  items={survival.map((s) => ({
                    label: s.label,
                    color: s.color,
                    extra: s.median ? `median ${s.median}mo` : "median >72mo",
                  }))}
                />
              </div>
            </Panel>
          </Reveal>
          <Reveal delay={200}>
            <Panel
              title="Global SHAP importance"
              subtitle="Mean |φ| across the population — exact for a linear model."
              className="h-full"
            >
              <BarSeries
                data={shap.map((s) => ({
                  label: s.label,
                  value: s.importance,
                  caption: s.direction > 0 ? "increases churn risk" : "protects against churn",
                  color:
                    s.direction > 0
                      ? "linear-gradient(90deg,#e11d48,#be123c)"
                      : "linear-gradient(90deg,#059669,#047857)",
                }))}
                format={(v) => v.toFixed(3)}
              />
            </Panel>
          </Reveal>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/insights"
            className="rounded-xl border border-sky-300/70 bg-white/75 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-sky-400/80"
          >
            Full model lab — ROC, threshold tuner, survival →
          </Link>
          <Link
            href="/customers"
            className="rounded-xl border border-sky-300/70 bg-white/75 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-sky-400/80"
          >
            Browse the scored customer base →
          </Link>
        </div>
      </section>

      {/* ROI */}
      <section className="mx-auto max-w-7xl px-5 pb-20">
        <SectionHeading
          eyebrow="business case"
          title={
            <>
              What does this <span className="grad-text">actually save you?</span>
            </>
          }
          sub="Drag the sliders. The math is the same one used to size the retention program in the original study."
        />
        <Reveal className="mt-10">
          <RoiSimulator defaultArpu={Math.round(k.avgMonthly)} />
        </Reveal>
      </section>

      {/* plays */}
      <section className="mx-auto max-w-7xl px-5 pb-20">
        <SectionHeading
          eyebrow="prescription"
          title={
            <>
              Three plays, <span className="grad-text">$60,000 protected monthly</span>
            </>
          }
          sub="A prediction that doesn't end in an action is a hobby. Each play names the target cohort, the intervention, the expected lift and the revenue protected."
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {PLAYS.map((p, i) => (
            <Reveal key={p.title} delay={i * 100}>
              <GlassCard className="h-full p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold tracking-tight text-slate-800">{p.title}</h3>
                  <Tag tone={p.tone}>{`0${i + 1}`}</Tag>
                </div>
                <dl className="mt-5 space-y-3 text-[13px]">
                  <div>
                    <dt className="mono-label text-[9px]">target</dt>
                    <dd className="mt-0.5 text-slate-600">{p.target}</dd>
                  </div>
                  <div>
                    <dt className="mono-label text-[9px]">action</dt>
                    <dd className="mt-0.5 text-slate-600">{p.action}</dd>
                  </div>
                  <div>
                    <dt className="mono-label text-[9px]">expected impact</dt>
                    <dd className="mt-0.5 text-slate-600">{p.impact}</dd>
                  </div>
                </dl>
                <div className="mt-6 border-t border-sky-200/70 pt-4">
                  <p className="mono-label text-[9px]">revenue protected / month</p>
                  <p className="mt-1 bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text font-mono text-2xl font-bold text-transparent">
                    {fmtMoney(p.revenue)}
                  </p>
                </div>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 pb-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-sky-200/70 bg-gradient-to-br from-sky-200/60 via-indigo-200/45 to-transparent p-9 text-center sm:p-14">
            <div className="animate-float pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-sky-200 blur-3xl" />
            <div className="animate-drift pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-indigo-200/50 blur-3xl" />
            <p className="mono-label relative">next step</p>
            <h2 className="relative mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">
              Hiring for data science, analytics or ML engineering?
            </h2>
            <p className="relative mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-600">
              This entire platform — schema, model, explainability layer, API and interface — was
              designed and shipped by one person. The recruiter and HR pack has the skills matrix,
              delivery timeline and a direct line.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/hire"
                className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-7 py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Open the hiring pack
              </Link>
              <Link
                href="/predict"
                className="rounded-xl border border-sky-300/70 bg-white/80 px-7 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-sky-400/80"
              >
                Try the live scorer
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
