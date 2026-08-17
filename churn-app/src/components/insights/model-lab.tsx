"use client";

import { useEffect, useState } from "react";
import { BarSeries, Legend, LineChart, Panel } from "@/components/charts";
import { Tag } from "@/components/ui";

export type ModelResponse = {
  source: string;
  auc: number;
  roc: { fpr: number; tpr: number; threshold: number }[];
  confusion: {
    threshold: number;
    tp: number;
    fp: number;
    tn: number;
    fn: number;
    precision: number;
    recall: number;
    f1: number;
    accuracy: number;
    specificity: number;
    capturedRevenue: number;
  };
  best: { t: number; f1: number };
  shap: { key: string; label: string; importance: number; direction: number }[];
  survival: { label: string; color: string; median: number | null; points: { t: number; s: number }[] }[];
};

const pct = (v: number, d = 1) => `${(v * 100).toFixed(d)}%`;

export function ModelLab({ initial }: { initial: ModelResponse }) {
  const [threshold, setThreshold] = useState(initial.confusion.threshold);
  const [data, setData] = useState<ModelResponse>(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (threshold === initial.confusion.threshold) {
      setData(initial);
      return;
    }
    let alive = true;
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/model?t=${threshold}`);
        const json = (await res.json()) as ModelResponse;
        if (alive) setData(json);
      } finally {
        if (alive) setLoading(false);
      }
    }, 220);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [threshold, initial]);

  const c = data.confusion;
  const flagged = c.tp + c.fp;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <Panel
          title="ROC curve"
          subtitle="True-positive vs false-positive rate across every threshold, recomputed from live scores."
          action={<Tag tone="cyan">AUC {data.auc.toFixed(3)}</Tag>}
        >
          <LineChart
            series={[
              {
                label: "model",
                color: "#0284c7",
                points: data.roc.map((p) => ({ x: p.fpr, y: p.tpr })),
              },
            ]}
            xMax={1}
            yMax={1}
            diagonal
            area
            height={300}
            xLabel="false positive rate"
            yLabel="true positive rate"
            xTickFormat={(v) => v.toFixed(1)}
          />
          <p className="mt-3 text-[12px] leading-relaxed text-slate-500">
            A random classifier tracks the dashed diagonal (AUC 0.50). This model reaches{" "}
            <span className="text-sky-600">{data.auc.toFixed(3)}</span> — the same order as the
            offline scikit-learn evaluation (0.84) reported in the study.
          </p>
        </Panel>

        <Panel
          title="Threshold tuner"
          subtitle="Retention budget is finite. Move the cut-off and watch precision trade against recall."
          action={
            <button
              type="button"
              onClick={() => setThreshold(data.best.t)}
              className="rounded-lg border border-sky-300/80 bg-sky-100/80 px-3 py-1.5 font-mono text-[11px] text-sky-700 transition hover:bg-sky-200"
            >
              jump to best F1 ({data.best.t})
            </button>
          }
        >
          <label className="block">
            <span className="flex items-baseline justify-between">
              <span className="mono-label text-[10px]">decision threshold</span>
              <span className="font-mono text-lg font-semibold text-sky-600">
                {threshold.toFixed(2)}
              </span>
            </span>
            <input
              type="range"
              min={0.05}
              max={0.9}
              step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="mt-3 w-full"
            />
          </label>

          <div className="mt-6 grid grid-cols-2 gap-2">
            {[
              { k: "true positives", v: c.tp, tone: "text-emerald-600", sub: "churners caught" },
              { k: "false positives", v: c.fp, tone: "text-amber-600", sub: "wasted outreach" },
              { k: "false negatives", v: c.fn, tone: "text-rose-600", sub: "churners missed" },
              { k: "true negatives", v: c.tn, tone: "text-slate-600", sub: "correctly ignored" },
            ].map((cell) => (
              <div key={cell.k} className="rounded-xl border border-sky-200/60 bg-white/70 p-3">
                <p className="mono-label text-[9px]">{cell.k}</p>
                <p className={`mt-1 font-mono text-2xl font-semibold ${cell.tone}`}>
                  {cell.v.toLocaleString("en-US")}
                </p>
                <p className="text-[10.5px] text-slate-500">{cell.sub}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { k: "precision", v: pct(c.precision) },
              { k: "recall", v: pct(c.recall) },
              { k: "F1", v: c.f1.toFixed(3) },
              { k: "accuracy", v: pct(c.accuracy) },
            ].map((m) => (
              <div key={m.k}>
                <p className="mono-label text-[9px]">{m.k}</p>
                <p className="mt-1 font-mono text-base font-semibold text-slate-800">{m.v}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-sky-200/80 bg-sky-50/90 p-4">
            <p className="text-[12.5px] leading-relaxed text-slate-600">
              At a {threshold.toFixed(2)} cut-off the team contacts{" "}
              <span className="font-semibold text-slate-800">{flagged.toLocaleString("en-US")}</span>{" "}
              customers, catches{" "}
              <span className="font-semibold text-emerald-600">{pct(c.recall)}</span> of everyone who
              would have left, and protects{" "}
              <span className="font-semibold text-sky-700">
                ${c.capturedRevenue.toLocaleString("en-US")}
              </span>{" "}
              of monthly recurring revenue. {loading && <span className="text-slate-500">…</span>}
            </p>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Global feature importance (SHAP)"
          subtitle="Mean |φ| over the population. Exact for a linear model — no sampling approximation."
        >
          <BarSeries
            data={data.shap.map((s) => ({
              label: s.label,
              value: s.importance,
              caption: s.direction > 0 ? "↑ increases churn risk" : "↓ protects retention",
              color:
                s.direction > 0
                  ? "linear-gradient(90deg,#e11d48,#be123c)"
                  : "linear-gradient(90deg,#059669,#047857)",
            }))}
            format={(v) => v.toFixed(3)}
          />
        </Panel>

        <Panel
          title="Kaplan-Meier survival by contract"
          subtitle="Event = churn at observed tenure; active customers are right-censored."
        >
          <LineChart
            series={data.survival.map((s) => ({
              label: s.label,
              color: s.color,
              points: s.points.map((p) => ({ x: p.t, y: p.s })),
            }))}
            xMax={72}
            height={300}
            xLabel="tenure (months)"
            yLabel="survival probability"
          />
          <div className="mt-4">
            <Legend
              items={data.survival.map((s) => ({
                label: s.label,
                color: s.color,
                extra: s.median ? `median ${s.median} mo` : "median > 72 mo",
              }))}
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}
