
import type {
  ReceiptSettingsData,
  ReceiptSettingsValidation,
} from "./receipt-settings-models";

export const DEFAULT_RECEIPT_SETTINGS:
  ReceiptSettingsData = {
    businessName: "PRIYASAMAN",
    address: "",
    phone: "",
    email: "",
    taxRegistrationNumber: "",
    logoUrl: "",

    paperSize: "80mm",
    receiptTitle: "SALES RECEIPT",
    footerMessage: "Thank you for shopping!",

    showLogo: true,
    showBarcode: true,
    showCustomer: true,
    showCashier: true,
    showItemDiscounts: true,
    showPaymentReferences: true,
  };

export function validateReceiptSettings(
  settings: ReceiptSettingsData
): ReceiptSettingsValidation {
  const errors:
    ReceiptSettingsValidation["errors"] = {};

  if (!settings.businessName.trim()) {
    errors.businessName =
      "Business name is required.";
  }

  if (!settings.receiptTitle.trim()) {
    errors.receiptTitle =
      "Receipt title is required.";
  }

  if (
    settings.email.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      settings.email.trim()
    )
  ) {
    errors.email = "Enter a valid email address.";
  }

  if (
    !["58mm", "80mm", "a4"].includes(
      settings.paperSize
    )
  ) {
    errors.paperSize =
      "Select a valid paper size.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function areReceiptSettingsEqual(
  first: ReceiptSettingsData,
  second: ReceiptSettingsData
): boolean {
  const keys = Object.keys(
    DEFAULT_RECEIPT_SETTINGS
  ) as (keyof ReceiptSettingsData)[];

  return keys.every(
    (key) => first[key] === second[key]
  );
}
