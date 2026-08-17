"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Panel, RiskGauge, ShapWaterfall } from "@/components/charts";
import { LiveDot, Tag } from "@/components/ui";
import {
  CONTRACTS,
  INTERNET,
  PAYMENTS,
  type ChurnInput,
  type Contract,
  type Internet,
  type Payment,
} from "@/lib/churn";

type Result = {
  probability: number;
  baseline: number;
  band: string;
  drivers: { label: string; value: number }[];
  actions: { title: string; detail: string; lift: number; owner: string }[];
  counterfactuals: { label: string; probability: number; delta: number; note: string }[];
  serviceCount: number;
  revenueAtRisk: number;
  projectedSave: number;
  latencyMs: number;
};

const DEFAULT: ChurnInput = {
  tenure: 4,
  monthlyCharges: 94.5,
  contract: "Month-to-month",
  internetService: "Fiber optic",
  paymentMethod: "Electronic check",
  paperlessBilling: true,
  phoneService: true,
  multipleLines: true,
  onlineSecurity: false,
  onlineBackup: false,
  deviceProtection: false,
  techSupport: false,
  streamingTv: true,
  streamingMovies: true,
  seniorCitizen: false,
  partner: false,
  dependents: false,
};

const PRESETS: { name: string; hint: string; value: ChurnInput }[] = [
  { name: "Fiber newcomer", hint: "the 70.2% cohort", value: DEFAULT },
  {
    name: "Loyal family",
    hint: "two-year, protected",
    value: {
      ...DEFAULT,
      tenure: 62,
      monthlyCharges: 71.2,
      contract: "Two year",
      internetService: "DSL",
      paymentMethod: "Bank transfer (automatic)",
      onlineSecurity: true,
      techSupport: true,
      onlineBackup: true,
      deviceProtection: true,
      partner: true,
      dependents: true,
      streamingTv: false,
      streamingMovies: false,
      paperlessBilling: false,
    },
  },
  {
    name: "Silver saver",
    hint: "phone-only senior",
    value: {
      ...DEFAULT,
      tenure: 28,
      monthlyCharges: 24.4,
      contract: "One year",
      internetService: "No",
      paymentMethod: "Mailed check",
      multipleLines: false,
      streamingTv: false,
      streamingMovies: false,
      seniorCitizen: true,
      paperlessBilling: false,
    },
  },
  {
    name: "Streaming heavy",
    hint: "high bill, mid tenure",
    value: {
      ...DEFAULT,
      tenure: 17,
      monthlyCharges: 108.3,
      contract: "Month-to-month",
      paymentMethod: "Credit card (automatic)",
      onlineBackup: true,
      deviceProtection: true,
    },
  },
];

