"use client";

import { useState, useEffect, useTransition } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import {
  createReport,
  updateReport,
  getReports,
  createReportSchedule,
  updateReportSchedule,
  getReportSchedules,
} from "@/lib/campaigns/actions";
import type { AUReportData } from "@/lib/campaigns/pdf-report";
import type { Report, ReportSchedule, ReportType, ReportFrequency } from "@/lib/campaigns/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── Dynamic pdf() import (avoids SSR issues with @react-pdf/renderer) ────────

// We import the pdf function lazily — the module is only resolved in the browser.
type PdfFn = (element: React.ReactElement) => { toBlob: () => Promise<Blob> };
let pdfFn: PdfFn | null = null;

async function getPdfFn(): Promise<PdfFn> {
  if (!pdfFn) {
    const mod = await import("@react-pdf/renderer");
    pdfFn = mod.pdf as unknown as PdfFn;
  }
  return pdfFn!;
}

// AUReport also lives in a module that imports @react-pdf/renderer — keep it
// lazily loaded on the client only.
const AUReportLazy = dynamic(
  () => import("@/lib/campaigns/pdf-report").then((m) => ({ default: m.AUReport })),
  { ssr: false }
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function defaultRange(type: ReportType): { from: string; to: string } {
  const now = new Date();
  const to = isoDate(now);
  if (type === "weekly") {
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    return { from: isoDate(from), to };
  }
  if (type === "monthly") {
    const from = new Date(now);
    from.setDate(from.getDate() - 30);
    return { from: isoDate(from), to };
  }
  // campaign / custom: last 30 days
  const from = new Date(now);
  from.setDate(from.getDate() - 30);
  return { from: isoDate(from), to };
}

function buildReportTitle(type: ReportType, from: string, to: string) {
  const labels: Record<ReportType, string> = {
    weekly: "Weekly",
    monthly: "Monthly",
    campaign: "Campaign",
    custom: "Custom",
  };
  return `${labels[type]} Report — ${from} to ${to}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
  );
}

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    ready: "bg-green-100 text-green-800",
    generating: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${colours[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ReportGenerator() {
  // ── report generation state ───────────────────────────────────────────────
  const [reportType, setReportType] = useState<ReportType>("weekly");
  const [dateFrom, setDateFrom] = useState(() => defaultRange("weekly").from);
  const [dateTo, setDateTo] = useState(() => defaultRange("weekly").to);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genSuccess, setGenSuccess] = useState<string | null>(null);

  // ── past reports ──────────────────────────────────────────────────────────
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // ── email report ──────────────────────────────────────────────────────────
  const [emailReportId, setEmailReportId] = useState<string | null>(null);
  const [emailTo, setEmailTo] = useState("");
  const [emailPending, startEmailTransition] = useTransition();
  const [emailMsg, setEmailMsg] = useState<string | null>(null);

  // ── schedule ──────────────────────────────────────────────────────────────
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [schedFrequency, setSchedFrequency] = useState<ReportFrequency>("weekly");
  const [schedReportType, setSchedReportType] = useState<ReportType>("weekly");
  const [schedRecipients, setSchedRecipients] = useState("");
  const [schedEnabled, setSchedEnabled] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [schedMsg, setSchedMsg] = useState<string | null>(null);

  // ── load reports & schedules on mount ─────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoadingReports(true);
      const [rResult, sResult] = await Promise.all([getReports(), getReportSchedules()]);
      if (rResult.data) setReports(rResult.data as Report[]);
      if (sResult.data) setSchedules(sResult.data as ReportSchedule[]);
      setLoadingReports(false);
    }
    load();
  }, []);

  // ── update date range when type changes ───────────────────────────────────
  function handleTypeChange(t: ReportType) {
    setReportType(t);
    const r = defaultRange(t);
    setDateFrom(r.from);
    setDateTo(r.to);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Generate + upload PDF
  // ─────────────────────────────────────────────────────────────────────────

  async function handleGenerate() {
    setGenerating(true);
    setGenError(null);
    setGenSuccess(null);

    try {
      const title = buildReportTitle(reportType, dateFrom, dateTo);

      // 1. Create the report record (status = "generating")
      const created = await createReport({
        title,
        report_type: reportType,
        date_from: dateFrom,
        date_to: dateTo,
        data: {},
      });
      if (created.error || !created.data) throw new Error(created.error ?? "Failed to create report record");
      const reportId = created.data.id;

      // 2. Build report data (stubbed — real data would come from analytics queries)
      const reportData: AUReportData = {
        dateFrom,
        dateTo,
        summary: {
          contentPublished: 0,
          emailOpenRate: 0,
          totalSubmissions: 0,
          totalSpend: 0,
        },
        channelPerformance: [],
        funnelDistribution: [],
        budget: {
          planned: 0,
          actual: 0,
          variance: 0,
          variancePct: 0,
        },
      };

      // 3. Generate PDF blob client-side
      const React = (await import("react")).default;
      const { AUReport } = await import("@/lib/campaigns/pdf-report");
      const pdf = await getPdfFn();
      const blob = await pdf(<AUReport data={reportData} />).toBlob();

      // 4. Upload to Supabase Storage `reports` bucket
      const supabase = createClient();
      const fileName = `${reportId}/${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(fileName, blob, { contentType: "application/pdf", upsert: true });
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      // 5. Update report record with pdf_path + status = "ready"
      const updated = await updateReport(reportId, {
        pdf_path: fileName,
        status: "ready",
        data: reportData as unknown as Record<string, unknown>,
      });
      if (updated.error) throw new Error(updated.error);

      setGenSuccess(`Report "${title}" generated successfully.`);

      // Refresh list
      const refreshed = await getReports();
      if (refreshed.data) setReports(refreshed.data as Report[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setGenError(msg);
      // best-effort: mark any in-progress record as failed — not strictly
      // necessary here since the id may not be captured if createReport failed
    } finally {
      setGenerating(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Download link helper
  // ─────────────────────────────────────────────────────────────────────────

  function getPublicUrl(pdfPath: string): string {
    const supabase = createClient();
    const { data } = supabase.storage.from("reports").getPublicUrl(pdfPath);
    return data.publicUrl;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Email report via server action
  // ─────────────────────────────────────────────────────────────────────────

  async function handleEmailReport(report: Report) {
    if (!emailTo.trim()) {
      setEmailMsg("Enter at least one recipient email.");
      return;
    }
    setEmailReportId(report.id);
    setEmailMsg(null);

    startEmailTransition(async () => {
      try {
        const recipients = emailTo.split(",").map((e) => e.trim()).filter(Boolean);
        const { sendReportEmail } = await import("@/lib/campaigns/email-actions");
        const result = await sendReportEmail({
          reportId: report.id,
          reportTitle: report.title,
          pdfPath: report.pdf_path,
          recipients,
        });
        setEmailMsg(result.error ? `Error: ${result.error}` : "Email sent successfully.");
      } catch (err) {
        setEmailMsg(`Error: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setEmailReportId(null);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Schedule create / update
  // ─────────────────────────────────────────────────────────────────────────

  async function handleSaveSchedule() {
    setSavingSchedule(true);
    setSchedMsg(null);

    try {
      const recipients = schedRecipients.split(",").map((e) => e.trim()).filter(Boolean);
      if (recipients.length === 0) throw new Error("Enter at least one recipient email.");

      // Calculate first next_run_at
      const now = new Date();
      const nextRun = new Date(now);
      if (schedFrequency === "weekly") nextRun.setDate(nextRun.getDate() + 7);
      else nextRun.setDate(nextRun.getDate() + 30);

      // Find existing schedule for this type + frequency, update if found
      const existing = schedules.find(
        (s) => s.report_type === schedReportType && s.frequency === schedFrequency
      );

      if (existing) {
        const res = await updateReportSchedule(existing.id, {
          recipients,
          enabled: schedEnabled,
          next_run_at: nextRun.toISOString(),
        });
        if (res.error) throw new Error(res.error);
        setSchedMsg("Schedule updated.");
        setSchedules((prev) =>
          prev.map((s) => (s.id === existing.id ? (res.data as ReportSchedule) : s))
        );
      } else {
        const res = await createReportSchedule({
          report_type: schedReportType,
          frequency: schedFrequency,
          recipients,
          next_run_at: nextRun.toISOString(),
        });
        if (res.error) throw new Error(res.error);
        setSchedMsg("Schedule created.");
        if (res.data) setSchedules((prev) => [res.data as ReportSchedule, ...prev]);
      }
    } catch (err) {
      setSchedMsg(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSavingSchedule(false);
    }
  }

  async function handleToggleSchedule(schedule: ReportSchedule) {
    const res = await updateReportSchedule(schedule.id, { enabled: !schedule.enabled });
    if (!res.error && res.data) {
      setSchedules((prev) => prev.map((s) => (s.id === schedule.id ? (res.data as ReportSchedule) : s)));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Generate Report ── */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Report type selector */}
          <div className="flex flex-wrap gap-2">
            {(["weekly", "monthly", "campaign", "custom"] as ReportType[]).map((t) => (
              <button
                key={t}
                onClick={() => handleTypeChange(t)}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                  reportType === t
                    ? "border-teal-600 bg-teal-600 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Date range */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
              />
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <span className="flex items-center gap-2">
                <Spinner /> Generating…
              </span>
            ) : (
              "Generate Report"
            )}
          </Button>

          {genSuccess && (
            <p className="text-sm text-green-700">{genSuccess}</p>
          )}
          {genError && (
            <p className="text-sm text-red-600">{genError}</p>
          )}
        </CardContent>
      </Card>

      {/* ── Past Reports ── */}
      <Card>
        <CardHeader>
          <CardTitle>Past Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingReports ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-gray-500">No reports yet.</p>
          ) : (
            <div className="space-y-3">
              {/* Email recipient input (shared) */}
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Recipient emails (comma-separated)"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              {emailMsg && (
                <p
                  className={`text-sm ${emailMsg.startsWith("Error") ? "text-red-600" : "text-green-700"}`}
                >
                  {emailMsg}
                </p>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-gray-500 uppercase">
                      <th className="py-2 pr-4">Title</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Period</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Created</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{r.title}</td>
                        <td className="py-2 pr-4 capitalize">{r.report_type}</td>
                        <td className="py-2 pr-4 text-gray-600">
                          {r.date_from ?? "—"} → {r.date_to ?? "—"}
                        </td>
                        <td className="py-2 pr-4">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="py-2 pr-4 text-gray-500">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            {r.pdf_path && (
                              <a
                                href={getPublicUrl(r.pdf_path)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-teal-600 hover:underline"
                              >
                                Download
                              </a>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={emailPending && emailReportId === r.id}
                              onClick={() => handleEmailReport(r)}
                            >
                              {emailPending && emailReportId === r.id ? (
                                <span className="flex items-center gap-1">
                                  <Spinner /> Sending…
                                </span>
                              ) : (
                                "Email Report"
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Schedule ── */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing schedules */}
          {schedules.length > 0 && (
            <div className="space-y-2 mb-4">
              {schedules.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-md border p-3 text-sm"
                >
                  <div>
                    <span className="font-medium capitalize">{s.frequency}</span>
                    {" · "}
                    <span className="capitalize text-gray-600">{s.report_type}</span>
                    {" · "}
                    <span className="text-gray-500">{s.recipients.join(", ")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium ${
                        s.enabled ? "text-green-600" : "text-gray-400"
                      }`}
                    >
                      {s.enabled ? "Enabled" : "Disabled"}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleSchedule(s)}
                    >
                      {s.enabled ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New schedule form */}
          <div className="space-y-3 rounded-md border p-4">
            <p className="text-sm font-medium text-gray-700">Create / Update Schedule</p>

            <div className="flex flex-wrap gap-3">
              {/* Frequency */}
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Frequency</label>
                <select
                  value={schedFrequency}
                  onChange={(e) => setSchedFrequency(e.target.value as ReportFrequency)}
                  className="block rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {/* Report type */}
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Report Type</label>
                <select
                  value={schedReportType}
                  onChange={(e) => setSchedReportType(e.target.value as ReportType)}
                  className="block rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="campaign">Campaign</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>

            {/* Recipients */}
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Recipients (comma-separated emails)</label>
              <Input
                type="text"
                placeholder="alice@example.com, bob@example.com"
                value={schedRecipients}
                onChange={(e) => setSchedRecipients(e.target.value)}
                className="max-w-md"
              />
            </div>

            {/* Enable/disable toggle */}
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={schedEnabled}
                onChange={(e) => setSchedEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              Enable schedule
            </label>

            <Button onClick={handleSaveSchedule} disabled={savingSchedule}>
              {savingSchedule ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Saving…
                </span>
              ) : (
                "Save Schedule"
              )}
            </Button>

            {schedMsg && (
              <p
                className={`text-sm ${schedMsg.startsWith("Error") ? "text-red-600" : "text-green-700"}`}
              >
                {schedMsg}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hidden — ensures AUReport is bundled (but never rendered to DOM directly) */}
      <div className="hidden">
        <AUReportLazy data={{ dateFrom: "", dateTo: "", summary: { contentPublished: 0, emailOpenRate: 0, totalSubmissions: 0, totalSpend: 0 }, channelPerformance: [], funnelDistribution: [], budget: { planned: 0, actual: 0, variance: 0, variancePct: 0 } }} />
      </div>
    </div>
  );
}
