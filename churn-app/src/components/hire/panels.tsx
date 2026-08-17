"use client";

import { useState } from "react";
import { Panel } from "@/components/charts";
import { Tag } from "@/components/ui";

/* --------------------------- competency radar ----------------------------- */

const AXES = [
  { label: "Problem framing", value: 0.9 },
  { label: "Data modelling / SQL", value: 0.92 },
  { label: "ML & statistics", value: 0.86 },
  { label: "Engineering & shipping", value: 0.82 },
  { label: "Business storytelling", value: 0.94 },
  { label: "Ownership", value: 0.95 },
];

export function CompetencyRadar() {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const R = 108;
  const n = AXES.length;
  const point = (i: number, r: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as const;
  };
  const poly = AXES.map((a, i) => point(i, R * a.value).join(",")).join(" ");

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full max-w-[340px]">
        <defs>
          <radialGradient id="radar-fill">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.15" />
          </radialGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((r) => (
          <polygon
            key={r}
            points={AXES.map((_, i) => point(i, R * r).join(",")).join(" ")}
            fill="none"
            stroke="rgba(120,165,205,0.34)"
          />
        ))}
        {AXES.map((a, i) => {
          const [x, y] = point(i, R);
          return <line key={a.label} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(120,165,205,0.34)" />;
        })}
        <polygon
          points={poly}
          fill="url(#radar-fill)"
          stroke="#0284c7"
          strokeWidth={2}
          style={{ filter: "drop-shadow(0 0 10px rgba(14,165,233,0.5))" }}
        />
        {AXES.map((a, i) => {
          const [x, y] = point(i, R * a.value);
          return <circle key={a.label} cx={x} cy={y} r={3.5} fill="#334155" />;
        })}
        {AXES.map((a, i) => {
          const [x, y] = point(i, R + 26);
          return (
            <text
              key={a.label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontSize: 8.5, fill: "#64748b", letterSpacing: "0.06em" }}
            >
              {a.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* --------------------------------- FAQ ------------------------------------ */

const FAQS = [
  {
    q: "How was this project scoped and delivered?",
    a: "Framed as a revenue problem, not a modelling exercise: quantify attrition, isolate the cohorts that carry the loss, and hand retention a costed intervention list. Delivered in four phases — data foundation, exploratory + SQL analytics, modelling & explainability, then the decision products (Power BI dashboard and this application).",
  },
  {
    q: "What was the hardest technical decision?",
    a: "Choosing logistic regression over XGBoost. Boosting was marginally better on AUC but the linear model gave exact SHAP attributions and a threshold the business could reason about. A churn model that a retention manager will not act on has zero value.",
  },
  {
    q: "How do you communicate with non-technical stakeholders?",
    a: "Every metric is converted into revenue or risk before it reaches a slide. The headline of the whole study is one sentence — one cohort of 916 customers puts $53,178/month at risk — and the analysis exists to defend it.",
  },
  {
    q: "What would you do next with more time?",
    a: "Move from static scoring to a weekly batch pipeline with drift monitoring, add uplift modelling so discounts go only to persuadable customers, and A/B test the contract-upgrade play before rolling it out to all 3,875 accounts.",
  },
  {
    q: "What kind of team are you looking for?",
    a: "A team where analytics has a seat at the decision table — where the output is a shipped change, not a dashboard nobody opens. Comfortable in Data Scientist, Data Analyst, ML Engineer or Analytics Engineer titles.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-2">
      {FAQS.map((f, i) => (
        <div
          key={f.q}
          className={`overflow-hidden rounded-xl border transition ${
            open === i ? "border-sky-300/80 bg-sky-50" : "border-sky-200/60 bg-white/70"
          }`}
        >
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
          >
            <span className="text-[13.5px] font-medium text-slate-800">{f.q}</span>
            <span className={`text-sky-600 transition-transform ${open === i ? "rotate-45" : ""}`}>
              +
            </span>
          </button>
          {open === i && (
            <p className="px-4 pb-4 text-[13px] leading-relaxed text-slate-500">{f.a}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ contact form ------------------------------ */

const PERSONAS = [
  { id: "recruiter", label: "Recruiter" },
  { id: "hr", label: "HR / Talent" },
  { id: "customer", label: "Business / Customer" },
  { id: "engineer", label: "Engineer" },
];

export function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    persona: "recruiter",
    message: "",
  });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Something went wrong");
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <Panel title="Message received" subtitle="Stored in Postgres and tagged by persona.">
        <div className="grid place-items-center py-10 text-center">
          <div>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-2xl text-white">
              ✓
            </div>
            <p className="mt-4 text-lg font-semibold text-slate-800">Thanks, {form.name.split(" ")[0]}.</p>
            <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-slate-500">
              Your note is in the queue as a <span className="text-sky-600">{form.persona}</span>{" "}
              enquiry. Expect a reply within one business day.
            </p>
            <button
              type="button"
              onClick={() => {
                setForm({ name: "", email: "", company: "", persona: "recruiter", message: "" });
                setState("idle");
              }}
              className="mt-6 rounded-lg border border-sky-300/70 px-4 py-2 text-[12.5px] text-slate-600 transition hover:border-sky-400/80"
            >
              Send another
            </button>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      title="Start a conversation"
      subtitle="Roles, contract work, or a question about the methodology — it all lands in the same inbox."
      action={<Tag tone="cyan">avg reply &lt; 24h</Tag>}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <span className="mono-label text-[10px]">i am a…</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setForm((f) => ({ ...f, persona: p.id }))}
                className={`rounded-lg border px-3 py-2 text-[12.5px] transition ${
                  form.persona === p.id
                    ? "border-sky-400/80 bg-sky-100 text-sky-900"
                    : "border-sky-200/70 bg-white/70 text-slate-500 hover:text-slate-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mono-label text-[10px]">name *</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-sky-200/70 bg-white/70 px-3 py-2.5 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:border-sky-500/70 focus:outline-none"
              placeholder="Ada Lovelace"
            />
          </label>
          <label className="block">
            <span className="mono-label text-[10px]">work email *</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-sky-200/70 bg-white/70 px-3 py-2.5 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:border-sky-500/70 focus:outline-none"
              placeholder="you@company.com"
            />
          </label>
        </div>

        <label className="block">
          <span className="mono-label text-[10px]">company</span>
          <input
            value={form.company}
            onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
            className="mt-2 w-full rounded-lg border border-sky-200/70 bg-white/70 px-3 py-2.5 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:border-sky-500/70 focus:outline-none"
            placeholder="Acme Telecom"
          />
        </label>

        <label className="block">
          <span className="mono-label text-[10px]">message *</span>
          <textarea
            required
            rows={4}
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            className="mt-2 w-full resize-y rounded-lg border border-sky-200/70 bg-white/70 px-3 py-2.5 text-[13.5px] text-slate-800 placeholder:text-slate-400 focus:border-sky-500/70 focus:outline-none"
            placeholder="We're hiring a data scientist for our retention pod…"
          />
        </label>

        {state === "error" && (
          <p className="rounded-lg border border-rose-300/80 bg-rose-100/70 px-3 py-2 text-[12.5px] text-rose-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={state === "sending"}
          className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {state === "sending" ? "Sending…" : "Send message →"}
        </button>
        <p className="text-center text-[11px] text-slate-500">
          Stored in PostgreSQL via Drizzle ORM · no third-party trackers.
        </p>
      </form>
    </Panel>
  );
}

/* ------------------------------- print CTA -------------------------------- */

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print rounded-xl border border-sky-300/70 bg-white/75 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-sky-400/80"
    >
      Print / save as PDF
    </button>
  );
}
