
import { useEffect, useRef } from "react";

import JsBarcode from "jsbarcode";

import {
  Box,
  Divider,
  Paper,
  Typography,
} from "@mui/material";

import type {
  ReceiptData,
  ReceiptPaperSize,
} from "./receipt-preview-models";

import {
  calculateReceiptTotals,
  formatReceiptDate,
  formatReceiptMoney,
  RECEIPT_PAYMENT_LABELS,
  roundReceiptMoney,
} from "./receipt-preview.utils";

export interface ReceiptPreviewProps {
  data: ReceiptData;

  paperSize?: ReceiptPaperSize;
  currencySymbol?: string;

  showLogo?: boolean;
  showBarcode?: boolean;
  showCustomer?: boolean;
  showItemDiscounts?: boolean;
  showPaymentReferences?: boolean;

  className?: string;
}

function ReceiptBarcode({
  value,
}: {
  value: string;
}) {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!barcodeRef.current || !value.trim()) {
      return;
    }

    try {
      JsBarcode(barcodeRef.current, value, {
        format: "CODE128",
        width: 1.4,
        height: 42,
        displayValue: false,
        margin: 0,
        background: "#ffffff",
        lineColor: "#000000",
      });
    } catch {
      // Receipt numbers may contain unsupported
      // characters; hide the invalid barcode.
      barcodeRef.current?.replaceChildren();
    }
  }, [value]);

  if (!value.trim()) return null;

  return (
    <Box
      sx={{
        mt: 2,
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      <svg
        ref={barcodeRef}
        aria-label={`Receipt barcode ${value}`}
        style={{
          maxWidth: "100%",
          height: "auto",
        }}
      />

      <Typography
        sx={{
          fontSize: "10px",
          mt: 0.5,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function ReceiptPreview({
  data,
  paperSize = "80mm",
  currencySymbol = "Rs.",
  showLogo = true,
  showBarcode = true,
  showCustomer = true,
  showItemDiscounts = true,
  showPaymentReferences = true,
  className,
}: ReceiptPreviewProps) {
  const totals = calculateReceiptTotals(data);

  const isA4 = paperSize === "a4";

  const receiptWidth =
    paperSize === "58mm"
      ? "58mm"
      : paperSize === "80mm"
        ? "80mm"
        : "210mm";

  const money = (amount: number) =>
    formatReceiptMoney(
      amount,
      currencySymbol
    );

  const fontSize =
    paperSize === "58mm"
      ? "10px"
      : isA4
        ? "13px"
        : "11px";

  const row = (
    label: string,
    amount: number,
    bold = false
  ) => (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        gap: 1,
        py: 0.25,
      }}
    >
      <Typography
        sx={{
          fontSize,
          fontWeight: bold ? 700 : 400,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontSize,
          fontWeight: bold ? 700 : 400,
          textAlign: "right",
          whiteSpace: "nowrap",
        }}
      >
        {money(amount)}
      </Typography>
    </Box>
  );

  return (
    <Paper
      className={className}
      elevation={0}
      square
      sx={{
        width: receiptWidth,
        maxWidth: "100%",
        mx: "auto",
        p: isA4 ? "16mm" : "3mm",
        boxSizing: "border-box",
        bgcolor: "#ffffff",
        color: "#000000",
        fontFamily:
          '"Courier New", monospace',
        overflowWrap: "anywhere",
        "& .MuiTypography-root": {
          fontFamily: "inherit",
          color: "#000000",
        },
      }}
    >
      <Box sx={{ textAlign: "center" }}>
        {showLogo && data.business.logoUrl && (
          <Box
            component="img"
            src={data.business.logoUrl}
            alt={`${data.business.name} logo`}
            sx={{
              maxWidth: isA4 ? 110 : 70,
              maxHeight: isA4 ? 110 : 65,
              objectFit: "contain",
              mb: 1,
            }}
          />
        )}

        <Typography
          sx={{
            fontSize: isA4 ? "22px" : "15px",
            fontWeight: 800,
          }}
        >
          {data.business.name}
        </Typography>

        {data.business.address && (
          <Typography sx={{ fontSize }}>
            {data.business.address}
          </Typography>
        )}

        {data.business.phone && (
          <Typography sx={{ fontSize }}>
            Tel: {data.business.phone}
          </Typography>
        )}

        {data.business.email && (
          <Typography sx={{ fontSize }}>
            {data.business.email}
          </Typography>
        )}

        {data.business.taxRegistrationNumber && (
          <Typography sx={{ fontSize }}>
            Tax Reg:{" "}
            {data.business.taxRegistrationNumber}
          </Typography>
        )}

        <Typography
          sx={{
            fontSize,
            fontWeight: 700,
            mt: 1,
          }}
        >
          SALES RECEIPT
        </Typography>
      </Box>

      <Divider
        sx={{
          borderColor: "#000",
          borderStyle: "dashed",
          my: 1.5,
        }}
      />

      <Box sx={{ mb: 1 }}>
        <Typography sx={{ fontSize }}>
          Receipt: {data.receiptNumber}
        </Typography>

        <Typography sx={{ fontSize }}>
          Date: {formatReceiptDate(data.issuedAt)}
        </Typography>

        {data.cashier && (
          <Typography sx={{ fontSize }}>
            Cashier: {data.cashier}
          </Typography>
        )}

        {showCustomer && data.customerName && (
          <Typography sx={{ fontSize }}>
            Customer: {data.customerName}
          </Typography>
        )}
      </Box>

      <Divider
        sx={{
          borderColor: "#000",
          borderStyle: "dashed",
          my: 1,
        }}
      />

      <Box>
        {data.items.map((item) => {
          const lineTotal = roundReceiptMoney(
            Math.max(0, item.quantity) *
              Math.max(0, item.unitPrice)
          );

          const discount = Math.min(
            lineTotal,
            Math.max(
              0,
              item.discountAmount ?? 0
            )
          );

          const netLine = roundReceiptMoney(
            lineTotal - discount
          );

          return (
            <Box
              key={item.id}
              sx={{
                mb: 1.25,
                breakInside: "avoid",
              }}
            >
              <Typography
                sx={{
                  fontSize,
                  fontWeight: 600,
                }}
              >
                {item.name}
              </Typography>

              {item.sku && (
                <Typography
                  sx={{
                    fontSize: "9px",
                    color: "#444 !important",
                  }}
                >
                  SKU: {item.sku}
                </Typography>
              )}

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Typography sx={{ fontSize }}>
                  {item.quantity} ×{" "}
                  {money(item.unitPrice)}
                </Typography>

                <Typography
                  sx={{
                    fontSize,
                    textAlign: "right",
                  }}
                >
                  {money(netLine)}
                </Typography>
              </Box>

              {showItemDiscounts &&
                discount > 0 && (
                  <Typography
                    sx={{
                      fontSize: "9px",
                    }}
                  >
                    Discount: -{money(discount)}
                  </Typography>
                )}
            </Box>
          );
        })}
      </Box>

      <Divider
        sx={{
          borderColor: "#000",
          borderStyle: "dashed",
          my: 1.5,
        }}
      />

      {row("Subtotal", totals.subtotal)}

      {totals.itemDiscount > 0 &&
        row(
          "Item Discounts",
          -totals.itemDiscount
        )}

      {totals.billDiscount > 0 &&
        row(
          "Bill Discount",
          -totals.billDiscount
        )}

      {row(
        data.taxMode === "none"
          ? "Tax (Not Applied)"
          : `Tax (${data.taxRate}%)${
              data.taxMode === "inclusive"
                ? " Included"
                : ""
            }`,
        totals.taxAmount
      )}

      <Divider
        sx={{
          borderColor: "#000",
          my: 1,
        }}
      />

      {row("TOTAL", totals.total, true)}

      <Divider
        sx={{
          borderColor: "#000",
          borderStyle: "dashed",
          my: 1.5,
        }}
      />

      <Typography
        sx={{
          fontSize,
          fontWeight: 700,
          mb: 1,
        }}
      >
        PAYMENTS
      </Typography>

      {data.payments.map((payment) => (
        <Box
          key={payment.id}
          sx={{ mb: 1 }}
        >
          {row(
            RECEIPT_PAYMENT_LABELS[
              payment.method
            ],
            payment.amount
          )}

          {showPaymentReferences &&
            payment.reference && (
              <Typography
                sx={{
                  fontSize: "9px",
                  overflowWrap: "anywhere",
                }}
              >
                Ref: {payment.reference}
              </Typography>
            )}
        </Box>
      ))}

      {row(
        "Amount Received",
        totals.amountReceived
      )}

      {totals.balanceDue > 0 &&
        row(
          "Balance Due",
          totals.balanceDue
        )}

      {totals.excessAmount > 0 &&
        row(
          "Excess Amount",
          totals.excessAmount
        )}

      {totals.cashChange > 0 &&
        row(
          "Cash Change",
          totals.cashChange
        )}

      <Divider
        sx={{
          borderColor: "#000",
          borderStyle: "dashed",
          my: 1.5,
        }}
      />

      {showBarcode && (
        <ReceiptBarcode
          value={data.receiptNumber}
        />
      )}

      <Box
        sx={{
          textAlign: "center",
          mt: 2,
        }}
      >
        <Typography
          sx={{
            fontSize,
            fontWeight: 700,
          }}
        >
          Thank you for shopping!
        </Typography>

        {data.footerMessage && (
          <Typography
            sx={{
              fontSize,
              mt: 0.5,
              whiteSpace: "pre-line",
            }}
          >
            {data.footerMessage}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

export default ReceiptPreview;
