import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Panel } from "@/components/charts";
import { CompetencyRadar, ContactForm, Faq, PrintButton } from "@/components/hire/panels";
import { GlassCard, Reveal, Tag } from "@/components/ui";

export const metadata: Metadata = {
  title: "Hire Me — Recruiter & HR Pack",
  description:
    "Candidate profile for Nitin Pandey: skills matrix, competency radar, delivery timeline, verified artifacts and a direct contact channel.",
};

const QUICK = [
  { k: "target roles", v: "Data Scientist · Data Analyst · ML Engineer · Analytics Engineer" },
  { k: "core stack", v: "Python · SQL/PostgreSQL · scikit-learn · XGBoost · SHAP · Power BI" },
  { k: "education", v: "B.Tech Production & Industrial Engineering, Delhi Technological University" },
  { k: "research", v: "Published NLP paper — ICAIT 2025, IEEE Xplore" },
  { k: "availability", v: "Open to full-time & contract · immediate joiner" },
  { k: "working style", v: "Problem-first, ships end-to-end, writes for executives" },
];

const SKILLS: { group: string; tone: string; items: { name: string; level: number }[] }[] = [
  {
    group: "Data science & ML",
    tone: "#0284c7",
    items: [
      { name: "Python (pandas, NumPy)", level: 0.93 },
      { name: "scikit-learn / model selection", level: 0.9 },
      { name: "XGBoost & gradient boosting", level: 0.84 },
      { name: "SHAP explainability", level: 0.88 },
      { name: "Survival analysis (lifelines)", level: 0.8 },
    ],
  },
  {
    group: "Data engineering",
    tone: "#6366f1",
    items: [
      { name: "SQL & window functions", level: 0.92 },
      { name: "PostgreSQL schema design", level: 0.88 },
      { name: "ETL / feature pipelines", level: 0.84 },
      { name: "Drizzle ORM · TypeScript", level: 0.78 },
    ],
  },
  {
    group: "Analytics & communication",
    tone: "#db2777",
    items: [
      { name: "Power BI + DAX", level: 0.87 },
      { name: "Executive storytelling", level: 0.94 },
      { name: "Experiment design & A/B", level: 0.8 },
      { name: "Stakeholder management", level: 0.86 },
    ],
  },
];

const TIMELINE = [
  {
    phase: "Week 1",
    title: "Data foundation",
    body: "Loaded 7,043 IBM Telco records, repaired TotalCharges coercion errors, designed and populated a 4-table normalized schema in PostgreSQL.",
  },
  {
    phase: "Week 2",
    title: "Analytics & EDA",
    body: "SQL cohort analysis in pgAdmin: contract, tenure band, service mix. Isolated the month-to-month × fiber × new-joiner intersection as the loss centre.",
  },
  {
    phase: "Week 3",
    title: "Modelling & explainability",
    body: "Benchmarked logistic regression, random forest and XGBoost with stratified CV; tuned the decision threshold for recall; produced SHAP global and local attributions.",
  },
  {
    phase: "Week 4",
    title: "Survival & decision products",
    body: "Kaplan-Meier curves per contract with a log-rank test, then shipped a 4-page Power BI dashboard and this production web application.",
  },
];

const ARTIFACTS = [
  {
    title: "GitHub repository",
    body: "Full pipeline: SQL schema, Python analysis script, model artifacts and documentation.",
    href: "https://github.com/NitinPandey12465/user-retention-churn-prediction",
    cta: "View source",
  },
  {
    title: "Hugging Face Space",
    body: "The original churn-risk predictor deployed as an interactive Gradio app.",
    href: "https://huggingface.co/spaces/NitinPandey2632/churn-risk-predictor",
    cta: "Open Space",
  },
  {
    title: "This application",
    body: "Next.js + PostgreSQL rebuild with live scoring, exact SHAP and recomputed survival analysis.",
    href: "/insights",
    cta: "Enter model lab",
  },
];

