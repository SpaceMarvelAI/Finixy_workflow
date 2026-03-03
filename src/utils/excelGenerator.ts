// Lazy load ExcelJS to avoid initial bundle issues
const loadExcelJS = async () => {
  const ExcelJS = await import('exceljs');
  return ExcelJS.default || ExcelJS;
};

interface LineItem {
  description: string;
  quantity: number | string;
  unit_price: number;
  amount: number;
  currency?: string;
}

interface DocumentData {
  file_name: string;
  vendor_name?: string;
  customer_name?: string;
  document_number?: string;
  status?: string;
  grand_total?: number;
  tax_total?: number;
  paid_amount?: number;
  outstanding?: number;
  created_at?: string;
  uploaded_at?: string;
  currency?: string;
  canonical_data?: {
    extracted_fields?: {
      line_items?: LineItem[];
    };
  };
}

export const generateExcelFromDocument = async (documentData: DocumentData) => {
  // Dynamically import ExcelJS
  const ExcelJS = await loadExcelJS();
  const workbook = new ExcelJS.Workbook();

  // Set workbook properties
  workbook.creator = 'Finixy';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Create Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary', {
    properties: { tabColor: { argb: '3B82F6' } },
  });

  // Summary Sheet Styling
  summarySheet.columns = [
    { width: 25 },
    { width: 30 },
  ];

  // Title
  summarySheet.mergeCells('A1:B1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = 'Document Summary';
  titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '3B82F6' },
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  summarySheet.getRow(1).height = 30;

  // Add empty row
  summarySheet.addRow([]);

  // Document Information
  const addSummaryRow = (label: string, value: any, isCurrency = false) => {
    const row = summarySheet.addRow([label, value]);
    row.getCell(1).font = { bold: true };
    row.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F3F4F6' },
    };

    if (isCurrency && typeof value === 'number') {
      row.getCell(2).numFmt = '₹#,##0.00';
    }

    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'D1D5DB' } },
        left: { style: 'thin', color: { argb: 'D1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
        right: { style: 'thin', color: { argb: 'D1D5DB' } },
      };
    });
  };

  addSummaryRow('File Name', documentData.file_name || 'N/A');
  addSummaryRow('Vendor Name', documentData.vendor_name || 'N/A');
  addSummaryRow('Customer Name', documentData.customer_name || 'N/A');
  addSummaryRow('Document Number', documentData.document_number || 'N/A');
  addSummaryRow('Status', documentData.status || 'N/A');
  addSummaryRow('Upload Date', documentData.uploaded_at ? new Date(documentData.uploaded_at).toLocaleDateString() : 'N/A');

  // Add empty row
  summarySheet.addRow([]);

  // Financial Summary Header
  summarySheet.mergeCells(`A${summarySheet.rowCount + 1}:B${summarySheet.rowCount + 1}`);
  const financialHeader = summarySheet.getCell(`A${summarySheet.rowCount}`);
  financialHeader.value = 'Financial Summary';
  financialHeader.font = { size: 14, bold: true, color: { argb: 'FFFFFF' } };
  financialHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '10B981' },
  };
  financialHeader.alignment = { vertical: 'middle', horizontal: 'center' };
  summarySheet.getRow(summarySheet.rowCount).height = 25;

  addSummaryRow('Grand Total', documentData.grand_total || 0, true);
  addSummaryRow('Tax Total', documentData.tax_total || 0, true);
  addSummaryRow('Paid Amount', documentData.paid_amount || 0, true);
  addSummaryRow('Outstanding', documentData.outstanding || 0, true);

  // Create Line Items Sheet
  const lineItems = documentData.canonical_data?.extracted_fields?.line_items || [];

  if (lineItems.length > 0) {
    const itemsSheet = workbook.addWorksheet('Line Items', {
      properties: { tabColor: { argb: '10B981' } },
    });

    // Set column widths
    itemsSheet.columns = [
      { width: 50 },
      { width: 15 },
      { width: 20 },
      { width: 20 },
    ];

    // Header Row
    const headerRow = itemsSheet.addRow(['Description', 'Quantity', 'Unit Price', 'Amount']);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 12 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '3B82F6' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFFFFF' } },
        left: { style: 'thin', color: { argb: 'FFFFFF' } },
        bottom: { style: 'thin', color: { argb: 'FFFFFF' } },
        right: { style: 'thin', color: { argb: 'FFFFFF' } },
      };
    });

    // Data Rows
    lineItems.forEach((item, index) => {
      const row = itemsSheet.addRow([
        item.description || 'N/A',
        item.quantity || 1,
        item.unit_price || 0,
        item.amount || 0,
      ]);

      // Alternate row colors
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F9FAFB' },
        };
      }

      // Format currency columns
      row.getCell(3).numFmt = '₹#,##0.00';
      row.getCell(4).numFmt = '₹#,##0.00';

      // Center align quantity
      row.getCell(2).alignment = { horizontal: 'center' };

      // Add borders
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'E5E7EB' } },
          left: { style: 'thin', color: { argb: 'E5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
          right: { style: 'thin', color: { argb: 'E5E7EB' } },
        };
      });
    });

    // Add Total Row
    const totalRow = itemsSheet.addRow([
      'TOTAL',
      '',
      '',
      { formula: `SUM(D2:D${itemsSheet.rowCount})` },
    ]);
    totalRow.font = { bold: true, size: 12 };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'DBEAFE' },
    };
    totalRow.getCell(4).numFmt = '₹#,##0.00';
    totalRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'double', color: { argb: '3B82F6' } },
        left: { style: 'thin', color: { argb: '3B82F6' } },
        bottom: { style: 'double', color: { argb: '3B82F6' } },
        right: { style: 'thin', color: { argb: '3B82F6' } },
      };
    });
  }

  // Generate buffer and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  // Create download link
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${documentData.file_name?.replace(/\.[^/.]+$/, '') || 'document'}_export.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const generateExcelFromReportData = async (
  title: string,
  data: any[],
  columns: any[],
  summary?: {
    totalInvoices?: number;
    totalAmount?: number;
    paidAmount?: number;
    outstanding?: number;
  }
) => {
  const ExcelJS = await loadExcelJS();
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Report");

  let currentRow = 1;

  // Title
  worksheet.mergeCells(currentRow, 1, currentRow, columns.length);
  const titleCell = worksheet.getCell(currentRow, 1);
  titleCell.value = title;
  titleCell.font = { size: 16, bold: true, color: { argb: "FFFFFF" } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "3B82F6" },
  };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(currentRow).height = 30;
  currentRow += 2;

  // Summary Section (if provided)
  if (summary) {
    worksheet.mergeCells(currentRow, 1, currentRow, columns.length);
    const summaryTitleCell = worksheet.getCell(currentRow, 1);
    summaryTitleCell.value = "Summary";
    summaryTitleCell.font = { size: 14, bold: true, color: { argb: "FFFFFF" } };
    summaryTitleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "10B981" },
    };
    summaryTitleCell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getRow(currentRow).height = 25;
    currentRow++;

    // Summary rows
    const summaryData = [
      ["Total Invoices", summary.totalInvoices || data.length],
      ["Total Amount", summary.totalAmount || 0],
      ["Paid Amount", summary.paidAmount || 0],
      ["Outstanding", summary.outstanding || 0],
    ];

    summaryData.forEach(([label, value]) => {
      const row = worksheet.getRow(currentRow);
      row.getCell(1).value = label;
      row.getCell(1).font = { bold: true };
      row.getCell(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "F3F4F6" },
      };
      
      row.getCell(2).value = value;
      if (typeof value === "number" && label !== "Total Invoices") {
        row.getCell(2).numFmt = "₹#,##0.00";
      }
      
      // Add borders
      row.getCell(1).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      row.getCell(2).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      
      currentRow++;
    });
    
    currentRow += 2; // Add spacing
  }

  // Headers
  const headerRow = worksheet.getRow(currentRow);
  columns.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.label;
    cell.font = { bold: true, color: { argb: "FFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "1F2937" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    worksheet.getColumn(i + 1).width = 20;
  });
  headerRow.height = 25;
  currentRow++;

  // Data
  data.forEach((row) => {
    const sheetRow = worksheet.getRow(currentRow);
    columns.forEach((col, colIndex) => {
      let value = row[col.key];
      const cell = sheetRow.getCell(colIndex + 1);
      
      if (col.format === "currency") {
        cell.numFmt = "₹#,##0.00";
        cell.value = value || 0;
      } else if (col.format === "date") {
        if (value) {
          try {
            const date = new Date(value);
            cell.value = date;
            cell.numFmt = "dd-mm-yyyy";
          } catch {
            cell.value = value;
          }
        } else {
          cell.value = "-";
        }
      } else {
        cell.value = value || "-";
      }
      
      // Add borders
      cell.border = {
        top: { style: "thin", color: { argb: "E5E7EB" } },
        left: { style: "thin", color: { argb: "E5E7EB" } },
        bottom: { style: "thin", color: { argb: "E5E7EB" } },
        right: { style: "thin", color: { argb: "E5E7EB" } },
      };
    });
    currentRow++;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
