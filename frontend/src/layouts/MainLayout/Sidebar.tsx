
import { useState } from "react";

import {
  Box,
  Collapse,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import BarChartIcon from "@mui/icons-material/BarChart";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import PeopleIcon from "@mui/icons-material/People";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsIcon from "@mui/icons-material/Settings";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CloseIcon from "@mui/icons-material/Close";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import HistoryIcon from "@mui/icons-material/History";

import "./Sidebar.css";

/* ======================================================
   PAGE TYPES
   ====================================================== */

export type SidebarPage =
  | "dashboard"
  | "pos"
  | "sales"
  | "inventory"
  | "stock-overview"
  | "stock-adjustments"
  | "stock-transfer"
  | "stock-history"
  | "products"
  | "purchases"
  | "suppliers"
  | "customers"
  | "reports"
  | "settings";

interface SidebarProps {
  activePage: SidebarPage;
  onNavigate: (page: SidebarPage) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

/* ======================================================
   MAIN NAVIGATION
   ====================================================== */

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: DashboardIcon },
  { id: "pos", label: "POS / Billing", icon: PointOfSaleIcon },
  { id: "sales", label: "Sales", icon: BarChartIcon },
  { id: "inventory", label: "Inventory", icon: Inventory2Icon },
  { id: "products", label: "Products", icon: LocalOfferOutlinedIcon },
  { id: "purchases", label: "Purchases", icon: LocalShippingOutlinedIcon },
  { id: "suppliers", label: "Suppliers", icon: GroupsOutlinedIcon },
  { id: "customers", label: "Customers", icon: PeopleIcon },
  { id: "reports", label: "Reports", icon: AssessmentIcon },
] as const;

/* ======================================================
   INVENTORY SUBMENU
   ====================================================== */

const inventorySubItems = [
  {
    id: "stock-overview",
    label: "Stock Overview",
    icon: FactCheckOutlinedIcon,
  },
  {
    id: "stock-adjustments",
    label: "Stock Adjustments",
    icon: TuneOutlinedIcon,
  },
  {
    id: "stock-transfer",
    label: "Stock Transfer",
    icon: SwapHorizIcon,
  },
  {
    id: "stock-history",
    label: "Stock History",
    icon: HistoryIcon,
  },
] as const;

const inventoryPages: readonly SidebarPage[] = [
  "inventory",
  "stock-overview",
  "stock-adjustments",
  "stock-transfer",
  "stock-history",
];

/* ======================================================
   SIDEBAR COMPONENT
   ====================================================== */

