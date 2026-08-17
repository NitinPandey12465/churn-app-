"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/dashboard", label: "Command Center" },
  { href: "/predict", label: "Risk Scorer" },
  { href: "/insights", label: "Model Lab" },
  { href: "/customers", label: "Customer 360" },
  { href: "/hire", label: "Hire Me" },
];

/**
 * "Snow-wind mountain" backdrop:
 * aurora ribbons → distant glacier peaks → wind haze → two parallax snow layers.
 */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* aurora over the range */}
      <div className="animate-aurora absolute -top-32 left-[-10%] h-[34rem] w-[70%] rounded-[100%] bg-gradient-to-r from-teal-200/40 via-sky-200/50 to-indigo-200/40 blur-[110px]" />
      <div className="animate-drift absolute -right-24 -top-16 h-[28rem] w-[45%] rounded-[100%] bg-gradient-to-l from-indigo-200/45 via-violet-200/30 to-transparent blur-[120px]" />
      <div className="animate-float absolute bottom-[18%] left-[35%] h-[26rem] w-[40%] rounded-full bg-cyan-100/50 blur-[120px]" />

      {/* frost grid */}
      <div className="absolute inset-0 grid-bg opacity-70" />

      {/* mountain range */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 520"
        preserveAspectRatio="xMidYMax slice"
        style={{ height: "62vh" }}
      >
        <defs>
          <linearGradient id="peak-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cfe2f2" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#eaf3fb" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="peak-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b9d4ec" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#e6f1fa" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="peak-near" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#dcebf7" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#eef6fc" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="snowcap" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.25" />
          </linearGradient>
        </defs>

        {/* far range */}
        <path
          d="M0 330 L120 250 L210 300 L330 190 L430 280 L540 210 L660 300 L780 220 L900 300 L1010 240 L1130 310 L1250 250 L1360 320 L1440 270 L1440 520 L0 520 Z"
          fill="url(#peak-far)"
        />
        {/* mid range */}
        <path
          d="M0 400 L150 320 L260 380 L380 268 L500 372 L610 300 L740 392 L860 296 L980 380 L1120 316 L1240 396 L1360 330 L1440 386 L1440 520 L0 520 Z"
          fill="url(#peak-mid)"
        />
        {/* snow caps on the mid range */}
        <path
          d="M380 268 L410 296 L392 300 L420 322 L340 322 L362 298 L348 294 Z M860 296 L888 324 L872 328 L900 350 L820 350 L842 326 L828 322 Z M610 300 L636 326 L622 330 L648 352 L572 352 L594 328 L580 324 Z"
          fill="url(#snowcap)"
        />
        {/* near ridge */}
        <path
          d="M0 470 L180 410 L300 452 L440 386 L560 448 L700 400 L840 462 L980 404 L1120 458 L1260 412 L1380 462 L1440 436 L1440 520 L0 520 Z"
          fill="url(#peak-near)"
        />
        {/* wind streaks off the ridge */}
        <g stroke="#ffffff" strokeLinecap="round" opacity="0.75">
          <path d="M430 372 q70 -16 150 -6" strokeWidth="2.5" fill="none" className="animate-shine" />
          <path d="M470 358 q60 -14 120 -8" strokeWidth="1.6" fill="none" opacity="0.7" />
          <path d="M900 390 q80 -18 170 -8" strokeWidth="2.2" fill="none" className="animate-shine" />
          <path d="M120 424 q70 -14 140 -4" strokeWidth="1.8" fill="none" opacity="0.6" />
        </g>
      </svg>

      {/* wind haze */}
      <div className="absolute inset-x-0 bottom-0 h-[32vh] bg-gradient-to-t from-white via-white/70 to-transparent" />

      {/* falling snow */}
      <div className="snow-layer snow-far" />
      <div className="snow-layer snow-near" />
    </div>
  );
}

export function TopNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={`no-print sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/80 bg-white/75 shadow-[0_10px_30px_-24px_rgba(23,60,100,0.6)] backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link href="/" className="group flex items-center gap-3">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 via-cyan-300 to-indigo-400 text-[13px] font-black text-white shadow-[0_6px_18px_-6px_rgba(14,116,190,0.85)]">
            NP
            <span className="animate-pulse-ring absolute inset-0 rounded-xl border border-sky-300/80" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-sm font-semibold tracking-tight text-slate-800">
              Retention<span className="grad-text">.Engine</span>
            </span>
            <span className="mono-label block text-[9px]">snow-wind churn intelligence</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-lg px-3 py-2 text-[13px] font-medium transition ${
                  active ? "text-sky-800" : "text-slate-500 hover:text-sky-700"
                }`}
              >
                {active && (
                  <span className="absolute inset-0 rounded-lg border border-sky-300/70 bg-white/80 shadow-[0_6px_16px_-12px_rgba(14,116,190,0.9)]" />
                )}
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/predict"
            className="hidden rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-[13px] font-semibold text-white shadow-[0_8px_22px_-12px_rgba(14,116,190,0.95)] transition hover:brightness-105 sm:inline-block"
          >
            Score a customer
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
            className="grid h-9 w-9 place-items-center rounded-lg border border-sky-200 bg-white/80 text-slate-600 lg:hidden"
          >
            <span className="text-lg leading-none">{open ? "×" : "☰"}</span>
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-sky-100 bg-white/95 px-5 pb-4 pt-2 backdrop-blur-xl lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-sky-50 hover:text-sky-800"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print relative mt-24 border-t border-white/90 bg-white/70 backdrop-blur-xl">
      <div className="rune-line absolute inset-x-0 top-0 h-px" />
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="grad-text font-display text-lg font-semibold">
            User Retention &amp; Churn Prediction Engine
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500">
            End-to-end data product: PostgreSQL star schema → feature engineering → logistic
            regression / XGBoost → SHAP explainability → Kaplan-Meier survival → executive
            dashboard, shipped as a live Next.js application.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              "PostgreSQL",
              "Python",
              "scikit-learn",
              "XGBoost",
              "SHAP",
              "Lifelines",
              "Power BI",
              "Next.js",
            ].map((t) => (
              <span
                key={t}
                className="rounded-full border border-sky-200/80 bg-white/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-slate-500"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="mono-label">Product</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-500">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="transition hover:text-sky-700">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mono-label">Source &amp; contact</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-500">
            <li>
              <a
                href="https://github.com/NitinPandey12465/user-retention-churn-prediction"
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-sky-700"
              >
                GitHub repository ↗
              </a>
            </li>
            <li>
              <a
                href="https://huggingface.co/spaces/NitinPandey2632/churn-risk-predictor"
                target="_blank"
                rel="noreferrer"
                className="transition hover:text-sky-700"
              >
                Hugging Face Space ↗
              </a>
            </li>
            <li>
              <Link href="/hire" className="transition hover:text-sky-700">
                Recruiter &amp; HR pack
              </Link>
            </li>
            <li>
              <a href="/api/health" className="transition hover:text-sky-700">
                System health ↗
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-sky-100 px-5 py-5 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-slate-400">
        ❄ Nitin Pandey · B.Tech Production &amp; Industrial Engineering, DTU · IEEE-published NLP
        researcher ❄
      </div>
    </footer>
  );
}
