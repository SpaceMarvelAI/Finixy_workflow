import React, { useState, useEffect } from "react";
import {
  FileText,
  Loader2,
  BarChart3,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  PieChart as PieChartIcon,
  TrendingUp,
} from "lucide-react";
import { useWorkflow } from "../store/WorkflowContext";
import { chatService, reportService } from "../services/api";
import { BarChart } from "./charts/BarChart";
import { DonutChart } from "./charts/DonutChart";
import { PieChart } from "./charts/PieChart";
import { ChartContainer } from "./ChartContainer";

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
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            No report data available for visualization
          </p>
          <p className="text-xs text-gray-500 mt-2">
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
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Outstanding"
              value={`₹${(summary.total_outstanding || 0).toLocaleString()}`}
              icon={<DollarSign className="w-5 h-5" />}
              color="blue"
            />
            <StatCard
              title="Total Invoices"
              value={(summary.total_invoices || invoices.length).toString()}
              icon={<FileText className="w-5 h-5" />}
              color="purple"
            />
            <StatCard
              title="Overdue Amount"
              value={`₹${(summary.overdue_amount || 0).toLocaleString()}`}
              icon={<AlertTriangle className="w-5 h-5" />}
              color="red"
            />
            <StatCard
              title="Avg Days Outstanding"
              value={`${Math.round(summary.average_days || 0)} days`}
              icon={<Clock className="w-5 h-5" />}
              color="green"
            />
          </div>

          {/* Charts */}
          {bucketChartData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        invoices.reduce(
          (sum: number, inv: any) => sum + (inv.amount || inv.total || 0),
          0,
        );
      const paidAmount =
        summary.paid_amount ||
        invoices.reduce(
          (sum: number, inv: any) => sum + (inv.paid || inv.paid_amount || 0),
          0,
        );
      const outstanding = summary.outstanding || totalAmount - paidAmount;

      const paymentStatusData = [
        { label: "Paid", value: paidAmount },
        { label: "Outstanding", value: outstanding },
      ];

      const vendorTotals = invoices.reduce((acc: any, inv: any) => {
        const vendor = inv.vendor_name || inv.customer_name || "Unknown";
        const amount = inv.amount || inv.total || 0;
        acc[vendor] = (acc[vendor] || 0) + amount;
        return acc;
      }, {});

      const topVendorsData = Object.entries(vendorTotals)
        .map(([label, value]) => ({ label, value: value as number }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      return (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Invoices"
              value={invoices.length.toString()}
              icon={<FileText className="w-5 h-5" />}
              color="blue"
            />
            <StatCard
              title="Total Amount"
              value={`₹${totalAmount.toLocaleString()}`}
              icon={<DollarSign className="w-5 h-5" />}
              color="green"
            />
            <StatCard
              title="Paid Amount"
              value={`₹${paidAmount.toLocaleString()}`}
              icon={<CheckCircle className="w-5 h-5" />}
              color="emerald"
            />
            <StatCard
              title="Outstanding"
              value={`₹${outstanding.toLocaleString()}`}
              icon={<AlertTriangle className="w-5 h-5" />}
              color="orange"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 shadow-2xl text-center">
            <p className="text-white/80 text-sm font-medium mb-2">
              Days Sales Outstanding
            </p>
            <p className="text-6xl font-bold text-white mb-2">
              {Math.round(dso)}
            </p>
            <p className="text-white/60 text-sm">days</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Total Receivables"
              value={`₹${(summary.total_receivables || 0).toLocaleString()}`}
              icon={<DollarSign className="w-5 h-5" />}
              color="green"
            />
            <StatCard
              title="Total Sales"
              value={`₹${(summary.total_sales || 0).toLocaleString()}`}
              icon={<TrendingUp className="w-5 h-5" />}
              color="blue"
            />
            <StatCard
              title="Collection Efficiency"
              value={`${Math.round(summary.collection_efficiency || 0)}%`}
              icon={<BarChart3 className="w-5 h-5" />}
              color="purple"
            />
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-12 text-center">
        <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">
          Report type not supported for visualization
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto" />
          <p className="text-gray-400">Loading analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
      <div className="bg-gradient-to-r from-gray-900 to-black border-b border-gray-800 p-6 backdrop-blur-md z-20 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-100">
                Analysis Dashboard
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {reportMeta
                  ? reportMeta.report_title
                  : "Visual insights from report data"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar pb-32 min-h-0">
        <div className="max-w-7xl mx-auto">{renderCharts()}</div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.4);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #1d4ed8);
          border-radius: 10px;
          border: 3px solid #0f172a;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #60a5fa, #3b82f6);
        }
      `}</style>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "purple" | "red" | "orange" | "emerald";
}> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: "from-blue-600 to-blue-700",
    green: "from-green-600 to-green-700",
    purple: "from-purple-600 to-purple-700",
    red: "from-red-600 to-red-700",
    orange: "from-orange-600 to-orange-700",
    emerald: "from-emerald-600 to-emerald-700",
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-400 font-medium">{title}</p>
        <div
          className={`w-10 h-10 bg-gradient-to-br ${colorClasses[color]} rounded-lg flex items-center justify-center text-white`}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-100">{value}</p>
    </div>
  );
};
