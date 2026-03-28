import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ─── Font Registration ─────────────────────────────────────────────────────────

Font.register({
  family: "Oswald",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/oswald/v53/TK3_WkUHHAIjg75cFRf3bXL8LICs1_FvsUZiZQ.woff2",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/oswald/v53/TK3_WkUHHAIjg75cFRf3bXL8LICs13FvsUZiZQ.woff2",
      fontWeight: 700,
    },
  ],
});

Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2",
      fontWeight: 600,
    },
  ],
});

// ─── AU Brand Colors ───────────────────────────────────────────────────────────

const COLORS = {
  teal: "#2AB9B0",
  green: "#8ED16A",
  orange: "#F28C28",
  yellow: "#F8CE30",
  charcoal: "#333333",
  lightGray: "#F5F5F5",
  medGray: "#E0E0E0",
  textGray: "#666666",
  white: "#FFFFFF",
  red: "#E53E3E",
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 10,
    color: COLORS.charcoal,
    backgroundColor: COLORS.white,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
  },

  // Header
  header: {
    backgroundColor: COLORS.charcoal,
    marginHorizontal: -40,
    marginTop: -40,
    paddingHorizontal: 40,
    paddingVertical: 24,
    marginBottom: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerTitle: {
    fontFamily: "Oswald",
    fontSize: 28,
    fontWeight: 700,
    color: COLORS.teal,
    letterSpacing: 1,
  },
  headerTagline: {
    fontFamily: "Inter",
    fontSize: 9,
    color: COLORS.medGray,
    marginTop: 4,
  },
  headerDate: {
    fontFamily: "Inter",
    fontSize: 10,
    color: COLORS.medGray,
    textAlign: "right",
  },

  // Section headings
  sectionTitle: {
    fontFamily: "Oswald",
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.charcoal,
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.teal,
  },
  section: {
    marginBottom: 24,
  },

  // Metric cards row
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 0,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
    padding: 12,
    borderTopWidth: 3,
    borderTopColor: COLORS.teal,
  },
  metricLabel: {
    fontSize: 8,
    color: COLORS.textGray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: "Oswald",
    fontSize: 20,
    fontWeight: 700,
    color: COLORS.charcoal,
  },
  metricSub: {
    fontSize: 8,
    color: COLORS.textGray,
    marginTop: 2,
  },

  // Table
  table: {
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.charcoal,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  tableHeaderCell: {
    fontFamily: "Inter",
    fontWeight: 600,
    fontSize: 8,
    color: COLORS.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.medGray,
  },
  tableRowAlt: {
    backgroundColor: COLORS.lightGray,
  },
  tableCell: {
    fontSize: 9,
    color: COLORS.charcoal,
  },

  // Channel table column widths
  colChannel: { width: "25%" },
  colImpressions: { width: "25%" },
  colClicks: { width: "25%" },
  colConversions: { width: "25%" },

  // Budget table column widths
  colBudgetDesc: { width: "30%" },
  colBudgetPlanned: { width: "23%" },
  colBudgetActual: { width: "23%" },
  colBudgetVariance: { width: "24%" },

  // Funnel stage bar
  funnelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  funnelLabel: {
    width: 90,
    fontSize: 9,
    color: COLORS.charcoal,
  },
  funnelBarBg: {
    flex: 1,
    height: 14,
    backgroundColor: COLORS.medGray,
    borderRadius: 3,
    overflow: "hidden",
  },
  funnelBarFill: {
    height: 14,
    backgroundColor: COLORS.teal,
    borderRadius: 3,
  },
  funnelCount: {
    width: 40,
    fontSize: 9,
    textAlign: "right",
    color: COLORS.textGray,
  },

  // Budget variance
  variancePositive: {
    color: "#2F855A",
  },
  varianceNegative: {
    color: COLORS.red,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.medGray,
    paddingTop: 8,
  },
  footerText: {
    fontFamily: "Oswald",
    fontSize: 9,
    color: COLORS.textGray,
    letterSpacing: 0.5,
  },
  footerPage: {
    fontSize: 9,
    color: COLORS.textGray,
  },
  accentDot: {
    color: COLORS.teal,
  },
});

// ─── Types ─────────────────────────────────────────────────────────────────────

export type AUReportData = {
  dateFrom: string;
  dateTo: string;
  summary: {
    contentPublished: number;
    emailOpenRate: number; // 0-100
    totalSubmissions: number;
    totalSpend: number;
  };
  channelPerformance: Array<{
    channel: string;
    impressions: number;
    clicks: number;
    conversions: number;
  }>;
  funnelDistribution: Array<{
    stage: string;
    count: number;
  }>;
  budget: {
    planned: number;
    actual: number;
    variance: number;
    variancePct: number;
    entries?: Array<{
      description: string;
      planned: number;
      actual: number;
    }>;
  };
};

// ─── Helper ────────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function fmtCurrency(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── AUReport Component ────────────────────────────────────────────────────────

