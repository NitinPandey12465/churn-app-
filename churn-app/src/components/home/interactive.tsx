"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Tag } from "@/components/ui";

/* ----------------------------- audience tabs ------------------------------ */

type Persona = {
  id: string;
  label: string;
  icon: string;
  headline: string;
  body: string;
  bullets: { title: string; text: string }[];
  cta: { href: string; label: string };
  accent: string;
};

const PERSONAS: Persona[] = [
  {
    id: "business",
    label: "Customer / Business",
    icon: "◎",
    accent: "from-sky-300/40",
    headline: "Know exactly which revenue is walking out the door — this month.",
    body: "Every subscriber carries a churn probability and a dollar value. The command center ranks them so retention budget goes where it compounds, not where it feels urgent.",
    bullets: [
      {
        title: "Revenue exposure quantified to the dollar",
        text: "In the source study one cohort — month-to-month + fiber + tenure under 12 months — churned at 70.2%, putting $53,178 of monthly revenue at risk. This app recomputes the same intersection live.",
      },
      {
        title: "Costed interventions, not vibes",
        text: "Three plays modelled to protect ~$60K MRR: contract upgrade, fiber onboarding rescue, support-services trial.",
      },
      {
        title: "Decision-ready in one screen",
        text: "Executive KPIs, cohort heatmap, survival curves and a ranked save-list your CRM can action tomorrow.",
      },
    ],
    cta: { href: "/dashboard", label: "Open the command center" },
  },
  {
    id: "hr",
    label: "HR / Talent",
    icon: "❖",
    accent: "from-indigo-300/40",
    headline: "Evidence of how this candidate actually works — not a bullet list.",
    body: "This product is the artifact of a full delivery cycle: framing an ambiguous business problem, negotiating scope, shipping, and communicating the result to non-technical stakeholders.",
    bullets: [
      {
        title: "Ownership end-to-end",
        text: "Data modelling, SQL, ML, explainability, BI dashboard and a production web app — one person, one coherent narrative.",
      },
      {
        title: "Communicates in outcomes",
        text: "Every metric on this site is tied to revenue or risk, then translated for an executive audience in plain language.",
      },
      {
        title: "Structured & documented",
        text: "Reproducible pipeline, typed codebase, versioned schema, health checks and graceful degradation when the DB is unavailable.",
      },
    ],
    cta: { href: "/hire#profile", label: "See the candidate profile" },
  },
  {
    id: "recruiter",
    label: "Recruiter",
    icon: "⌁",
    accent: "from-indigo-200/60",
    headline: "Screen in 60 seconds: stack, level, availability and proof.",
    body: "Data Scientist / Data Analyst / ML Engineer profiles. Python · SQL · scikit-learn · XGBoost · SHAP · Power BI · Next.js. Published NLP researcher (ICAIT 2025, IEEE Xplore).",
    bullets: [
      {
        title: "Verifiable artifacts",
        text: "Public GitHub repository, a deployed Hugging Face Space and this live application — all shipping the same model.",
      },
      {
        title: "Immediately deployable skills",
        text: "Production Postgres, feature engineering, model evaluation with threshold tuning, survival analysis and BI storytelling.",
      },
      {
        title: "Fast, direct contact",
        text: "One form. The message lands in Postgres instantly and is tagged by persona for triage.",
      },
    ],
    cta: { href: "/hire#contact", label: "Send a role brief" },
  },
  {
    id: "engineer",
    label: "Engineer",
    icon: "⌘",
    accent: "from-emerald-300/40",
    headline: "The whole thing is inspectable — model, math and APIs.",
    body: "The logistic regression runs in TypeScript at request time. Because it's linear, SHAP values are exact and computed in closed form: φⱼ = βⱼ·(xⱼ − E[xⱼ]).",
    bullets: [
      {
        title: "Real statistics, not screenshots",
        text: "ROC/AUC, F1 threshold sweep and Kaplan-Meier survival curves are recomputed from the live Postgres table on every request.",
      },
      {
        title: "Documented JSON API",
        text: "GET /api/metrics · GET /api/model?t=0.5 · GET /api/customers · POST /api/predict · POST /api/leads · GET /api/health",
      },
      {
        title: "Deploy anywhere",
        text: "Next.js App Router + Drizzle ORM. Point DATABASE_URL at Neon/Supabase, POST /api/seed, done.",
      },
    ],
    cta: { href: "/insights", label: "Enter the model lab" },
  },
];

