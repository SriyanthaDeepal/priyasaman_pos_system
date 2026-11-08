
import { useState } from "react";
import type { ReactNode } from "react";

import { Box } from "@mui/material";

import Sidebar from "./Sidebar";
import type { SidebarPage } from "./Sidebar";

import Header from "./Header";

import POSPage from "../../modules/pos/POSPage";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({
  children,
}: MainLayoutProps) {
  /* ==========================================
     ACTIVE PAGE
     ========================================== */

  const [activePage, setActivePage] =
    useState<SidebarPage>("dashboard");

  /* ==========================================
     MOBILE SIDEBAR
     ========================================== */

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  /* ==========================================
     NAVIGATION HANDLER
     ========================================== */

  const handleNavigate = (page: SidebarPage) => {
    setActivePage(page);
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