export function AUReport({ data }: { data: AUReportData }) {
  const maxFunnelCount = Math.max(...data.funnelDistribution.map((s) => s.count), 1);

  // Accent colors cycling for metric cards
  const accentColors = [COLORS.teal, COLORS.green, COLORS.orange, COLORS.yellow];

  return (
    <Document
      title="AU Marketing Report"
      author="Advertising Unplugged"
      subject={`Marketing Report ${data.dateFrom} – ${data.dateTo}`}
    >
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.headerTitle}>AU Marketing Report</Text>
            <Text style={styles.headerTagline}>Advertising Unplugged — Clarity Over Noise</Text>
          </View>
          <View>
            <Text style={styles.headerDate}>Report Period</Text>
            <Text style={styles.headerDate}>
              {data.dateFrom} – {data.dateTo}
            </Text>
          </View>
        </View>

        {/* ── Summary Metrics ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Summary</Text>
          <View style={styles.metricsRow}>
            {[
              {
                label: "Content Published",
                value: fmt(data.summary.contentPublished),
                sub: "items",
                color: accentColors[0],
              },
              {
                label: "Email Open Rate",
                value: `${data.summary.emailOpenRate.toFixed(1)}%`,
                sub: "avg open rate",
                color: accentColors[1],
              },
              {
                label: "Form Submissions",
                value: fmt(data.summary.totalSubmissions),
                sub: "total",
                color: accentColors[2],
              },
              {
                label: "Total Spend",
                value: fmtCurrency(data.summary.totalSpend),
                sub: "actual",
                color: accentColors[3],
              },
            ].map((metric) => (
              <View
                key={metric.label}
                style={[styles.metricCard, { borderTopColor: metric.color }]}
              >
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricValue}>{metric.value}</Text>
                <Text style={styles.metricSub}>{metric.sub}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Channel Performance ── */}
        {data.channelPerformance.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Channel Performance</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colChannel]}>Channel</Text>
                <Text style={[styles.tableHeaderCell, styles.colImpressions]}>Impressions</Text>
                <Text style={[styles.tableHeaderCell, styles.colClicks]}>Clicks</Text>
                <Text style={[styles.tableHeaderCell, styles.colConversions]}>Conversions</Text>
              </View>
              {data.channelPerformance.map((row, i) => (
                <View
                  key={row.channel}
                  style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
                >
                  <Text style={[styles.tableCell, styles.colChannel]}>{row.channel}</Text>
                  <Text style={[styles.tableCell, styles.colImpressions]}>
                    {fmt(row.impressions)}
                  </Text>
                  <Text style={[styles.tableCell, styles.colClicks]}>{fmt(row.clicks)}</Text>
                  <Text style={[styles.tableCell, styles.colConversions]}>
                    {fmt(row.conversions)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Funnel Distribution ── */}
        {data.funnelDistribution.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Funnel Stage Distribution</Text>
            {data.funnelDistribution.map((stage) => {
              const fillPct = (stage.count / maxFunnelCount) * 100;
              return (
                <View key={stage.stage} style={styles.funnelRow}>
                  <Text style={styles.funnelLabel}>{stage.stage}</Text>
                  <View style={styles.funnelBarBg}>
                    <View style={[styles.funnelBarFill, { width: `${fillPct}%` }]} />
                  </View>
                  <Text style={styles.funnelCount}>{fmt(stage.count)}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Budget ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Overview</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colBudgetDesc]}>Description</Text>
              <Text style={[styles.tableHeaderCell, styles.colBudgetPlanned]}>Planned</Text>
              <Text style={[styles.tableHeaderCell, styles.colBudgetActual]}>Actual</Text>
              <Text style={[styles.tableHeaderCell, styles.colBudgetVariance]}>Variance</Text>
            </View>

            {/* Entry rows if provided */}
            {data.budget.entries?.map((entry, i) => {
              const v = entry.planned - entry.actual;
              return (
                <View
                  key={i}
                  style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
                >
                  <Text style={[styles.tableCell, styles.colBudgetDesc]}>{entry.description}</Text>
                  <Text style={[styles.tableCell, styles.colBudgetPlanned]}>
                    {fmtCurrency(entry.planned)}
                  </Text>
                  <Text style={[styles.tableCell, styles.colBudgetActual]}>
                    {fmtCurrency(entry.actual)}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.colBudgetVariance,
                      v >= 0 ? styles.variancePositive : styles.varianceNegative,
                    ]}
                  >
                    {v >= 0 ? "+" : ""}
                    {fmtCurrency(v)}
                  </Text>
                </View>
              );
            })}

            {/* Totals row */}
            <View style={[styles.tableRow, { backgroundColor: COLORS.lightGray }]}>
              <Text
                style={[styles.tableCell, styles.colBudgetDesc, { fontWeight: 600 }]}
              >
                TOTAL
              </Text>
              <Text style={[styles.tableCell, styles.colBudgetPlanned, { fontWeight: 600 }]}>
                {fmtCurrency(data.budget.planned)}
              </Text>
              <Text style={[styles.tableCell, styles.colBudgetActual, { fontWeight: 600 }]}>
                {fmtCurrency(data.budget.actual)}
              </Text>
              <Text
                style={[
                  styles.tableCell,
                  styles.colBudgetVariance,
                  { fontWeight: 600 },
                  data.budget.variance >= 0
                    ? styles.variancePositive
                    : styles.varianceNegative,
                ]}
              >
                {data.budget.variance >= 0 ? "+" : ""}
                {fmtCurrency(data.budget.variance)}{" "}
                ({data.budget.variancePct >= 0 ? "+" : ""}
                {data.budget.variancePct.toFixed(1)}%)
              </Text>
            </View>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Advertising Unplugged{" "}
            <Text style={styles.accentDot}>—</Text>{" "}
            Clarity Over Noise
          </Text>
          <Text
            style={styles.footerPage}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
