
export type ReceiptSettingsPaperSize =
  | "58mm"
  | "80mm"
  | "a4";

export interface ReceiptSettingsData {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  taxRegistrationNumber: string;
  logoUrl: string;

  paperSize: ReceiptSettingsPaperSize;
  receiptTitle: string;
  footerMessage: string;

  showLogo: boolean;
  showBarcode: boolean;
  showCustomer: boolean;
  showCashier: boolean;
  showItemDiscounts: boolean;
  showPaymentReferences: boolean;
}

export interface ReceiptSettingsValidation {
  valid: boolean;
  errors: Partial<
    Record<keyof ReceiptSettingsData, string>
  >;
}
