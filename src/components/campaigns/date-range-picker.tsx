"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type DateRange = { from: string; to: string };

type DateRangePickerProps = {
  from: string;
  to: string;
  onChange: (range: DateRange) => void;
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const PRESETS: { label: string; getRange: () => DateRange }[] = [
  {
    label: "Last 7 days",
    getRange() {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - 6);
      return { from: isoDate(from), to: isoDate(to) };
    },
  },
  {
    label: "Last 30 days",
    getRange() {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - 29);
      return { from: isoDate(from), to: isoDate(to) };
    },
  },
  {
    label: "This month",
    getRange() {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: isoDate(from), to: isoDate(to) };
    },
  },
  {
    label: "Last quarter",
    getRange() {
      const now = new Date();
      const currentQ = Math.floor(now.getMonth() / 3);
      const prevQ = currentQ === 0 ? 3 : currentQ - 1;
      const year = currentQ === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const from = new Date(year, prevQ * 3, 1);
      const to = new Date(year, prevQ * 3 + 3, 0);
      return { from: isoDate(from), to: isoDate(to) };
    },
  },
];

export function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground shrink-0">From</label>
        <Input
          type="date"
          value={from}
          onChange={(e) => onChange({ from: e.target.value, to })}
          className="w-36"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground shrink-0">To</label>
        <Input
          type="date"
          value={to}
          onChange={(e) => onChange({ from, to: e.target.value })}
          className="w-36"
        />
      </div>
      <div className="flex flex-wrap gap-1.5 ml-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="xs"
            onClick={() => onChange(preset.getRange())}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
