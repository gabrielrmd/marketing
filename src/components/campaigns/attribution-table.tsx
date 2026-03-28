"use client";

import { useState } from "react";

type AttributionRow = {
  source: string;
  conversions: number;
  revenue: number;
  cpa: number;
  ltv: number;
};

type SortKey = keyof AttributionRow;
type SortDir = "asc" | "desc";

type AttributionTableProps = {
  data: AttributionRow[];
};

function fmt$(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
}

function SortIcon({ dir }: { dir: SortDir | null }) {
  if (!dir) {
    return (
      <svg className="ml-1 inline size-3 opacity-30" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 2L5 6h6L8 2zm0 12l3-4H5l3 4z" />
      </svg>
    );
  }
  return dir === "asc" ? (
    <svg className="ml-1 inline size-3" viewBox="0 0 16 16" fill="currentColor">
      <path fillRule="evenodd" d="M8 14a.75.75 0 0 1-.75-.75V4.56L4.03 7.78a.75.75 0 0 1-1.06-1.06l4.5-4.5a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06L8.75 4.56v8.69A.75.75 0 0 1 8 14Z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg className="ml-1 inline size-3" viewBox="0 0 16 16" fill="currentColor">
      <path fillRule="evenodd" d="M8 2a.75.75 0 0 1 .75.75v8.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.22 3.22V2.75A.75.75 0 0 1 8 2Z" clipRule="evenodd" />
    </svg>
  );
}

export function AttributionTable({ data }: AttributionTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === "string" && typeof bv === "string") {
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    return sortDir === "asc"
      ? (av as number) - (bv as number)
      : (bv as number) - (av as number);
  });

  const totals = data.reduce(
    (acc, row) => ({
      conversions: acc.conversions + row.conversions,
      revenue: acc.revenue + row.revenue,
      cpa: 0, // recalculated
      ltv: 0, // recalculated
    }),
    { conversions: 0, revenue: 0, cpa: 0, ltv: 0 }
  );
  totals.cpa = totals.conversions > 0 ? totals.revenue / totals.conversions : 0;
  totals.ltv = data.length > 0 ? totals.revenue / data.length : 0;

  const cols: { key: SortKey; label: string; numeric?: boolean }[] = [
    { key: "source", label: "Source" },
    { key: "conversions", label: "Conversions", numeric: true },
    { key: "revenue", label: "Revenue", numeric: true },
    { key: "cpa", label: "CPA", numeric: true },
    { key: "ltv", label: "LTV", numeric: true },
  ];

  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No attribution data for this period.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {cols.map((col) => (
              <th
                key={col.key}
                className={[
                  "cursor-pointer select-none px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors",
                  col.numeric ? "text-right" : "text-left",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => handleSort(col.key)}
              >
                {col.label}
                <SortIcon dir={sortKey === col.key ? sortDir : null} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={row.source}
              className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
            >
              <td className="px-4 py-2.5 font-medium">{row.source}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">
                {row.conversions.toLocaleString()}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums">{fmt$(row.revenue)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{fmt$(row.cpa)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{fmt$(row.ltv)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border bg-muted/40 font-semibold">
            <td className="px-4 py-2.5">Totals</td>
            <td className="px-4 py-2.5 text-right tabular-nums">
              {totals.conversions.toLocaleString()}
            </td>
            <td className="px-4 py-2.5 text-right tabular-nums">{fmt$(totals.revenue)}</td>
            <td className="px-4 py-2.5 text-right tabular-nums">{fmt$(totals.cpa)}</td>
            <td className="px-4 py-2.5 text-right tabular-nums">{fmt$(totals.ltv)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
