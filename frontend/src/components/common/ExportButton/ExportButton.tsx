
import { useState } from "react";
import type { MouseEvent } from "react";

import {
  Button,
  CircularProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";

import {
  DownloadOutlined,
  DescriptionOutlined,
  TableChartOutlined,
  PictureAsPdfOutlined,
  KeyboardArrowDownOutlined,
} from "@mui/icons-material";

import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type ExportFormat = "csv" | "xlsx" | "pdf";

export type ExportValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined;

export type ExportRow = Record<string, ExportValue>;

export interface ExportColumn {
  key: string;
  label: string;
}

export interface ExportButtonProps {
  data: ExportRow[];
  columns: ExportColumn[];

  filename?: string;
  sheetName?: string;
  label?: string;
  pdfTitle?: string;

  disabled?: boolean;
  loading?: boolean;

  onExportSuccess?: (format: ExportFormat) => void;
  onExportError?: (error: Error) => void;
}

function normalizeValue(
  value: ExportValue
): string | number {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return value;
}

// Prevent user-entered strings from becoming spreadsheet formulas.
// Numeric values remain numeric.
function safeSpreadsheetValue(
  value: string | number
): string | number {
  if (typeof value === "number") {
    return value;
  }

  if (/^\s*[=+\-@\t\r\n]/.test(value)) {
    return `'${value}`;
  }

  return value;
}

function escapeCSV(value: string | number): string {
  const safe = safeSpreadsheetValue(value);
  const text = String(safe);

  return `"${text.replace(/"/g, '""')}"`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

function ExportButton({
  data,
  columns,
  filename = "export",
  sheetName = "Data",
  label = "Export",
  pdfTitle = "Data Export Report",
  disabled = false,
  loading = false,
  onExportSuccess,
  onExportError,
}: ExportButtonProps) {
  const [anchorEl, setAnchorEl] =
    useState<HTMLElement | null>(null);

  const [exporting, setExporting] = useState(false);

  const menuOpen = Boolean(anchorEl);
  const isBusy = loading || exporting;

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getRows = (): (string | number)[][] => {
    return data.map((row) =>
      columns.map((column) =>
        normalizeValue(row[column.key])
      )
    );
  };

  // CSV Export
  const exportCSV = () => {
    const headers = columns.map((column) =>
      escapeCSV(column.label)
    );

    const rows = getRows().map((row) =>
      row.map(escapeCSV).join(",")
    );

    const csv = [
      headers.join(","),
      ...rows,
    ].join("\r\n");

    const blob = new Blob(
      ["\uFEFF", csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    downloadBlob(blob, `${filename}.csv`);
  };

  // Excel Export
  const exportExcel = () => {
    const headers = columns.map((column) =>
      safeSpreadsheetValue(column.label)
    );

    const rows = getRows().map((row) =>
      row.map(safeSpreadsheetValue)
    );

    const worksheet = XLSX.utils.aoa_to_sheet([
      headers,
      ...rows,
    ]);

    worksheet["!cols"] = columns.map((column) => ({
      wch: Math.max(column.label.length + 4, 16),
    }));

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sheetName.slice(0, 31) || "Data"
    );

    XLSX.writeFile(
      workbook,
      `${filename}.xlsx`
    );
  };

  // PDF Export
  const exportPDF = () => {
    const document = new jsPDF({
      orientation:
        columns.length > 5 ? "landscape" : "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth =
      document.internal.pageSize.getWidth();

    const pageHeight =
      document.internal.pageSize.getHeight();

    const headers = columns.map(
      (column) => column.label
    );

    const rows = getRows().map((row) =>
      row.map((value) => String(value))
    );

    // Report Header
    document.setFont("helvetica", "bold");
    document.setFontSize(16);

    document.text(
      "PRIYASAMAN POS",
      14,
      18
    );

    document.setFont("helvetica", "normal");
    document.setFontSize(12);

    document.text(
      pdfTitle,
      14,
      27
    );

    document.setFontSize(9);
    document.setTextColor(100);

    const generatedAt = new Date().toLocaleString();

    document.text(
      `Generated: ${generatedAt}`,
      14,
      34
    );

    document.text(
      `Total Records: ${data.length}`,
      14,
      40
    );

    // PDF Table
    autoTable(document, {
      head: [headers],
      body: rows,
      startY: 47,
      margin: {
        top: 15,
        left: 14,
        right: 14,
        bottom: 18,
      },
      theme: "striped",
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [25, 118, 210],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      didDrawPage: () => {
        const pageNumber =
          document.getNumberOfPages();

        document.setFontSize(8);
        document.setTextColor(120);

        document.text(
          "Generated by Priyasaman POS",
          14,
          pageHeight - 10
        );

        document.text(
          `Page ${pageNumber}`,
          pageWidth - 14,
          pageHeight - 10,
          { align: "right" }
        );
      },
    });

    document.save(`${filename}.pdf`);
  };

  const handleExport = (format: ExportFormat) => {
    handleClose();

    if (
      disabled ||
      isBusy ||
      data.length === 0 ||
      columns.length === 0
    ) {
      return;
    }

    setExporting(true);

    try {
      switch (format) {
        case "csv":
          exportCSV();
          break;

        case "xlsx":
          exportExcel();
          break;

        case "pdf":
          exportPDF();
          break;
      }

      onExportSuccess?.(format);
    } catch (error) {
      const exportError =
        error instanceof Error
          ? error
          : new Error("Export failed");

      onExportError?.(exportError);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={
          isBusy ? (
            <CircularProgress
              size={16}
              color="inherit"
            />
          ) : (
            <DownloadOutlined />
          )
        }
        endIcon={<KeyboardArrowDownOutlined />}
        onClick={handleOpen}
        disabled={
          disabled ||
          isBusy ||
          data.length === 0 ||
          columns.length === 0
        }
      >
        {isBusy ? "Exporting..." : label}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleClose}
      >
        <MenuItem
          onClick={() => handleExport("csv")}
        >
          <ListItemIcon>
            <DescriptionOutlined fontSize="small" />
          </ListItemIcon>

          <ListItemText
            primary="Export as CSV"
            secondary=".csv format"
          />
        </MenuItem>

        <MenuItem
          onClick={() => handleExport("xlsx")}
        >
          <ListItemIcon>
            <TableChartOutlined fontSize="small" />
          </ListItemIcon>

          <ListItemText
            primary="Export as Excel"
            secondary=".xlsx format"
          />
        </MenuItem>

        <MenuItem
          onClick={() => handleExport("pdf")}
        >
          <ListItemIcon>
            <PictureAsPdfOutlined
              fontSize="small"
              color="error"
            />
          </ListItemIcon>

          <ListItemText
            primary="Export as PDF"
            secondary=".pdf format"
          />
        </MenuItem>
      </Menu>
    </>
  );
}

export default ExportButton;
