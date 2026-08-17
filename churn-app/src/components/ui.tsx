"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function useInView<T extends HTMLElement>(threshold = 0.18) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setInView(true);
      },
      { threshold, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal ${inView ? "in" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function Counter({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1400,
  className = "",
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.4);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  sub,
  align = "left",
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-3xl"}>
      <div
        className={`flex items-center gap-3 ${align === "center" ? "justify-center" : ""}`}
      >
        <span className="h-px w-8 rune-line" />
        <span className="text-[11px] text-sky-400">❄</span>
        <span className="mono-label">{eyebrow}</span>
      </div>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">{title}</h2>
      {sub && <p className="mt-4 text-[15px] leading-relaxed text-slate-500">{sub}</p>}
    </div>
  );
}

export function GlassCard({
  children,
  className = "",
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`glass card-hover relative overflow-hidden rounded-2xl ${
        glow ? "shadow-[0_30px_80px_-40px_rgba(14,116,190,0.55)]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function LiveDot({ label = "live" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/70 bg-emerald-100/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-600">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      {label}
    </span>
  );
}

export function KpiTile({
  label,
  value,
  hint,
  accent = "cyan",
  delay = 0,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: "cyan" | "violet" | "rose" | "emerald" | "amber";
  delay?: number;
}) {
  const accents: Record<string, string> = {
    cyan: "from-sky-300/45 to-transparent text-sky-600",
    violet: "from-indigo-300/45 to-transparent text-indigo-600",
    rose: "from-rose-300/45 to-transparent text-rose-600",
    emerald: "from-emerald-300/45 to-transparent text-emerald-600",
    amber: "from-amber-300/45 to-transparent text-amber-600",
  };
  return (
    <Reveal delay={delay}>
      <GlassCard className="h-full p-5">
        <div
          className={`pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-gradient-to-br blur-2xl ${accents[accent]}`}
        />
        <p className="mono-label">{label}</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-800">{value}</p>
        {hint && <p className="mt-2 text-xs leading-relaxed text-slate-500">{hint}</p>}
      </GlassCard>
    </Reveal>
  );
}

export function Tag({ children, tone = "slate" }: { children: ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    slate: "border-sky-200/80 bg-white/80 text-slate-600",
    cyan: "border-sky-300/80 bg-sky-100/80 text-sky-600",
    violet: "border-indigo-300/70 bg-indigo-100/70 text-indigo-600",
    rose: "border-rose-300/80 bg-rose-100/70 text-rose-600",
    emerald: "border-emerald-300/80 bg-emerald-100/70 text-emerald-600",
    amber: "border-amber-300/80 bg-amber-100/70 text-amber-600",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-gradient-to-r from-white/70 via-sky-100 to-white/40 ${className}`}
    />
  );
}