export default function HirePage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      {/* profile */}
      <section id="profile" className="scroll-mt-24">
        <div className="glass relative overflow-hidden rounded-3xl p-7 sm:p-10">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-indigo-200/60 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-[-6rem] h-64 w-64 rounded-full bg-sky-100 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <div className="relative h-32 w-32 overflow-hidden rounded-3xl ring-1 ring-sky-200 sm:h-40 sm:w-40">
              <Image
                src="/profile.jpg"
                alt="Abstract data-science portrait"
                fill
                sizes="160px"
                className="object-cover"
                priority
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Tag tone="emerald">open to opportunities</Tag>
                <Tag tone="cyan">immediate joiner</Tag>
                <Tag tone="violet">IEEE-published</Tag>
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">
                Nitin Pandey
              </h1>
              <p className="mt-2 text-[15px] text-slate-600">
                Data Scientist / Analyst — I turn ambiguous business losses into{" "}
                <span className="grad-text font-semibold">models, dollars and decisions</span>.
              </p>
              <p className="mt-4 max-w-2xl text-[13.5px] leading-relaxed text-slate-500">
                B.Tech Production &amp; Industrial Engineering, Delhi Technological University.
                Published NLP researcher (ICAIT 2025, IEEE Xplore). I build the whole chain — schema
                design, feature engineering, modelling, explainability, dashboards and the
                production app that puts it in someone&apos;s hands.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 lg:w-52">
              <Link
                href="#contact"
                className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-3 text-center text-sm font-semibold text-white transition hover:brightness-110"
              >
                Contact me
              </Link>
              <a
                href="https://github.com/NitinPandey12465/user-retention-churn-prediction"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-sky-300/70 bg-white/75 px-5 py-3 text-center text-sm font-semibold text-slate-800 transition hover:border-sky-400/80"
              >
                GitHub ↗
              </a>
              <PrintButton />
            </div>
          </div>

          <dl className="relative mt-9 grid gap-x-8 gap-y-5 border-t border-sky-200/70 pt-7 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK.map((q) => (
              <div key={q.k}>
                <dt className="mono-label text-[9px]">{q.k}</dt>
                <dd className="mt-1.5 text-[13.5px] leading-relaxed text-slate-700">{q.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* headline proof */}
      <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { k: "annual churn attacked", v: "26.5%", tone: "text-rose-600" },
          { k: "model AUC-ROC", v: "0.84", tone: "text-sky-600" },
          { k: "churners caught", v: "75.7%", tone: "text-indigo-600" },
          { k: "MRR protected", v: "$60K", tone: "text-emerald-600" },
        ].map((s, i) => (
          <Reveal key={s.k} delay={i * 70}>
            <GlassCard className="p-5">
              <p className="mono-label text-[9px]">{s.k}</p>
              <p className={`mt-2 font-mono text-3xl font-bold ${s.tone}`}>{s.v}</p>
            </GlassCard>
          </Reveal>
        ))}
      </section>

      {/* skills + radar */}
      <section className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Reveal>
          <Panel
            title="Skills matrix"
            subtitle="Self-assessed proficiency, each one evidenced somewhere in this project."
            className="h-full"
          >
            <div className="space-y-7">
              {SKILLS.map((group) => (
                <div key={group.group}>
                  <p className="mono-label text-[10px]" style={{ color: group.tone }}>
                    {group.group}
                  </p>
                  <div className="mt-3 space-y-3">
                    {group.items.map((s) => (
                      <div key={s.name}>
                        <div className="flex items-baseline justify-between">
                          <span className="text-[13px] text-slate-700">{s.name}</span>
                          <span className="font-mono text-[11px] text-slate-500">
                            {Math.round(s.level * 100)}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-sky-100/80">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${s.level * 100}%`,
                              background: `linear-gradient(90deg, ${group.tone}, ${group.tone}55)`,
                              boxShadow: `0 0 14px -4px ${group.tone}`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </Reveal>

        <Reveal delay={90}>
          <Panel
            title="Competency profile"
            subtitle="How an HR partner should read this candidate."
            className="h-full"
          >
            <CompetencyRadar />
            <div className="mt-5 space-y-3 text-[13px] leading-relaxed text-slate-500">
              <p>
                <span className="font-semibold text-slate-800">Strongest signal:</span> ownership and
                business storytelling — this project was scoped, built and communicated without
                supervision.
              </p>
              <p>
                <span className="font-semibold text-slate-800">Growth edge:</span> large-scale
                distributed engineering (Spark, streaming) — currently at working proficiency, and
                deliberately being deepened.
              </p>
            </div>
          </Panel>
        </Reveal>
      </section>

      {/* timeline + faq */}
      <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <Reveal>
          <Panel
            title="Delivery timeline"
            subtitle="Four weeks, from raw CSV to a decision product in stakeholders' hands."
            className="h-full"
          >
            <ol className="relative space-y-6 border-l border-sky-200/70 pl-6">
              {TIMELINE.map((t) => (
                <li key={t.phase} className="relative">
                  <span className="absolute -left-[31px] top-1 grid h-4 w-4 place-items-center rounded-full border border-sky-400/80 bg-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                  </span>
                  <p className="mono-label text-[9px]">{t.phase}</p>
                  <p className="mt-1 text-[14px] font-semibold text-slate-800">{t.title}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500">{t.body}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </Reveal>

        <Reveal delay={90}>
          <Panel
            title="Interview questions, answered up front"
            subtitle="The five things HR and hiring managers always ask."
            className="h-full"
          >
            <Faq />
          </Panel>
        </Reveal>
      </section>

      {/* artifacts */}
      <section className="mt-4 grid gap-4 md:grid-cols-3">
        {ARTIFACTS.map((a, i) => (
          <Reveal key={a.title} delay={i * 80}>
            <GlassCard className="flex h-full flex-col justify-between p-6">
              <div>
                <p className="text-[15px] font-semibold text-slate-800">{a.title}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{a.body}</p>
              </div>
              <a
                href={a.href}
                target={a.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-sky-600 transition hover:text-sky-600"
              >
                {a.cta} <span>→</span>
              </a>
            </GlassCard>
          </Reveal>
        ))}
      </section>

      {/* contact */}
      <section id="contact" className="mt-4 grid scroll-mt-24 gap-4 lg:grid-cols-[1fr_1fr]">
        <Reveal>
          <ContactForm />
        </Reveal>
        <Reveal delay={90}>
          <Panel
            title="What happens to your message"
            subtitle="Transparency, because you're evaluating an engineer."
            className="h-full"
          >
            <pre className="overflow-x-auto rounded-xl border border-sky-200/70 bg-sky-50/90 p-4 font-mono text-[11.5px] leading-relaxed text-sky-900">
              {`POST /api/leads
  ├─ validate  name, email regex, message length
  ├─ classify  persona: recruiter | hr | customer | engineer
  ├─ persist   INSERT INTO leads (...) RETURNING id
  └─ respond   { ok: true, id, createdAt }`}
            </pre>
            <ul className="mt-5 space-y-3 text-[13px] leading-relaxed text-slate-500">
              <li>
                • <span className="text-slate-700">No trackers, no third parties.</span> The row
                lives in the same PostgreSQL instance that powers the analytics on this site.
              </li>
              <li>
                • <span className="text-slate-700">Persona tagging</span> exists so recruiter briefs
                and technical questions get routed differently — the same segmentation logic used on
                customers.
              </li>
              <li>
                • <span className="text-slate-700">Graceful failure:</span> if the database is
                unreachable the API returns a clean error instead of dropping your message
                silently.
              </li>
            </ul>
            <div className="mt-6 rounded-xl border border-sky-200/80 bg-sky-50/90 p-4">
              <p className="text-[13px] leading-relaxed text-slate-600">
                Prefer async? Everything a screening call would cover is already on this site: the{" "}
                <Link href="/insights" className="text-sky-600 underline-offset-4 hover:underline">
                  model lab
                </Link>{" "}
                for depth, the{" "}
                <Link href="/dashboard" className="text-sky-600 underline-offset-4 hover:underline">
                  command center
                </Link>{" "}
                for business judgement, and the{" "}
                <Link href="/predict" className="text-sky-600 underline-offset-4 hover:underline">
                  risk scorer
                </Link>{" "}
                for engineering.
              </p>
            </div>
          </Panel>
        </Reveal>
      </section>
    </div>
  );
}
