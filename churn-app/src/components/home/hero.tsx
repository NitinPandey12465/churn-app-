"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Counter, LiveDot } from "@/components/ui";

export type FeedItem = {
  id: string;
  risk: number;
  band: string;
  contract: string;
  tenure: number;
  mrr: number;
};

const bandColor: Record<string, string> = {
  Critical: "text-rose-600",
  High: "text-amber-600",
  Watch: "text-sky-600",
  Stable: "text-emerald-600",
};

function ScoringFeed({ feed }: { feed: FeedItem[] }) {
  const [visible, setVisible] = useState<FeedItem[]>(feed.slice(0, 5));
  const [cursor, setCursor] = useState(5);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (feed.length < 6) return;
    const id = setInterval(() => {
      setScanning(true);
      setTimeout(() => setScanning(false), 420);
      setCursor((c) => {
        const next = (c + 1) % feed.length;
        setVisible((v) => [feed[next], ...v].slice(0, 5));
        return next;
      });
    }, 2300);
    return () => clearInterval(id);
  }, [feed]);

  return (
    <div className="glass relative overflow-hidden rounded-2xl p-5 shadow-[0_40px_110px_-55px_rgba(14,116,190,0.85)]">
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-40 bg-gradient-to-b from-sky-300/40 to-transparent blur-2xl" />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 font-mono text-[11px] text-slate-500">scoring-stream.log</span>
        </div>
        <LiveDot label="inference" />
      </div>

      <div className="relative mt-4 space-y-2">
        {visible.map((row, i) => (
          <div
            key={`${row.id}-${i}`}
            className="flex items-center gap-3 rounded-xl border border-sky-200/60 bg-white/70 px-3 py-2.5 transition-all"
            style={{ opacity: 1 - i * 0.16, transform: `scale(${1 - i * 0.012})` }}
          >
            <span className="font-mono text-[11px] text-slate-500">{row.id.slice(0, 9)}</span>
            <span className="hidden text-[11px] text-slate-500 sm:inline">{row.contract}</span>
            <span className="ml-auto font-mono text-[11px] text-slate-500">{row.tenure}mo</span>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-sky-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 via-amber-400 to-rose-500 transition-all duration-700"
                style={{ width: `${Math.max(6, row.risk * 100)}%` }}
              />
            </div>
            <span
              className={`w-14 text-right font-mono text-[12px] font-semibold tabular-nums ${
                bandColor[row.band] ?? "text-slate-600"
              }`}
            >
              {(row.risk * 100).toFixed(1)}%
            </span>
          </div>
        ))}
        {scanning && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-sky-400/80 to-transparent" />
          </div>
        )}
      </div>

      <div className="relative mt-5 grid grid-cols-3 gap-3 border-t border-sky-200/70 pt-4">
        {[
          { k: "p50 latency", v: "1.4 ms" },
          { k: "throughput", v: "7,043/s" },
          { k: "drift", v: "stable" },
        ].map((s) => (
          <div key={s.k}>
            <p className="mono-label text-[9px]">{s.k}</p>
            <p className="mt-1 font-mono text-sm text-sky-600">{s.v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero({
  feed,
  churnRate,
  revenueAtRisk,
  customers,
  headlineRate,
}: {
  feed: FeedItem[];
  churnRate: number;
  revenueAtRisk: number;
  customers: number;
  headlineRate: number;
}) {
  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-16 sm:pt-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="animate-rise">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/70 bg-sky-100/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-sky-600">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              production model v1.4 · auc 0.84
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
              telco · 7,043 subscribers · 21 features
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-slate-800 sm:text-6xl">
            Churn is decided
            <br />
            months before
            <br />
            <span className="grad-text">the cancel click.</span>
          </h1>

          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-slate-500 sm:text-base">
            Like frost forming on a windowpane, attrition sets in long before anyone can see it.
            This platform finds the customers who are already leaving — quietly — ranks them by the
            revenue they take with them, explains <em className="not-italic text-slate-700">why</em>{" "}
            with SHAP, and hands the retention team a costed playbook. Built end-to-end: SQL →
            Python → ML → survival analysis → shipped product.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/predict"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-sky-500 via-cyan-400 to-indigo-500 px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              <span className="relative">Score a customer live</span>
              <span className="relative transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border border-sky-300/70 bg-white/75 px-6 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-sky-400/80 hover:bg-sky-100"
            >
              Open command center
            </Link>
            <a
              href="https://github.com/NitinPandey12465/user-retention-churn-prediction"
              target="_blank"
              rel="noreferrer"
              className="px-2 py-3.5 text-sm font-medium text-slate-500 underline-offset-4 transition hover:text-sky-700 hover:underline"
            >
              Read the source ↗
            </a>
          </div>

          <dl className="mt-10 grid max-w-xl grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            {[
              { k: "customers scored", v: <Counter value={customers} /> },
              { k: "annual churn", v: <Counter value={churnRate * 100} decimals={1} suffix="%" /> },
              { k: "MRR at risk", v: <Counter value={revenueAtRisk} prefix="$" /> },
              { k: "churners caught", v: <Counter value={75.7} decimals={1} suffix="%" /> },
            ].map((s) => (
              <div key={s.k}>
                <dt className="mono-label text-[9px]">{s.k}</dt>
                <dd className="mt-1.5 font-mono text-xl font-semibold text-slate-800">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="animate-rise [animation-delay:120ms]">
          <ScoringFeed feed={feed} />
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-4">
              <p className="mono-label text-[9px]">headline cohort</p>
              <p className="mt-2 text-2xl font-semibold text-rose-600">
                {(headlineRate * 100).toFixed(1)}%
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Month-to-month + fiber + &lt;12 months tenure churn at ~3× company average.
              </p>
            </div>
            <div className="glass rounded-2xl p-4">
              <p className="mono-label text-[9px]">protected / month</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-600">$60,000</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Combined impact of the three prescribed retention plays.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