function Sidebar({
  activePage,
  onNavigate,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  /*
   * Only Inventory expansion is stored locally.
   * The selected page comes from MainLayout.
   */
  const [inventoryExpanded, setInventoryExpanded] =
    useState(() => inventoryPages.includes(activePage));

  const inventoryIsActive =
    inventoryPages.includes(activePage);

  /* ==========================================
     NAVIGATION HANDLER
     ========================================== */

  const navigate = (page: SidebarPage) => {
    if (inventoryPages.includes(page)) {
      // Keep Inventory expanded when selecting
      // Stock Overview, Adjustments, Transfer, or History.
      setInventoryExpanded(true);
    } else {
      // Automatically collapse Inventory when
      // navigating to another main menu.
      setInventoryExpanded(false);
    }

    // Update the active navigation button.
    onNavigate(page);

    // Close the mobile sidebar after navigation.
    onMobileClose?.();
  };

  /* ==========================================
     INVENTORY CLICK HANDLER
     ========================================== */

  const handleInventoryClick = () => {
    if (!inventoryIsActive) {
      /*
       * Coming from Dashboard, Sales, Purchases,
       * or any other main menu:
       *
       * First click selects Inventory AND opens
       * its submenu.
       */
      setInventoryExpanded(true);
      onNavigate("inventory");
    } else {
      /*
       * Inventory is already selected:
       * Toggle only the submenu.
       */
      setInventoryExpanded((previous) => !previous);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <Box
          className="ps-sidebar-backdrop"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <Box
        component="aside"
        className={`ps-sidebar ${
          mobileOpen ? "ps-sidebar-open" : ""
        }`}
        aria-label="Main navigation"
      >
        {/* =====================================
            BRAND
           ===================================== */}

        <Box className="ps-sidebar-brand">
          <Box className="ps-sidebar-brand-top">
            <ShoppingCartIcon
              className="ps-sidebar-brand-icon"
            />

            <Box className="ps-sidebar-brand-text">
              <Typography className="ps-sidebar-brand-name">
                Priyasaman POS
              </Typography>

              <Typography className="ps-sidebar-brand-subtitle">
                Point of Sale System
              </Typography>
            </Box>
          </Box>

          <Box className="ps-sidebar-brand-curve" />

          <IconButton
            className="ps-sidebar-close"
            onClick={onMobileClose}
            aria-label="Close navigation"
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* =====================================
            NAVIGATION
           ===================================== */}

        <Box className="ps-sidebar-scroll">
          <List className="ps-sidebar-nav" disablePadding>
            {navigationItems.map((item) => {
              const IconComponent = item.icon;

              const isInventory =
                item.id === "inventory";

              /*
               * Inventory is active for its main page
               * and all four submenu pages.
               */
              const selected = isInventory
                ? inventoryIsActive
                : activePage === item.id;

              return (
                <Box key={item.id}>
                  <Box
                    className={`ps-sidebar-nav-row ${
                      selected
                        ? "ps-sidebar-nav-row-active"
                        : ""
                    }`}
                  >
                    <ListItemButton
                      className={`ps-sidebar-item ${
                        selected
                          ? "ps-sidebar-item-active"
                          : ""
                      }`}
                      selected={selected}
                      aria-expanded={
                        isInventory
                          ? inventoryExpanded
                          : undefined
                      }
                      aria-controls={
                        isInventory
                          ? "ps-inventory-submenu"
                          : undefined
                      }
                      onClick={() => {
                        if (isInventory) {
                          handleInventoryClick();
                        } else {
                          navigate(item.id);
                        }
                      }}
                    >
                      <ListItemIcon
                        className="ps-sidebar-item-icon"
                      >
                        <IconComponent />
                      </ListItemIcon>

                      <ListItemText
                        primary={item.label}
                        slotProps={{
                          primary: {
                            className: "ps-sidebar-item-label",
                          },
                        }}
                      />

                      {/* Arrow inside same Inventory button */}
                      {isInventory && (
                        <Box
                          component="span"
                          className="ps-sidebar-expand-icon"
                        >
                          {inventoryExpanded ? (
                            <ExpandLessIcon />
                          ) : (
                            <ExpandMoreIcon />
                          )}
                        </Box>
                      )}
                    </ListItemButton>
                  </Box>

                  {/* =====================================
                      INVENTORY SUBMENU
                     ===================================== */}

                  {isInventory && (
                    <Collapse
                      in={inventoryExpanded}
                      timeout="auto"
                      unmountOnExit
                    >
                      <Box
                        id="ps-inventory-submenu"
                        className="ps-sidebar-submenu"
                      >
                        {inventorySubItems.map((subItem) => {
                          const SubIcon = subItem.icon;

                          const subSelected =
                            activePage === subItem.id;

                          return (
                            <ListItemButton
                              key={subItem.id}
                              className={`ps-sidebar-subitem ${
                                subSelected
                                  ? "ps-sidebar-subitem-active"
                                  : ""
                              }`}
                              selected={subSelected}
                              onClick={() => navigate(subItem.id)}
                            >
                              <SubIcon
                                className="ps-sidebar-subitem-icon"
                              />

                              <ListItemText
                                primary={subItem.label}
                                slotProps={{
                                  primary: {
                                    className:
                                      "ps-sidebar-subitem-label",
                                  },
                                }}
                              />
                            </ListItemButton>
                          );
                        })}
                      </Box>
                    </Collapse>
                  )}
                </Box>
              );
            })}
          </List>
        </Box>

        {/* =====================================
            SETTINGS — BOTTOM
           ===================================== */}

        <Box className="ps-sidebar-settings">
          <Box className="ps-sidebar-divider" />

          <ListItemButton
            className={`ps-sidebar-item ${
              activePage === "settings"
                ? "ps-sidebar-item-active"
                : ""
            }`}
            selected={activePage === "settings"}
            onClick={() => navigate("settings")}
          >
            <ListItemIcon
              className="ps-sidebar-item-icon"
            >
              <SettingsIcon />
            </ListItemIcon>

            <ListItemText
              primary="Settings"
              slotProps={{
                primary: {
                  className: "ps-sidebar-item-label",
                },
              }}
            />
          </ListItemButton>
        </Box>
      </Box>
    </>
  );
}

export default Sidebar;
