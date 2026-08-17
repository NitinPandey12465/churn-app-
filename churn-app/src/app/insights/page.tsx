import type { Metadata } from "next";
import { Panel } from "@/components/charts";
import { ModelLab, type ModelResponse } from "@/components/insights/model-lab";
import { Reveal, Tag } from "@/components/ui";
import {
  bestThreshold,
  confusionAt,
  globalShap,
  rocCurve,
  survivalByContract,
} from "@/lib/analytics";
import { loadCustomers } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Model Lab",
  description:
    "ROC/AUC, threshold tuning, confusion matrix, SHAP global importance and Kaplan-Meier survival curves — all recomputed from live data.",
};

const MODELS = [
  {
    name: "Logistic Regression",
    auc: "0.840",
    f1: "0.628",
    recall: "75.7%",
    note: "Selected — best recall at an interpretable, exactly explainable form",
    selected: true,
  },
  {
    name: "XGBoost (tuned)",
    auc: "0.838",
    f1: "0.617",
    recall: "71.4%",
    note: "No material lift over the linear baseline; higher serving cost",
    selected: false,
  },
  {
    name: "Random Forest",
    auc: "0.821",
    f1: "0.601",
    recall: "68.2%",
    note: "Overfits deep tenure splits; weakest recall of the three",
    selected: false,
  },
];

const SQL_SNIPPET = `-- churn rate and revenue exposure by contract type
SELECT c.contract,
       COUNT(*)                                   AS customers,
       ROUND(AVG(f.churn::int) * 100, 2)          AS churn_rate_pct,
       ROUND(SUM(f.monthly_charges) FILTER
             (WHERE f.churn IS FALSE
              AND f.risk_score >= 0.5)::numeric, 2) AS mrr_at_risk
FROM   fact_billing f
JOIN   dim_contracts c USING (customer_id)
GROUP  BY c.contract
ORDER  BY churn_rate_pct DESC;`;

export default async function InsightsPage() {
  const snap = await loadCustomers();
  const rows = snap.rows;
  const roc = rocCurve(rows);
  const best = bestThreshold(rows);

  const initial: ModelResponse = {
    source: snap.source,
    auc: roc.auc,
    roc: roc.points,
    confusion: confusionAt(rows, best.t),
    best,
    shap: globalShap(rows, 10),
    survival: survivalByContract(rows),
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <header className="mb-9 flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className="mono-label">model lab</span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">
            Open the <span className="grad-text">black box</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
            Nothing here is a screenshot. ROC, F1, the confusion matrix, SHAP importances and the
            survival curves are all recalculated from the {rows.length.toLocaleString("en-US")}{" "}
            scored records currently in the database.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Tag tone="cyan">AUC {initial.auc.toFixed(3)}</Tag>
          <Tag tone="violet">best F1 {initial.best.f1.toFixed(3)}</Tag>
          <Tag tone="emerald">source {snap.source}</Tag>
        </div>
      </header>

      <ModelLab initial={initial} />

      <Reveal>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <Panel
            title="Model selection"
            subtitle="Three candidates, 5-fold stratified cross-validation, tuned decision threshold."
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-sky-200/70">
                    {["Model", "AUC", "F1", "Recall", "Verdict"].map((h) => (
                      <th
                        key={h}
                        className="pb-3 pr-4 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODELS.map((m) => (
                    <tr
                      key={m.name}
                      className={`border-b border-sky-100 ${
                        m.selected ? "bg-sky-50/90" : ""
                      }`}
                    >
                      <td className="py-3 pr-4 font-medium text-slate-800">
                        {m.name}
                        {m.selected && (
                          <span className="ml-2 rounded-full border border-sky-300/80 bg-sky-100/80 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-sky-600">
                            shipped
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 font-mono text-slate-600">{m.auc}</td>
                      <td className="py-3 pr-4 font-mono text-slate-600">{m.f1}</td>
                      <td className="py-3 pr-4 font-mono text-slate-600">{m.recall}</td>
                      <td className="py-3 pr-4 text-[12.5px] text-slate-500">{m.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[12.5px] leading-relaxed text-slate-500">
              Cross-validated F1 for the shipped model: <span className="text-slate-800">0.628 ± 0.021</span>.
              Gradient boosting bought no meaningful accuracy, so the interpretable model won — a
              churn model nobody trusts never gets actioned.
            </p>
          </Panel>

          <Panel
            title="The SQL layer"
            subtitle="Four normalized tables: dim_customers, dim_services, dim_contracts, fact_billing."
          >
            <pre className="overflow-x-auto rounded-xl border border-sky-200/70 bg-sky-50/90 p-4 font-mono text-[11.5px] leading-relaxed text-sky-900">
              {SQL_SNIPPET}
            </pre>
            <ul className="mt-4 space-y-2 text-[12.5px] text-slate-600">
              <li>
                • Month-to-month churn <span className="font-mono text-rose-600">42.71%</span> vs
                two-year <span className="font-mono text-emerald-600">2.83%</span>
              </li>
              <li>
                • High-risk cohort monthly revenue at risk{" "}
                <span className="font-mono text-amber-600">$50,899</span> (pgAdmin), $53,178 after
                model scoring
              </li>
              <li>
                • Churned customers average <span className="font-mono">18 months</span> tenure vs{" "}
                <span className="font-mono">37 months</span> retained
              </li>
            </ul>
          </Panel>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              t: "Class imbalance",
              d: "26.5% positives. Handled with class weights + threshold tuning rather than naive resampling, which distorted calibration.",
            },
            {
              t: "Leakage control",
              d: "TotalCharges is a deterministic function of tenure × charges — kept out of the feature set to avoid target leakage.",
            },
            {
              t: "Validation",
              d: "Stratified 5-fold CV, hold-out test split, and a threshold chosen on the validation fold only.",
            },
            {
              t: "Explainability",
              d: "Linear SHAP gives exact attributions; every prediction on this site ships with its own waterfall.",
            },
          ].map((n) => (
            <div key={n.t} className="glass card-hover rounded-2xl p-5">
              <p className="text-[14px] font-semibold text-slate-800">{n.t}</p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">{n.d}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
