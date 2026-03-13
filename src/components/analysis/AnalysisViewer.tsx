import React, { useState, useEffect } from "react";
import { Loader2, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { useWorkflow } from "../../store/WorkflowContext";
import { chatService, reportService } from "../../services/api";
import { BarChart } from "../charts/BarChart";
import { DonutChart } from "../charts/DonutChart";
import { PieChart } from "../charts/PieChart";
import { ChartContainer } from "../charts/ChartContainer";

export const AnalysisViewer: React.FC = () => {
  const { currentChatId } = useWorkflow();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [reportMeta, setReportMeta] = useState<any>(null);

  useEffect(() => {
    loadReportData();
  }, [currentChatId]);

  const loadReportData = async () => {
    if (!currentChatId) {
      setReportData(null);
      return;
    }

    setLoading(true);
    try {
      const chatResponse = await chatService.getChatDetails(currentChatId);
      const chat = chatResponse.data;

      if (chat.final_report_ids && chat.final_report_ids.length > 0) {
        const latestReportId =
          chat.final_report_ids[chat.final_report_ids.length - 1];

        const reportResponse = await reportService.getReport(latestReportId);
        const report =
          reportResponse.data.report ||
          (reportResponse.data.report_id ? reportResponse.data : null);

        if (report) {
          setReportMeta({
            report_id: report.report_id,
            report_type: report.report_type,
            report_title:
              report.report_title || report.name || "Financial Report",
            generated_at: report.generated_at || report.created_at,
          });

          let finalReportData = null;
          if (report.report_data?.final_report) {
            finalReportData = report.report_data.final_report;
          } else if (report.report_data) {
            finalReportData = report.report_data;
          } else if (report.final_report) {
            finalReportData = report.final_report;
          }

          setReportData(finalReportData);
        }
      } else {
        setReportData(null);
        setReportMeta(null);
      }
    } catch (err) {
      console.error("Failed to load report data:", err);
      setReportData(null);
      setReportMeta(null);
    } finally {
      setLoading(false);
    }
  };

  const renderCharts = () => {
    if (!reportData || !reportMeta) {
      return (
        <div className="theme-panel border rounded-lg p-12 text-center">
          <BarChart3 className="w-16 h-16 text-theme-tertiary mx-auto mb-4" />
          <p className="text-theme-secondary">
            No report data available for visualization
          </p>
          <p className="text-xs text-theme-tertiary mt-2">
            Generate a report to see charts
          </p>
        </div>
      );
    }

    const reportType = reportMeta.report_type?.toLowerCase() || "";

    // AP Aging Report Charts
    if (reportType.includes("aging")) {
      const summary = reportData.summary || {};
      const aging_buckets = reportData.aging_buckets || [];
      const invoices = reportData.invoices || reportData.data || [];

      const bucketChartData = aging_buckets.map((bucket: any) => ({
        label: bucket.bucket || bucket.range || "Unknown",
        value: bucket.amount || 0,
      }));

      return (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title="Total Outstanding"
              value={`₹${(summary.total_outstanding || 0).toLocaleString()}`}
            />
            <StatCard
              title="Total Invoices"
              value={(
                summary.total_invoices ||
                invoices?.length ||
                0
              ).toString()}
            />
            <StatCard
              title="Overdue Amount"
              value={`₹${(summary.overdue_amount || 0).toLocaleString()}`}
            />
            <StatCard
              title="Avg Days Outstanding"
              value={`${Math.round(summary.average_days || 0)} days`}
            />
          </div>

          {/* Charts */}
          {bucketChartData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartContainer
                title="Aging Distribution"
                icon={<PieChartIcon className="w-5 h-5 text-blue-400" />}
                chartName="Aging_Distribution"
              >
                <div
                  className="flex items-center justify-center"
                  style={{ height: "350px" }}
                >
                  <DonutChart
                    data={bucketChartData}
                    width={500}
                    height={350}
                    centerText={`₹${(summary.total_outstanding || 0).toLocaleString()}`}
                    centerSubtext="Total Outstanding"
                  />
                </div>
              </ChartContainer>

              <ChartContainer
                title="Amount by Aging Bucket"
                icon={<BarChart3 className="w-5 h-5 text-green-400" />}
                chartName="Aging_Bucket_Amounts"
              >
                <div
                  className="flex items-center justify-center"
                  style={{ height: "350px" }}
                >
                  <BarChart
                    data={bucketChartData}
                    width={500}
                    height={350}
                    color="#10b981"
                  />
                </div>
              </ChartContainer>
            </div>
          )}
        </div>
      );
    }

    // AP/AR Register Charts
    if (
      reportType.includes("register") ||
      reportType.includes("ar") ||
      reportType.includes("ap")
    ) {
      const summary = reportData.summary || reportData.metadata?.summary || {};
      const invoices =
        reportData.invoices || reportData.data || reportData.records || [];

      const totalAmount =
        summary.total_amount ||
        (Array.isArray(invoices)
          ? invoices.reduce(
              (sum: number, inv: any) => sum + (inv.amount || inv.total || 0),
              0,
            )
          : 0);
      const paidAmount =
        summary.paid_amount ||
        (Array.isArray(invoices)
          ? invoices.reduce(
              (sum: number, inv: any) =>
                sum + (inv.paid || inv.paid_amount || 0),
              0,
            )
          : 0);
      const outstanding = summary.outstanding || totalAmount - paidAmount;

      const paymentStatusData = [
        { label: "Paid", value: paidAmount },
        { label: "Outstanding", value: outstanding },
      ];

      const vendorTotals = Array.isArray(invoices)
        ? invoices.reduce((acc: any, inv: any) => {
            const vendor = inv.vendor_name || inv.customer_name || "Unknown";
            const amount = inv.amount || inv.total || 0;
            acc[vendor] = (acc[vendor] || 0) + amount;
            return acc;
          }, {})
        : {};

      const topVendorsData = Object.entries(vendorTotals)
        .map(([label, value]) => ({ label, value: value as number }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      return (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title="Total Invoices"
              value={(invoices?.length || 0).toString()}
            />
            <StatCard
              title="Total Amount"
              value={`₹${(totalAmount || 0).toLocaleString()}`}
            />
            <StatCard
              title="Paid Amount"
              value={`₹${(paidAmount || 0).toLocaleString()}`}
            />
            <StatCard
              title="Outstanding"
              value={`₹${outstanding.toLocaleString()}`}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartContainer
              title="Payment Status"
              icon={<PieChartIcon className="w-5 h-5 text-purple-400" />}
              chartName="Payment_Status"
            >
              <div
                className="flex items-center justify-center"
                style={{ height: "350px" }}
              >
                <PieChart
                  data={paymentStatusData}
                  width={500}
                  height={350}
                  colors={["#10b981", "#f59e0b"]}
                />
              </div>
            </ChartContainer>

            {topVendorsData.length > 0 && (
              <ChartContainer
                title="Top Vendors/Customers"
                icon={<BarChart3 className="w-5 h-5 text-blue-400" />}
                chartName="Top_Vendors"
              >
                <div
                  className="flex items-center justify-center"
                  style={{ height: "350px" }}
                >
                  <BarChart
                    data={topVendorsData}
                    width={500}
                    height={350}
                    color="#3b82f6"
                  />
                </div>
              </ChartContainer>
            )}
          </div>
        </div>
      );
    }

    // DSO Report Charts
    if (reportType.includes("dso")) {
      const dso = reportData.dso || reportData.days_sales_outstanding || 0;
      const summary = reportData.summary || {};

      return (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-md p-6 shadow-lg text-center">
            <p className="text-white/80 text-xs font-medium mb-1">
              Days Sales Outstanding
            </p>
            <p className="text-5xl font-bold text-white mb-1">
              {Math.round(dso)}
            </p>
            <p className="text-white/60 text-xs">days</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatCard
              title="Total Receivables"
              value={`₹${(summary.total_receivables || 0).toLocaleString()}`}
            />
            <StatCard
              title="Total Sales"
              value={`₹${(summary.total_sales || 0).toLocaleString()}`}
            />
            <StatCard
              title="Collection Efficiency"
              value={`${Math.round(summary.collection_efficiency || 0)}%`}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="theme-panel border rounded-lg p-12 text-center">
        <BarChart3 className="w-16 h-16 text-theme-tertiary mx-auto mb-4" />
        <p className="text-theme-secondary">
          Report type not supported for visualization
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-theme-primary theme-transition">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
          <p className="text-theme-secondary">Loading analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-theme-secondary overflow-hidden theme-transition">
      {/* Header */}
      <div className="bg-theme-tertiary border-b border-theme-primary p-4 z-20 flex-shrink-0 theme-transition">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-theme-primary">
            Analysis Dashboard
          </h2>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-xs font-medium text-theme-primary bg-theme-secondary border border-white/20 rounded-md hover:bg-theme-tertiary transition-all">
              Charts
            </button>
            <button className="px-3 py-1.5 text-xs font-medium text-theme-primary bg-theme-secondary border border-white/20 rounded-md hover:bg-theme-tertiary transition-all">
              Insights
            </button>
            <button className="px-3 py-1.5 text-xs font-medium text-theme-primary bg-theme-secondary border border-white/20 rounded-md hover:bg-theme-tertiary transition-all">
              Code
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 custom-scrollbar pb-20 min-h-0">
        <div className="max-w-7xl mx-auto">{renderCharts()}</div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string;
}> = ({ title, value }) => {
  return (
    <div className="theme-panel border border-white/20 rounded-md p-4 shadow-sm hover:shadow-md transition-all">
      <p className="text-xs text-theme-secondary font-medium mb-2">{title}</p>
      <p className="text-xl font-bold text-theme-primary">{value}</p>
    </div>
  );
};