export function AudienceTabs() {
  const [active, setActive] = useState(0);
  const p = PERSONAS[active];
  return (
    <div className="glass overflow-hidden rounded-3xl">
      <div className="flex flex-wrap gap-1 border-b border-sky-200/70 p-2">
        {PERSONAS.map((persona, i) => (
          <button
            key={persona.id}
            type="button"
            onClick={() => setActive(i)}
            className={`relative flex-1 whitespace-nowrap rounded-xl px-4 py-3 text-[13px] font-medium transition ${
              i === active
                ? "bg-white/85 text-slate-800 shadow-[inset_0_0_0_1px_rgba(14,165,233,0.25)]"
                : "text-slate-500 hover:bg-sky-50 hover:text-slate-700"
            }`}
          >
            <span className="mr-2 text-sky-600">{persona.icon}</span>
            {persona.label}
          </button>
        ))}
      </div>

      <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[1fr_1.1fr]">
        <div
          className={`pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br ${p.accent} to-transparent blur-3xl`}
        />
        <div className="relative">
          <h3 className="text-2xl font-semibold leading-snug tracking-tight text-slate-800">
            {p.headline}
          </h3>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-500">{p.body}</p>
          <Link
            href={p.cta.href}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-sky-300/80 bg-sky-100/80 px-5 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-200"
          >
            {p.cta.label} <span>→</span>
          </Link>
        </div>
        <div className="relative space-y-3">
          {p.bullets.map((b, i) => (
            <div
              key={b.title}
              className="rounded-2xl border border-sky-200/60 bg-white/70 p-4 transition hover:border-sky-300/70"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-sky-300/45 to-indigo-300/45 font-mono text-[11px] text-sky-700">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-slate-800">{b.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{b.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ ROI simulator ----------------------------- */

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between">
        <span className="mono-label text-[10px]">{label}</span>
        <span className="font-mono text-sm font-semibold text-sky-600">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full"
      />
    </label>
  );
}

export function RoiSimulator({ defaultArpu = 65 }: { defaultArpu?: number }) {
  const [base, setBase] = useState(50000);
  const [arpu, setArpu] = useState(defaultArpu);
  const [churn, setChurn] = useState(26.5);
  const [recall, setRecall] = useState(75.7);
  const [save, setSave] = useState(30);

  const result = useMemo(() => {
    const monthlyChurners = (base * (churn / 100)) / 12;
    const caught = monthlyChurners * (recall / 100);
    const rescued = caught * (save / 100);
    const monthlySaved = rescued * arpu;
    const annual = monthlySaved * 12;
    const ltvSaved = rescued * arpu * 18;
    return { monthlyChurners, caught, rescued, monthlySaved, annual, ltvSaved };
  }, [base, arpu, churn, recall, save]);

  const money = (v: number) =>
    `$${Math.round(v).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  return (
    <div className="glass grid gap-8 rounded-3xl p-6 sm:p-8 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-6">
        <div>
          <Tag tone="cyan">interactive</Tag>
          <h3 className="mt-3 text-xl font-semibold text-slate-800">Retention ROI simulator</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
            Plug in your own book of business. The defaults are this project&apos;s measured values:
            26.5% annual churn, 75.7% recall at the tuned threshold.
          </p>
        </div>
        <Slider
          label="subscriber base"
          value={base}
          min={5000}
          max={500000}
          step={5000}
          format={(v) => v.toLocaleString("en-US")}
          onChange={setBase}
        />
        <Slider
          label="ARPU (monthly)"
          value={arpu}
          min={15}
          max={200}
          format={(v) => `$${v}`}
          onChange={setArpu}
        />
        <Slider
          label="annual churn rate"
          value={churn}
          min={5}
          max={50}
          step={0.5}
          format={(v) => `${v}%`}
          onChange={setChurn}
        />
        <Slider
          label="model recall (churners caught)"
          value={recall}
          min={30}
          max={95}
          step={0.1}
          format={(v) => `${v}%`}
          onChange={setRecall}
        />
        <Slider
          label="intervention success rate"
          value={save}
          min={5}
          max={70}
          format={(v) => `${v}%`}
          onChange={setSave}
        />
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-sky-200/70 bg-gradient-to-br from-white/85 to-transparent p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-200/70 blur-3xl" />
        <p className="mono-label">projected annual revenue protected</p>
        <p className="mt-2 bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text font-mono text-4xl font-bold text-transparent sm:text-5xl">
          {money(result.annual)}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4">
          {[
            { k: "churners / month", v: Math.round(result.monthlyChurners).toLocaleString("en-US") },
            { k: "flagged by model", v: Math.round(result.caught).toLocaleString("en-US") },
            { k: "actually retained", v: Math.round(result.rescued).toLocaleString("en-US") },
            { k: "MRR protected", v: money(result.monthlySaved) },
          ].map((s) => (
            <div key={s.k} className="rounded-xl border border-sky-200/60 bg-white/70 p-3">
              <p className="mono-label text-[9px]">{s.k}</p>
              <p className="mt-1 font-mono text-lg font-semibold text-slate-800">{s.v}</p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>18-month LTV protected</span>
            <span className="font-mono text-emerald-600">{money(result.ltvSaved)}</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sky-100/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
              style={{
                width: `${Math.min(100, (result.ltvSaved / (base * arpu * 1.2)) * 100).toFixed(1)}%`,
              }}
            />
          </div>
        </div>
        <p className="mt-6 text-[11px] leading-relaxed text-slate-500">
          Model: churners/month = base × churn ÷ 12. Retained = churners × recall × intervention
          success. Assumes an 18-month average remaining lifetime for rescued accounts.
        </p>
      </div>
    </div>
  );
}
