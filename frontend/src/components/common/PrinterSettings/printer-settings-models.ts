
export type PrinterConnectionType =
  | "system"
  | "usb"
  | "bluetooth"
  | "network";

export type PrinterPaperSize =
  | "58mm"
  | "80mm"
  | "a4";

export type PrinterEncoding =
  | "utf8"
  | "cp437"
  | "cp858";

export interface PrinterSettingsData {
  printerName: string;
  connectionType: PrinterConnectionType;
  paperSize: PrinterPaperSize;

  deviceId: string;
  networkHost: string;
  networkPort: number;

  copies: number;
  autoPrint: boolean;
  autoCut: boolean;
  openCashDrawer: boolean;
  encoding: PrinterEncoding;
}

export interface PrinterSettingsValidation {
  valid: boolean;
  errors: Partial<
    Record<keyof PrinterSettingsData, string>
  >;
}

export const DEFAULT_PRINTER_SETTINGS:
  PrinterSettingsData = {
    printerName: "Main Receipt Printer",
    connectionType: "system",
    paperSize: "80mm",

    deviceId: "",
    networkHost: "",
    networkPort: 9100,

    copies: 1,
    autoPrint: false,
    autoCut: false,
    openCashDrawer: false,
    encoding: "utf8",
  };

export function validatePrinterSettings(
  value: PrinterSettingsData
): PrinterSettingsValidation {
  const errors:
    PrinterSettingsValidation["errors"] = {};

  if (!value.printerName.trim()) {
    errors.printerName =
      "Printer name is required.";
  }

  if (
    !["system", "usb", "bluetooth", "network"]
      .includes(value.connectionType)
  ) {
    errors.connectionType =
      "Invalid connection type.";
  }

  if (
    !["58mm", "80mm", "a4"].includes(
      value.paperSize
    )
  ) {
    errors.paperSize = "Invalid paper size.";
  }

  if (
    !Number.isInteger(value.copies) ||
    value.copies < 1 ||
    value.copies > 5
  ) {
    errors.copies =
      "Copies must be between 1 and 5.";
  }

  if (
    !["utf8", "cp437", "cp858"].includes(
      value.encoding
    )
  ) {
    errors.encoding =
      "Invalid character encoding.";
  }

  if (value.connectionType === "network") {
    if (!value.networkHost.trim()) {
      errors.networkHost =
        "Network host is required.";
    }

    if (
      !Number.isInteger(value.networkPort) ||
      value.networkPort < 1 ||
      value.networkPort > 65535
    ) {
      errors.networkPort =
        "Port must be between 1 and 65535.";
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function arePrinterSettingsEqual(
  first: PrinterSettingsData,
  second: PrinterSettingsData
): boolean {
  return (
    JSON.stringify(first) ===
    JSON.stringify(second)
  );
}
