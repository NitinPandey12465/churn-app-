import type { Metadata } from "next";
import { Scorer } from "@/components/predict/scorer";
import { Tag } from "@/components/ui";

export const metadata: Metadata = {
  title: "Risk Scorer",
  description:
    "Score any customer profile in real time: churn probability, exact SHAP attributions, counterfactual levers and a prescriptive retention playbook.",
};

export default function PredictPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <header className="mb-9 flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className="mono-label">real-time inference</span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-800 sm:text-4xl">
            Score a customer, <span className="grad-text">see the reason</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
            The same logistic regression that scored the 7,043-customer book, running server-side on
            every keystroke. Exact Shapley attributions, counterfactual simulation and a costed
            playbook — no black box.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Tag tone="cyan">AUC 0.84</Tag>
          <Tag tone="violet">recall 75.7%</Tag>
          <Tag tone="emerald">F1 0.628 ± 0.021</Tag>
        </div>
      </header>
      <Scorer />
    </div>
  );
}
