
import { useState } from "react";
import SettingsPage, { defaultPOSTheme } from "../../modules/settings/SettingsPage";
import type { POSTheme } from "../../modules/settings/SettingsPage";
import "./theme.css";
import { defaultPOSBranding } from "../../modules/settings/posBranding";
import type { POSBranding } from "../../modules/settings/posBranding";
import InventoryPage, { initialInventory } from "../../modules/inventory/InventoryPage";
import type { InventoryProduct, InventoryView } from "../../modules/inventory/InventoryPage";
import type { ReactNode } from "react";

import { Box } from "@mui/material";

import Sidebar from "./Sidebar";
import type { SidebarPage } from "./Sidebar";

import Header from "./Header";
import FeedbackSnackbar from "../../components/common/FeedbackSnackbar";

import POSPage from "../../modules/pos/POSPage";
import ProductsPage from "../../modules/products/ProductsPage";
import PurchasesPage from "../../modules/purchases/PurchasesPage";
import SuppliersPage from "../../modules/suppliers/SuppliersPage";
import CustomersPage from "../../modules/customers/CustomersPage";
import ReportsPage from "../../modules/reports/ReportsPage";
import SalesPage from "../../modules/sales/SalesPage";
import ReturnExchangePage from "../../modules/sales/ReturnExchangePage";
import type { ExchangeSale } from "../../modules/sales/ReturnExchangePage";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({
  children,
}: MainLayoutProps) {
  /* ==========================================
     ACTIVE PAGE
     ========================================== */

  const [theme, setTheme] = useState<POSTheme>(() => {
    try {
      // Restore the original POS palette once after the theme migration.
      // Subsequent user selections remain saved normally.
      const versionKey = "priyasaman-pos-theme-version";
      if (window.localStorage.getItem(versionKey) !== "original-v3") {
        window.localStorage.removeItem("priyasaman-pos-theme");
        window.localStorage.setItem(versionKey, "original-v3");
        return defaultPOSTheme;
      }
      const saved = window.localStorage.getItem("priyasaman-pos-theme");
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && "primary" in parsed && "accent" in parsed) {
          const value = parsed as POSTheme;
          if (/^#[0-9a-fA-F]{6}$/.test(value.primary) && /^#[0-9a-fA-F]{6}$/.test(value.accent)) return value;
        }
      }
    } catch { /* Use default theme when local storage is unavailable. */ }
    return defaultPOSTheme;
  });
  const [previewTheme, setPreviewTheme] = useState<POSTheme | null>(null);
  const appliedTheme = previewTheme ?? theme;
  const saveTheme = (value: POSTheme) => {
    setPreviewTheme(null);
    setTheme(value);
    try { window.localStorage.setItem("priyasaman-pos-theme", JSON.stringify(value)); } catch { /* Continue with in-memory theme. */ }
  };
  const [branding, setBranding] = useState<POSBranding>(() => {
    try {
      const stored = window.localStorage.getItem("priyasaman-pos-branding");
      if (stored) {
        const value: unknown = JSON.parse(stored);
        if (value && typeof value === "object" && "displayName" in value && "businessType" in value && "icon" in value) {
          const parsed = value as POSBranding;
          if (typeof parsed.displayName === "string" && parsed.displayName.trim() && parsed.displayName.length <= 48 &&
              typeof parsed.businessType === "string" && typeof parsed.icon === "string") return parsed;
        }
      }
    } catch { /* Use original branding. */ }
    return defaultPOSBranding;
  });
  const [previewBranding, setPreviewBranding] = useState<POSBranding | null>(null);
  const appliedBranding = previewBranding ?? branding;
  const saveBranding = (value: POSBranding) => {
    setBranding(value);
    setPreviewBranding(null);
    try { window.localStorage.setItem("priyasaman-pos-branding", JSON.stringify(value)); } catch { /* In-memory branding remains active. */ }
  };
  const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>(initialInventory);
  const [activePage, setActivePage] =
    useState<SidebarPage>("dashboard");

  /* ==========================================
     MOBILE SIDEBAR
     ========================================== */

  const [returnInvoice, setReturnInvoice] = useState<ExchangeSale | null>(null);
  const [invoiceScanRequested, setInvoiceScanRequested] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [returnedInvoices, setReturnedInvoices] = useState<string[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  /* ==========================================
     NAVIGATION HANDLER
     ========================================== */

  const handleNavigate = (page: SidebarPage) => {
    // Inventory opens Stock Overview by default, including its selected submenu state.
    setPreviewTheme(null);
    setPreviewBranding(null);
    setActivePage(page === "inventory" ? "stock-overview" : page);
    setReturnInvoice(null);
    setInvoiceScanRequested(false);
    setMobileSidebarOpen(false);
  };

  /* ==========================================
     PAGE CONTENT
     ========================================== */

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return children;

      case "pos":
        return <POSPage />;

      case "inventory":
      case "stock-overview":
      case "stock-adjustments":
      case "stock-transfer":
        return <InventoryPage key={activePage} view={(activePage==="stock-adjustments"?"adjustment":activePage==="stock-transfer"?"transfer":"overview") as InventoryView} onNavigate={view=>handleNavigate(view==="overview"?"stock-overview":view==="adjustment"?"stock-adjustments":"stock-transfer")} products={inventoryProducts} setProducts={setInventoryProducts} onNotice={setFeedback} />;

      case "products":
        return <ProductsPage products={inventoryProducts} setProducts={setInventoryProducts} onNotice={setFeedback} />;

      case "suppliers":
        return <SuppliersPage onNotice={setFeedback} />;

      case "customers":
        return <CustomersPage onNotice={setFeedback} />;

      case "settings":
        return <SettingsPage theme={theme} onSave={saveTheme} onPreview={setPreviewTheme} branding={branding} onBrandingPreview={setPreviewBranding} onBrandingSave={saveBranding} />;

      case "reports":
        return <ReportsPage onNotice={setFeedback} />;

      case "purchases":
        return <PurchasesPage products={inventoryProducts} onNotice={setFeedback} />;

      case "sales":
        return returnInvoice ? <ReturnExchangePage sale={returnInvoice} onBack={() => setReturnInvoice(null)} onComplete={() => { setReturnedInvoices(previous => previous.includes(returnInvoice.invoice) ? previous : [...previous, returnInvoice.invoice]); setReturnInvoice(null); setFeedback("Return / exchange completed successfully."); }} /> : <SalesPage key={invoiceScanRequested ? "invoice-scan" : "sales"} initialScanOpen={invoiceScanRequested} returnedInvoices={returnedInvoices} onNewSale={() => handleNavigate("pos")} onReturnRefund={sale => { setInvoiceScanRequested(false); setReturnInvoice(sale); }} />;

      default:
        return children;
    }
  };

  return (
    <Box
      className={`pos-themed-root${appliedTheme.primary === defaultPOSTheme.primary && appliedTheme.accent === defaultPOSTheme.accent && appliedTheme.button === null && appliedTheme.header === null ? " pos-theme-original" : ""}`}
      style={{
        ["--pos-primary" as string]: appliedTheme.primary,
        ["--pos-accent" as string]: appliedTheme.accent,
        ["--pos-button" as string]: appliedTheme.button ?? appliedTheme.accent,
        ["--pos-header" as string]: appliedTheme.header ?? (appliedTheme.primary === defaultPOSTheme.primary ? "#E8F3EC" : `color-mix(in srgb, ${appliedTheme.primary} 11%, white)`),
        ["--pos-soft" as string]: `color-mix(in srgb, ${appliedTheme.primary} 8%, white)`,
      }}
      sx={{
        display: "flex",
        width: "100%",
        height: "100dvh",
        minWidth: 0,
        margin: 0,
        padding: 0,
        overflow: "hidden",
        bgcolor: "#fbfcfe",
      }}
    >
      <FeedbackSnackbar open={Boolean(feedback)} message={feedback} onClose={() => setFeedback("")} />
      {/* SIDEBAR */}
      <Sidebar
        branding={appliedBranding}
        activePage={activePage}
        onNavigate={handleNavigate}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() =>
          setMobileSidebarOpen(false)
        }
      />

      {/* MAIN CONTENT */}
      <Box
        sx={{
          flex: "1 1 0",
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            flexShrink: 0,
            width: "100%",
            minWidth: 0,
          }}
        >
          <Header
            onMenuClick={() =>
              setMobileSidebarOpen(true)
            }
          />
        </Box>

        {/* PAGE CONTENT */}
        <Box
          component="main"
          sx={{
            position: "relative",
            flex: "1 1 0",
            width: "100%",
            minWidth: 0,
            minHeight: 0,
            margin: 0,
            padding: 0,
            border: 0,
            borderRadius: 0,
            boxShadow: "none",
            bgcolor: "#fbfcfe",
            overflowX: "hidden",
            overflowY: activePage === "products" ? "hidden" : "auto",
            scrollbarWidth: activePage === "settings" ? "none" : undefined,
            "&::-webkit-scrollbar": activePage === "settings" ? { display: "none" } : undefined,
          }}
        >
          {renderPage()}
        </Box>
      </Box>
    </Box>
  );
}
