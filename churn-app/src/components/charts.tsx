import type { ReactNode } from "react";

const pct = (v: number, d = 1) => `${(v * 100).toFixed(d)}%`;

/* ------------------------------- bar series ------------------------------- */

export function BarSeries({
  data,
  format = (v: number) => pct(v),
  max,
}: {
  data: { label: string; value: number; caption?: string; color?: string }[];
  format?: (v: number) => string;
  max?: number;
}) {
  const peak = max ?? Math.max(...data.map((d) => d.value), 0.0001);
  return (
    <div className="space-y-4">
      {data.map((d, i) => (
        <div key={d.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="text-[13px] font-medium text-slate-700">{d.label}</span>
            <span className="font-mono text-[13px] tabular-nums text-slate-800">{format(d.value)}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-sky-100 ring-1 ring-inset ring-sky-200/70">
            <div
              className="h-full rounded-full transition-[width] duration-1000 ease-out"
              style={{
                width: `${Math.max(2, (d.value / peak) * 100)}%`,
                background:
                  d.color ??
                  `linear-gradient(90deg, hsl(${196 - i * 22} 88% 48%), hsl(${248 - i * 14} 78% 62%))`,
                boxShadow: "0 6px 14px -8px rgba(14,116,190,0.9)",
              }}
            />
          </div>
          {d.caption && <p className="mt-1 text-[11px] text-slate-500">{d.caption}</p>}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------- line chart ------------------------------- */

export type Series = { label: string; color: string; points: { x: number; y: number }[] };

export function LineChart({
  series,
  xMax,
  yMax = 1,
  xLabel,
  yLabel,
  diagonal = false,
  height = 260,
  yTickFormat = (v: number) => pct(v, 0),
  xTickFormat = (v: number) => `${v}`,
  area = false,
}: {
  series: Series[];
  xMax: number;
  yMax?: number;
  xLabel?: string;
  yLabel?: string;
  diagonal?: boolean;
  height?: number;
  yTickFormat?: (v: number) => string;
  xTickFormat?: (v: number) => string;
  area?: boolean;
}) {
  const W = 620;
  const H = height;
  const pad = { l: 46, r: 16, t: 14, b: 34 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const sx = (x: number) => pad.l + (x / xMax) * iw;
  const sy = (y: number) => pad.t + ih - (y / yMax) * ih;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img">
      <defs>
        {series.map((s, i) => (
          <linearGradient key={s.label} id={`fill-${i}-${s.label.replace(/\W/g, "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line
            x1={pad.l}
            x2={W - pad.r}
            y1={sy(t * yMax)}
            y2={sy(t * yMax)}
            stroke="rgba(120,165,205,0.34)"
            strokeDasharray="3 5"
          />
          <text
            x={pad.l - 8}
            y={sy(t * yMax) + 4}
            textAnchor="end"
            className="fill-slate-500"
            style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
          >
            {yTickFormat(t * yMax)}
          </text>
        </g>
      ))}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <text
          key={`x${t}`}
          x={sx(t * xMax)}
          y={H - 12}
          textAnchor="middle"
          className="fill-slate-500"
          style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
        >
          {xTickFormat(Math.round(t * xMax * 100) / 100)}
        </text>
      ))}
      {diagonal && (
        <line
          x1={sx(0)}
          y1={sy(0)}
          x2={sx(xMax)}
          y2={sy(yMax)}
          stroke="rgba(96,140,182,0.5)"
          strokeDasharray="5 6"
        />
      )}
      {series.map((s, i) => {
        const d = s.points.map((p, j) => `${j === 0 ? "M" : "L"}${sx(p.x)},${sy(p.y)}`).join(" ");
        const last = s.points[s.points.length - 1];
        const areaPath = `${d} L${sx(last?.x ?? 0)},${sy(0)} L${sx(s.points[0]?.x ?? 0)},${sy(0)} Z`;
        return (
          <g key={s.label}>
            {area && <path d={areaPath} fill={`url(#fill-${i}-${s.label.replace(/\W/g, "")})`} />}
            <path
              d={d}
              fill="none"
              stroke={s.color}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 0 6px ${s.color}66)` }}
            />
          </g>
        );
      })}
      {xLabel && (
        <text
          x={W / 2}
          y={H - 1}
          textAnchor="middle"
          className="fill-slate-500"
          style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase" }}
        >
          {xLabel}
        </text>
      )}
      {yLabel && (
        <text
          x={12}
          y={pad.t + ih / 2}
          textAnchor="middle"
          transform={`rotate(-90 12 ${pad.t + ih / 2})`}
          className="fill-slate-500"
          style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase" }}
        >
          {yLabel}
        </text>
      )}
    </svg>
  );
}

export function Legend({ items }: { items: { label: string; color: string; extra?: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-2 text-[12px] text-slate-600">
          <span className="h-2 w-6 rounded-full" style={{ background: i.color }} />
          {i.label}
          {i.extra && <span className="font-mono text-[11px] text-slate-500">{i.extra}</span>}
        </span>
      ))}
    </div>
  );
}

/* --------------------------------- gauge ---------------------------------- */

export function RiskGauge({ value, band }: { value: number; band: string }) {
  const R = 88;
  const CX = 110;
  const CY = 112;
  const circumference = Math.PI * R;
  const filled = circumference * Math.min(1, Math.max(0, value));
  const angle = 180 + 180 * Math.min(1, Math.max(0, value));
  const rad = (angle * Math.PI) / 180;
  return (
    <div className="relative">
      <svg viewBox="0 0 220 140" className="h-auto w-full max-w-[280px]">
        <defs>
          <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0d9488" />
            <stop offset="38%" stopColor="#38bdf8" />
            <stop offset="68%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>
        </defs>
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none"
          stroke="rgba(148,190,222,0.32)"
          strokeWidth={16}
          strokeLinecap="round"
        />
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none"
          stroke="url(#gauge-grad)"
          strokeWidth={16}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          style={{ transition: "stroke-dasharray 900ms cubic-bezier(0.16,1,0.3,1)" }}
        />
        <line
          x1={CX}
          y1={CY}
          x2={CX + Math.cos(rad) * (R - 22)}
          y2={CY + Math.sin(rad) * (R - 22)}
          stroke="#334155"
          strokeWidth={3}
          strokeLinecap="round"
          style={{ transition: "all 900ms cubic-bezier(0.16,1,0.3,1)" }}
        />
        <circle cx={CX} cy={CY} r={7} fill="#ffffff" stroke="#334155" strokeWidth={2.5} />
        <text
          x={CX}
          y={CY - 26}
          textAnchor="middle"
          className="fill-slate-800"
          style={{ fontSize: 34, fontWeight: 700, fontFamily: "var(--font-mono)" }}
        >
          {(value * 100).toFixed(1)}%
        </text>
        <text
          x={CX}
          y={CY - 8}
          textAnchor="middle"
          style={{ fontSize: 10, letterSpacing: "0.24em", fill: "#6b8db0" }}
        >
          {band.toUpperCase()} RISK
        </text>
      </svg>
    </div>
  );
}

/* ------------------------------- shap waterfall --------------------------- */

export function ShapWaterfall({
  drivers,
  maxAbs,
}: {
  drivers: { label: string; value: number }[];
  maxAbs?: number;
}) {
  const peak = maxAbs ?? Math.max(...drivers.map((d) => Math.abs(d.value)), 0.001);
  return (
    <div className="space-y-2.5">
      {drivers.map((d) => {
        const w = (Math.abs(d.value) / peak) * 50;
        const pos = d.value > 0;
        return (
          <div key={d.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="relative h-7 w-full rounded-md bg-white/75">
              <div className="absolute inset-y-0 left-1/2 w-px bg-slate-300" />
              <div
                className="absolute inset-y-1 rounded-[5px] transition-all duration-700"
                style={{
                  width: `${w}%`,
                  left: pos ? "50%" : `${50 - w}%`,
                  background: pos
                    ? "linear-gradient(90deg,#e11d4833,#be123c)"
                    : "linear-gradient(90deg,#047857,#05966933)",
                  boxShadow: pos ? "0 0 16px -6px #be123c" : "0 0 16px -6px #059669",
                }}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-slate-700">
                {d.label}
              </span>
            </div>
            <span
              className={`w-16 text-right font-mono text-[12px] tabular-nums ${
                pos ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {d.value > 0 ? "+" : ""}
              {d.value.toFixed(3)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------- heatmap -------------------------------- */

export function Heatmap({
  cells,
  rows,
  cols,
}: {
  cells: { contract: string; bucket: string; rate: number; total: number }[];
  rows: string[];
  cols: readonly string[];
}) {
  const peak = Math.max(...cells.map((c) => c.rate), 0.01);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="mono-label px-2 text-left">contract \ tenure</th>
            {cols.map((c) => (
              <th key={c} className="mono-label px-2 text-center">
                {c} mo
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r}>
              <td className="whitespace-nowrap px-2 text-[13px] font-medium text-slate-700">{r}</td>
              {cols.map((c) => {
                const cell = cells.find((x) => x.contract === r && x.bucket === c);
                const v = cell?.rate ?? 0;
                const intensity = Math.min(1, v / peak);
                return (
                  <td key={c} className="p-0">
                    <div
                      title={`${cell?.total ?? 0} customers`}
                      className="group relative grid h-14 place-items-center rounded-lg border transition hover:scale-[1.04]"
                      style={{
                        background: `linear-gradient(135deg, rgba(244,63,94,${intensity * 0.68}), rgba(139,92,246,${
                          intensity * 0.34
                        }))`,
                        borderColor: `rgba(255,255,255,${0.06 + intensity * 0.22})`,
                      }}
                    >
                      <span className="font-mono text-[13px] font-semibold text-slate-800">
                        {(v * 100).toFixed(1)}%
                      </span>
                      <span className="absolute bottom-1 font-mono text-[9px] text-slate-500">
                        n={cell?.total ?? 0}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* --------------------------------- donut ---------------------------------- */

export function Donut({
  value,
  label,
  caption,
  color = "#0284c7",
}: {
  value: number;
  label: string;
  caption?: string;
  color?: string;
}) {
  const R = 54;
  const C = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 140 140" className="h-28 w-28 -rotate-90">
        <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(148,190,222,0.32)" strokeWidth={13} />
        <circle
          cx="70"
          cy="70"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={13}
          strokeLinecap="round"
          strokeDasharray={`${C * value} ${C}`}
          style={{ filter: `drop-shadow(0 0 8px ${color}88)` }}
        />
      </svg>
      <div>
        <p className="font-mono text-2xl font-semibold text-slate-800">{pct(value)}</p>
        <p className="text-sm text-slate-600">{label}</p>
        {caption && <p className="mt-1 text-[11px] text-slate-500">{caption}</p>}
      </div>
    </div>
  );
}

/* -------------------------------- panel ----------------------------------- */

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`glass rounded-2xl p-5 sm:p-6 ${className}`}>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight text-slate-800">{title}</h3>
          {subtitle && <p className="mt-1 text-xs leading-relaxed text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
