import { calculateBudgetRollup } from "@/lib/campaigns/analytics";
import type { BudgetEntry } from "@/lib/campaigns/types";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  entries: BudgetEntry[];
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtCurrency(n: number): string {
  return `$${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function BudgetSummary({ entries }: Props) {
  const rollup = calculateBudgetRollup(entries);
  const isOverspend = rollup.actual > rollup.planned && rollup.planned > 0;
  const isUnderBudget = rollup.actual <= rollup.planned && rollup.actual > 0;

  return (
    <div className="space-y-4">
      {/* Overspend alert */}
      {isOverspend && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 flex items-start gap-3">
          <span className="text-red-600 dark:text-red-400 font-bold text-lg leading-none mt-0.5">
            !
          </span>
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              Over Budget
            </p>
            <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">
              Actual spend exceeds planned budget by{" "}
              {fmtCurrency(Math.abs(rollup.variance))} (
              {Math.abs(rollup.variancePct).toFixed(1)}%)
            </p>
          </div>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Planned */}
        <div className="rounded-lg border p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Planned
          </p>
          <p className="font-[family-name:var(--font-oswald)] text-2xl font-bold text-[#2AB9B0]">
            {rollup.planned > 0 ? fmtCurrency(rollup.planned) : "—"}
          </p>
          <p className="text-xs text-muted-foreground">total planned</p>
        </div>

        {/* Actual */}
        <div className="rounded-lg border p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Actual
          </p>
          <p
            className={`font-[family-name:var(--font-oswald)] text-2xl font-bold ${
              isOverspend
                ? "text-red-600 dark:text-red-400"
                : isUnderBudget
                ? "text-green-600 dark:text-green-400"
                : "text-foreground"
            }`}
          >
            {rollup.actual > 0 ? fmtCurrency(rollup.actual) : "—"}
          </p>
          <p className="text-xs text-muted-foreground">total spent</p>
        </div>

        {/* Variance */}
        <div className="rounded-lg border p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Variance
          </p>
          <p
            className={`font-[family-name:var(--font-oswald)] text-2xl font-bold ${
              rollup.variance >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {rollup.planned === 0 && rollup.actual === 0
              ? "—"
              : `${rollup.variance >= 0 ? "+" : "-"}${fmtCurrency(rollup.variance)}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {rollup.variancePct !== 0
              ? `${rollup.variancePct >= 0 ? "+" : ""}${rollup.variancePct.toFixed(1)}% vs planned`
              : "vs planned"}
          </p>
        </div>
      </div>
    </div>
  );
}
