
import { useState } from "react";
import InventoryPage, { initialInventory } from "../../modules/inventory/InventoryPage";
import type { InventoryProduct, InventoryView } from "../../modules/inventory/InventoryPage";
import type { ReactNode } from "react";

import { Box } from "@mui/material";

import Sidebar from "./Sidebar";
import type { SidebarPage } from "./Sidebar";

import Header from "./Header";
import FeedbackSnackbar from "../../components/common/FeedbackSnackbar";

import POSPage from "../../modules/pos/POSPage";
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
    setActivePage(page);
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

      case "sales":
        return returnInvoice ? <ReturnExchangePage sale={returnInvoice} onBack={() => setReturnInvoice(null)} onComplete={() => { setReturnedInvoices(previous => previous.includes(returnInvoice.invoice) ? previous : [...previous, returnInvoice.invoice]); setReturnInvoice(null); setFeedback("Return / exchange completed successfully."); }} /> : <SalesPage key={invoiceScanRequested ? "invoice-scan" : "sales"} initialScanOpen={invoiceScanRequested} returnedInvoices={returnedInvoices} onNewSale={() => handleNavigate("pos")} onReturnRefund={sale => { setInvoiceScanRequested(false); setReturnInvoice(sale); }} />;

      default:
        return children;
    }
  };

  return (
    <Box
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
            overflowY: "auto",
          }}
        >
          {renderPage()}
        </Box>
      </Box>
    </Box>
  );
}
