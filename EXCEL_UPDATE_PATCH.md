# Excel Export Update - Add More Columns and Summary

## File: src/components/ReportViewer.tsx

Replace the `handleDownload` function (around line 185) with this updated version:

```typescript
const handleDownload = async () => {
  if (reportUrl) {
    window.open(reportUrl, "_blank");
    return;
  }

  if (reportData) {
    console.log("📥 Generating client-side Excel...");
    let columns: any[] = [];
    let dataToExport: any[] = [];
    let summary: any = {};
    const title = reportMeta?.report_title || "Report Export";
    const reportType = reportMeta?.report_type?.toLowerCase() || "";

    const findKey = (data: any, possibleKeys: string[]): string => {
      if (!data || data.length === 0) return possibleKeys[0];
      return (
        possibleKeys.find((key) => data[0].hasOwnProperty(key)) ||
        possibleKeys[0]
      );
    };

    if (reportType.includes("aging")) {
      dataToExport = reportData.invoices || reportData.data || [];
      const reportSummary = reportData.summary || {};

      if (dataToExport.length > 0) {
        columns = [
          {
            key: findKey(dataToExport, [
              "invoice_number",
              "invoice_no",
              "invoiceNumber",
            ]),
            label: "Invoice #",
          },
          {
            key: findKey(dataToExport, [
              "vendor_name",
              "customer_name",
              "vendorName",
              "name",
            ]),
            label: "Vendor",
          },
          {
            key: findKey(dataToExport, ["invoice_date", "date", "invoiceDate"]),
            label: "Date",
            format: "date",
          },
          {
            key: findKey(dataToExport, ["due_date", "dueDate"]),
            label: "Due Date",
            format: "date",
          },
          {
            key: findKey(dataToExport, ["amount", "invoice_amount"]),
            label: "Amount",
            format: "currency",
          },
          {
            key: findKey(dataToExport, ["tax", "tax_amount", "taxAmount"]),
            label: "Tax",
            format: "currency",
          },
          {
            key: findKey(dataToExport, [
              "total",
              "total_amount",
              "totalAmount",
            ]),
            label: "Total",
            format: "currency",
          },
          {
            key: findKey(dataToExport, ["outstanding", "outstanding_amount"]),
            label: "Outstanding",
            format: "currency",
          },
          {
            key: findKey(dataToExport, [
              "days_outstanding",
              "daysOutstanding",
              "days",
            ]),
            label: "Days",
          },
          {
            key: findKey(dataToExport, ["status", "payment_status"]),
            label: "Status",
          },
        ];

        summary = {
          totalInvoices: reportSummary.total_invoices || dataToExport.length,
          totalAmount:
            reportSummary.total_amount ||
            dataToExport.reduce(
              (sum: number, inv: any) => sum + (inv.amount || inv.total || 0),
              0,
            ),
          paidAmount: reportSummary.paid_amount || 0,
          outstanding:
            reportSummary.total_outstanding ||
            reportSummary.outstanding ||
            dataToExport.reduce(
              (sum: number, inv: any) => sum + (inv.outstanding || 0),
              0,
            ),
        };
      }
    } else if (
      reportType.includes("register") ||
      reportType.includes("ar") ||
      reportType.includes("ap")
    ) {
      dataToExport =
        reportData.invoices ||
        reportData.data ||
        reportData.records ||
        Object.values(reportData).find((v) => Array.isArray(v)) ||
        [];
      const reportSummary =
        reportData.summary || reportData.metadata?.summary || {};

      if (dataToExport.length > 0) {
        columns = [
          {
            key: findKey(dataToExport, [
              "invoice_number",
              "invoice_no",
              "invoiceNumber",
            ]),
            label: "Invoice #",
          },
          {
            key: findKey(dataToExport, [
              "vendor_name",
              "customer_name",
              "vendorName",
              "name",
            ]),
            label: "Vendor/Customer",
          },
          {
            key: findKey(dataToExport, ["invoice_date", "date", "invoiceDate"]),
            label: "Date",
            format: "date",
          },
          {
            key: findKey(dataToExport, ["amount", "invoice_amount"]),
            label: "Amount",
            format: "currency",
          },
          {
            key: findKey(dataToExport, ["tax", "tax_amount", "taxAmount"]),
            label: "Tax",
            format: "currency",
          },
          {
            key: findKey(dataToExport, [
              "total",
              "total_amount",
              "totalAmount",
            ]),
            label: "Total",
            format: "currency",
          },
          {
            key: findKey(dataToExport, ["paid", "paid_amount", "paidAmount"]),
            label: "Paid",
            format: "currency",
          },
          {
            key: findKey(dataToExport, ["outstanding", "outstanding_amount"]),
            label: "Outstanding",
            format: "currency",
          },
          {
            key: findKey(dataToExport, ["status", "payment_status"]),
            label: "Status",
          },
        ];

        const totalAmount =
          reportSummary.total_amount ||
          dataToExport.reduce(
            (sum: number, inv: any) => sum + (inv.amount || inv.total || 0),
            0,
          );
        const paidAmount =
          reportSummary.paid_amount ||
          dataToExport.reduce(
            (sum: number, inv: any) => sum + (inv.paid || inv.paid_amount || 0),
            0,
          );

        summary = {
          totalInvoices: dataToExport.length,
          totalAmount: totalAmount,
          paidAmount: paidAmount,
          outstanding: reportSummary.outstanding || totalAmount - paidAmount,
        };
      }
    } else {
      dataToExport = Array.isArray(reportData)
        ? reportData
        : Object.values(reportData).find((v) => Array.isArray(v)) || [];
      if (dataToExport.length > 0) {
        columns = Object.keys(dataToExport[0]).map((k) => ({
          key: k,
          label: k.replace(/_/g, " ").toUpperCase(),
          format:
            k.toLowerCase().includes("amount") ||
            k.toLowerCase().includes("total") ||
            k.toLowerCase().includes("tax") ||
            k.toLowerCase().includes("paid") ||
            k.toLowerCase().includes("outstanding")
              ? "currency"
              : k.toLowerCase().includes("date")
                ? "date"
                : undefined,
        }));
      }
    }

    console.log("📥 Excel columns:", columns);
    console.log("📥 Excel summary:", summary);

    if (dataToExport.length > 0) {
      await generateExcelFromReportData(title, dataToExport, columns, summary);
    } else {
      alert("No tabular data found to export.");
    }
  }
};
```

## Changes Made:

1. **Added more columns**: Tax, Total, Date (with proper date formatting)
2. **Added summary section**: Shows Total Invoices, Total Amount, Paid Amount, Outstanding at the top of Excel
3. **Auto-detects field names**: Works with different backend field naming conventions
4. **Proper formatting**: Currency fields show ₹ symbol, dates are formatted correctly

## Result:

The Excel will now have:

- Summary section at top with totals
- All columns including Tax, Total, Date
- Proper formatting for currency and dates
