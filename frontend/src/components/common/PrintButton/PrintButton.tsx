
import { useState } from "react";
import type { ReactNode } from "react";

import {
  Button,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import {
  PrintOutlined,
  ReceiptLongOutlined,
  DescriptionOutlined,
  KeyboardArrowDownOutlined,
} from "@mui/icons-material";

export type PrintPaperSize =
  | "58mm"
  | "80mm"
  | "A4";

export type PrintOrientation =
  | "portrait"
  | "landscape";

export interface PrintButtonProps {
  content: ReactNode;
  documentTitle?: string;
  label?: string;
  paperSize?: PrintPaperSize;
  orientation?: PrintOrientation;
  showPaperMenu?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onPrint?: () => void;
  onError?: (error: Error) => void;
}

function getPageSize(
  paperSize: PrintPaperSize,
  orientation: PrintOrientation
): string {
  if (paperSize === "58mm") {
    return "58mm auto";
  }

  if (paperSize === "80mm") {
    return "80mm auto";
  }

  return `A4 ${orientation}`;
}

function getContentWidth(
  paperSize: PrintPaperSize
): string {
  switch (paperSize) {
    case "58mm":
      return "48mm";
    case "80mm":
      return "70mm";
    default:
      return "100%";
  }
}

function PrintButton({
  content,
  documentTitle = "Priyasaman POS",
  label = "Print",
  paperSize = "A4",
  orientation = "portrait",
  showPaperMenu = true,
  disabled = false,
  loading = false,
  onPrint,
  onError,
}: PrintButtonProps) {
  const [anchorEl, setAnchorEl] =
    useState<HTMLElement | null>(null);

  const [printing, setPrinting] =
    useState(false);

  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handlePrint = async (
    selectedPaperSize: PrintPaperSize
  ) => {
    handleMenuClose();

    if (printing || loading || disabled) {
      return;
    }

    setPrinting(true);

    try {
      const { createRoot } = await import("react-dom/client");
      const { flushSync } = await import("react-dom");

      const printWindow = window.open(
        "",
        "_blank",
        "width=900,height=700"
      );

      if (!printWindow) {
        throw new Error(
          "Unable to open print window. Please allow pop-ups."
        );
      }

      const pageSize = getPageSize(
        selectedPaperSize,
        orientation
      );

      const contentWidth =
        getContentWidth(selectedPaperSize);

      const isThermal =
        selectedPaperSize !== "A4";

      const doc = printWindow.document;

      doc.open();

      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <title>${documentTitle.replace(/[<>&"']/g, "")}</title>
            <style>
              @page {
                size: ${pageSize};
                margin: ${isThermal ? "0" : "12mm"};
              }

              * {
                box-sizing: border-box;
              }

              html, body {
                margin: 0;
                padding: 0;
                color: #000;
                background: #fff;
                font-family: Arial, sans-serif;
                font-size: ${isThermal ? "11px" : "13px"};
              }

              .print-content {
                width: ${contentWidth};
                max-width: 100%;
                margin: 0 auto;
                padding: ${isThermal ? "3mm 0" : "0"};
              }

              table {
                width: 100%;
                border-collapse: collapse;
              }

              th, td {
                padding: 5px;
                text-align: left;
              }

              @media print {
                body {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }

                .no-print {
                  display: none !important;
                }
              }
            </style>
          </head>
          <body>
            <div id="print-root"></div>
          </body>
        </html>
      `);

      doc.close();

      const container =
        doc.getElementById("print-root");

      if (!container) {
        throw new Error(
          "Unable to create print content."
        );
      }

      const root = createRoot(container);

      flushSync(() => {
        root.render(
          <div className="print-content">
            {content}
          </div>
        );
      });

      await doc.fonts.ready;

      const images = Array.from(
        doc.images
      );

      await Promise.all(
        images.map((image) => {
          if (image.complete) {
            return Promise.resolve();
          }

          return new Promise<void>((resolve) => {
            image.onload = () => resolve();
            image.onerror = () => resolve();
          });
        })
      );

      printWindow.focus();
      printWindow.print();

      onPrint?.();
    } catch (error) {
      onError?.(
        error instanceof Error
          ? error
          : new Error("Printing failed.")
      );
    } finally {
      setPrinting(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={
          printing || loading ? (
            <CircularProgress
              size={18}
              color="inherit"
            />
          ) : (
            <PrintOutlined />
          )
        }
        endIcon={
          showPaperMenu ? (
            <KeyboardArrowDownOutlined />
          ) : undefined
        }
        disabled={
          disabled || loading || printing
        }
        onClick={
          showPaperMenu
            ? handleMenuOpen
            : () => void handlePrint(paperSize)
        }
      >
        {printing ? "Preparing..." : label}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() =>
            void handlePrint("58mm")
          }
        >
          <ListItemIcon>
            <ReceiptLongOutlined fontSize="small" />
          </ListItemIcon>

          <ListItemText>
            Thermal Receipt — 58mm
          </ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() =>
            void handlePrint("80mm")
          }
        >
          <ListItemIcon>
            <ReceiptLongOutlined fontSize="small" />
          </ListItemIcon>

          <ListItemText>
            Thermal Receipt — 80mm
          </ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() =>
            void handlePrint("A4")
          }
        >
          <ListItemIcon>
            <DescriptionOutlined fontSize="small" />
          </ListItemIcon>

          <ListItemText>
            A4 Document
          </ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

export default PrintButton;