const BAND_UI: Record<string, { text: string; ring: string; bg: string }> = {
  Critical: { text: "text-rose-600", ring: "ring-rose-300/90", bg: "bg-rose-100/70" },
  High: { text: "text-amber-600", ring: "ring-amber-300/90", bg: "bg-amber-100/70" },
  Watch: { text: "text-sky-600", ring: "ring-sky-300/90", bg: "bg-sky-100/70" },
  Stable: { text: "text-emerald-600", ring: "ring-emerald-300/90", bg: "bg-emerald-100/70" },
};

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="mono-label text-[10px]">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`rounded-lg border px-3 py-2 text-[12.5px] font-medium transition ${
              value === o
                ? "border-sky-400/80 bg-sky-100 text-sky-900"
                : "border-sky-200/70 bg-white/70 text-slate-500 hover:border-sky-400/80 hover:text-slate-700"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-[12.5px] transition ${
        value
          ? "border-indigo-300/80 bg-indigo-100/70 text-indigo-700"
          : "border-sky-200/70 bg-white/70 text-slate-500 hover:border-sky-400/80"
      }`}
    >
      <span>{label}</span>
      <span
        className={`relative h-4 w-7 rounded-full transition ${value ? "bg-indigo-400" : "bg-slate-300"}`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${
            value ? "left-3.5" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export function Scorer() {
  const [input, setInput] = useState<ChurnInput>(DEFAULT);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, setPending] = useState(true);
  const [recent, setRecent] = useState<{ id: number; probability: number; band: string }[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const patch = useCallback((p: Partial<ChurnInput>) => setInput((v) => ({ ...v, ...p })), []);

  useEffect(() => {
    setPending(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/predict", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
        });
        const json = (await res.json()) as Result;
        setResult(json);
        const feed = await fetch("/api/predict").then((r) => r.json());
        setRecent(feed.rows ?? []);
      } finally {
        setPending(false);
      }
    }, 320);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [input]);

  const applyLever = (label: string) => {
    if (label.includes("one-year")) patch({ contract: "One year" });
    else if (label.includes("two-year")) patch({ contract: "Two year" });
    else if (label.includes("TechSupport")) patch({ techSupport: true, onlineSecurity: true });
    else if (label.includes("automatic")) patch({ paymentMethod: "Credit card (automatic)" });
    else if (label.includes("15%"))
      patch({ monthlyCharges: Math.round(input.monthlyCharges * 0.85 * 100) / 100 });
  };

  const band = result?.band ?? "Watch";
  const ui = BAND_UI[band] ?? BAND_UI.Watch;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* ---------------------------- inputs ---------------------------- */}
      <Panel
        title="Customer profile"
        subtitle="Every change re-scores the model server-side in ~1ms."
        action={<Tag tone="cyan">{PRESETS.length} presets</Tag>}
      >
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => setInput(p.value)}
              className="group rounded-xl border border-sky-200/70 bg-white/70 px-3 py-2 text-left transition hover:border-sky-400/80 hover:bg-sky-50"
            >
              <span className="block text-[12.5px] font-semibold text-slate-800">{p.name}</span>
              <span className="mono-label block text-[9px]">{p.hint}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-5">
          <label className="block">
            <span className="flex items-baseline justify-between">
              <span className="mono-label text-[10px]">tenure</span>
              <span className="font-mono text-sm font-semibold text-sky-600">
                {input.tenure} months
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={72}
              value={input.tenure}
              onChange={(e) => patch({ tenure: Number(e.target.value) })}
              className="mt-3 w-full"
            />
          </label>

          <label className="block">
            <span className="flex items-baseline justify-between">
              <span className="mono-label text-[10px]">monthly charges</span>
              <span className="font-mono text-sm font-semibold text-sky-600">
                ${input.monthlyCharges.toFixed(2)}
              </span>
            </span>
            <input
              type="range"
              min={18.25}
              max={118.75}
              step={0.25}
              value={input.monthlyCharges}
              onChange={(e) => patch({ monthlyCharges: Number(e.target.value) })}
              className="mt-3 w-full"
            />
          </label>

          <Segmented
            label="contract"
            options={CONTRACTS}
            value={input.contract}
            onChange={(v: Contract) => patch({ contract: v })}
          />
          <Segmented
            label="internet service"
            options={INTERNET}
            value={input.internetService}
            onChange={(v: Internet) => patch({ internetService: v })}
          />
          <Segmented
            label="payment method"
            options={PAYMENTS}
            value={input.paymentMethod}
            onChange={(v: Payment) => patch({ paymentMethod: v })}
          />

          <div>
            <p className="mono-label text-[10px]">services</p>
            <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              <Toggle label="Phone" value={input.phoneService} onChange={(v) => patch({ phoneService: v })} />
              <Toggle label="Multi-line" value={input.multipleLines} onChange={(v) => patch({ multipleLines: v })} />
              <Toggle label="Security" value={input.onlineSecurity} onChange={(v) => patch({ onlineSecurity: v })} />
              <Toggle label="Backup" value={input.onlineBackup} onChange={(v) => patch({ onlineBackup: v })} />
              <Toggle label="Protection" value={input.deviceProtection} onChange={(v) => patch({ deviceProtection: v })} />
              <Toggle label="Tech support" value={input.techSupport} onChange={(v) => patch({ techSupport: v })} />
              <Toggle label="Streaming TV" value={input.streamingTv} onChange={(v) => patch({ streamingTv: v })} />
              <Toggle label="Streaming film" value={input.streamingMovies} onChange={(v) => patch({ streamingMovies: v })} />
              <Toggle label="Paperless" value={input.paperlessBilling} onChange={(v) => patch({ paperlessBilling: v })} />
            </div>
          </div>

          <div>
            <p className="mono-label text-[10px]">household</p>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <Toggle label="Senior" value={input.seniorCitizen} onChange={(v) => patch({ seniorCitizen: v })} />
              <Toggle label="Partner" value={input.partner} onChange={(v) => patch({ partner: v })} />
              <Toggle label="Dependents" value={input.dependents} onChange={(v) => patch({ dependents: v })} />
            </div>
          </div>
        </div>
      </Panel>

      {/* ---------------------------- output ---------------------------- */}
      <div className="space-y-4">
        <Panel
          title="Churn probability"
          subtitle="Logistic regression · calibrated on the 7,043-customer population."
          action={<LiveDot label={pending ? "scoring" : `${result?.latencyMs ?? 0}ms`} />}
        >
          <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
            <RiskGauge value={result?.probability ?? 0} band={band} />
            <div className="space-y-3">
              <div className={`rounded-xl px-4 py-3 ring-1 ${ui.bg} ${ui.ring}`}>
                <p className="mono-label text-[9px]">verdict</p>
                <p className={`mt-1 text-xl font-semibold ${ui.text}`}>{band} risk</p>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                  Population baseline is {((result?.baseline ?? 0.265) * 100).toFixed(1)}% — this
                  profile is{" "}
                  <span className="text-slate-800">
                    {(((result?.probability ?? 0) / (result?.baseline || 1)) || 0).toFixed(2)}×
                  </span>{" "}
                  the average customer.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-sky-200/70 bg-white/70 p-3">
                  <p className="mono-label text-[9px]">18-mo revenue at risk</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-rose-600">
                    ${(result?.revenueAtRisk ?? 0).toLocaleString("en-US")}
                  </p>
                </div>
                <div className="rounded-xl border border-sky-200/70 bg-white/70 p-3">
                  <p className="mono-label text-[9px]">recoverable</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-emerald-600">
                    ${(result?.projectedSave ?? 0).toLocaleString("en-US")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          title="Why — SHAP contributions"
          subtitle="φⱼ = βⱼ · (xⱼ − E[xⱼ]). Red pushes toward churn, green protects."
        >
          {result ? (
            <ShapWaterfall drivers={result.drivers} />
          ) : (
            <p className="text-sm text-slate-500">Scoring…</p>
          )}
        </Panel>

        <Panel
          title="Counterfactual levers"
          subtitle="Each lever re-scored by the model. Click to apply it to the profile."
        >
          <div className="space-y-2">
            {(result?.counterfactuals ?? []).map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => applyLever(c.label)}
                className="flex w-full items-center justify-between gap-4 rounded-xl border border-sky-200/60 bg-white/70 px-4 py-3 text-left transition hover:border-sky-400/80 hover:bg-sky-50"
              >
                <span>
                  <span className="block text-[13px] font-medium text-slate-800">{c.label}</span>
                  <span className="block text-[11px] text-slate-500">{c.note}</span>
                </span>
                <span className="text-right">
                  <span
                    className={`block font-mono text-sm font-semibold ${
                      c.delta < 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {c.delta > 0 ? "+" : ""}
                    {(c.delta * 100).toFixed(1)} pts
                  </span>
                  <span className="block font-mono text-[11px] text-slate-500">
                    → {(c.probability * 100).toFixed(1)}%
                  </span>
                </span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Retention playbook" subtitle="Prescribed actions with owner and expected lift.">
          <div className="space-y-3">
            {(result?.actions ?? []).map((a) => (
              <div key={a.title} className="rounded-xl border border-sky-200/60 bg-white/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[14px] font-semibold text-slate-800">{a.title}</p>
                  <span className="shrink-0 rounded-full border border-emerald-300/80 bg-emerald-100/70 px-2 py-0.5 font-mono text-[10px] text-emerald-600">
                    −{(a.lift * 100).toFixed(0)} pts
                  </span>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500">{a.detail}</p>
                <p className="mono-label mt-2 text-[9px]">owner · {a.owner}</p>
              </div>
            ))}
          </div>
        </Panel>

        {recent.length > 0 && (
          <Panel title="Recent scores" subtitle="Written to Postgres on every prediction.">
            <div className="flex flex-wrap gap-2">
              {recent.map((r) => (
                <span
                  key={r.id}
                  className="rounded-lg border border-sky-200/70 bg-white/70 px-2.5 py-1.5 font-mono text-[11px] text-slate-600"
                >
                  #{r.id} · {(r.probability * 100).toFixed(1)}%{" "}
                  <span className="text-slate-500">{r.band}</span>
                </span>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
