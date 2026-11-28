
import { useEffect, useState } from "react";
import type { MouseEvent } from "react";

import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Popover,
  Toolbar,
  Typography,
  Tooltip,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import LanguageIcon from "@mui/icons-material/Language";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SyncOutlinedIcon from "@mui/icons-material/SyncOutlined";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import QrCodeScannerOutlinedIcon from "@mui/icons-material/QrCodeScannerOutlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";

/* ==========================================
   TYPES
   ========================================== */

export type ConnectionState = "connected" | "disconnected" | "checking" | "unknown";
export type PeripheralConnections = {
  localDatabase?: ConnectionState;
  receiptPrinter?: ConnectionState;
  barcodeScanner?: ConnectionState;
  cashDrawer?: ConnectionState;
};

interface HeaderProps {
  language: "EN" | "SI";
  onLanguageChange: (value: "EN" | "SI") => void;
  onMenuClick?: () => void;
  connections?: PeripheralConnections;
}

type Language = "EN" | "SI";

interface NotificationItem {
  id: number;
  type: "warning" | "info";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

/* ==========================================
   INITIAL NOTIFICATIONS
   ========================================== */

const initialNotifications: NotificationItem[] = [
  {
    id: 1,
    type: "warning",
    title: "Low Stock",
    message: "Premium Ceylon Tea has only 5 units remaining.",
    time: "5 min ago",
    read: false,
  },
  {
    id: 2,
    type: "info",
    title: "Backup Completed",
    message: "POS data was successfully synchronized.",
    time: "15 min ago",
    read: false,
  },
  {
    id: 3,
    type: "warning",
    title: "Pending Sync",
    message: "2 transactions are waiting to be synchronized.",
    time: "20 min ago",
    read: false,
  },
];

/* ==========================================
   HEADER COMPONENT
   ========================================== */

const connectionLabels: Record<ConnectionState, string> = {
  connected: "Connected",
  disconnected: "Disconnected",
  checking: "Checking",
  unknown: "Not checked",
};
const connectionColors: Record<ConnectionState, string> = {
  connected: "#25844b",
  disconnected: "#cf4545",
  checking: "#c28514",
  unknown: "#6b7280",
};

function Header({ onMenuClick, connections, language, onLanguageChange }: HeaderProps) {
  const t = (value: string) => language === "SI" ? (translations[value] ?? value) : value;
  const connectionItems = [
    { key: "localDatabase", label: "Local Database", icon: <StorageOutlinedIcon sx={{ fontSize: 19 }} />, state: connections?.localDatabase ?? "unknown" },
    { key: "receiptPrinter", label: "Receipt Printer", icon: <PrintOutlinedIcon sx={{ fontSize: 19 }} />, state: connections?.receiptPrinter ?? "unknown" },
    { key: "barcodeScanner", label: "Barcode Scanner", icon: <QrCodeScannerOutlinedIcon sx={{ fontSize: 19 }} />, state: connections?.barcodeScanner ?? "unknown" },
    { key: "cashDrawer", label: "Cash Drawer", icon: <PointOfSaleOutlinedIcon sx={{ fontSize: 19 }} />, state: connections?.cashDrawer ?? "unknown" },
  ] as const;
  const [currentTime, setCurrentTime] = useState(
    () => new Date()
  );



  const [userMenuAnchor, setUserMenuAnchor] =
    useState<HTMLElement | null>(null);

  const [languageAnchor, setLanguageAnchor] =
    useState<HTMLElement | null>(null);

  const [notificationAnchor, setNotificationAnchor] =
    useState<HTMLElement | null>(null);

  const [notifications, setNotifications] =
    useState<NotificationItem[]>(initialNotifications);

  /* ==========================================
     LIVE CLOCK
     ========================================== */

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const formattedDate = language === "SI" ? `${currentTime.getFullYear()} ${["ජනවාරි","පෙබරවාරි","මාර්තු","අප්‍රේල්","මැයි","ජූනි","ජූලි","අගෝස්තු","සැප්තැම්බර්","ඔක්තෝබර්","නොවැම්බර්","දෙසැම්බර්"][currentTime.getMonth()]} ${currentTime.getDate()}, ${["ඉරිදා","සඳුදා","අඟහරුවාදා","බදාදා","බ්‍රහස්පතින්දා","සිකුරාදා","සෙනසුරාදා"][currentTime.getDay()]}` : currentTime.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

  const formattedTime = language === "SI" ? `${String(currentTime.getHours() % 12 || 12).padStart(2,"0")}:${String(currentTime.getMinutes()).padStart(2,"0")}:${String(currentTime.getSeconds()).padStart(2,"0")} ${currentTime.getHours() < 12 ? "පෙ.ව." : "ප.ව."}` : currentTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  /* ==========================================
     NOTIFICATION STATUS
     ========================================== */

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const hasNotifications = unreadCount > 0;

  /* ==========================================
     USER MENU HANDLERS
     ========================================== */

  const handleUserMenuOpen = (
    event: MouseEvent<HTMLElement>
  ) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  /* ==========================================
     LANGUAGE HANDLERS
     ========================================== */

  const handleLanguageMenuOpen = (
    event: MouseEvent<HTMLElement>
  ) => {
    setLanguageAnchor(event.currentTarget);
  };

  const handleLanguageMenuClose = () => {
    setLanguageAnchor(null);
  };

  const handleLanguageChange = (
    selectedLanguage: Language
  ) => {
    onLanguageChange(selectedLanguage);
    handleLanguageMenuClose();
  };

  /* ==========================================
     NOTIFICATION HANDLERS
     ========================================== */

  const handleNotificationOpen = (
    event: MouseEvent<HTMLElement>
  ) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleMarkAllAsRead = () => {
    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  };

  const handleNotificationRead = (id: number) => {
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  /* ==========================================
     RENDER
     ========================================== */

  return (
    <AppBar
      className="pos-themed-header"
      position="static"
      elevation={0}
      color="inherit"
      sx={{
        width: "100%",
        minWidth: 0,
        borderBottom: "1px solid #e0e0e0",
        backgroundColor: "#E8F3EC",
      }}
    >
      <Toolbar
        sx={{
          minHeight: "64px !important",
          height: "64px",
          justifyContent: "space-between",
          gap: 1,
          px: {
            xs: 1.5,
            sm: 2,
            md: 3,
          },
        }}
      >
        {/* =====================================
            LEFT SIDE
           ===================================== */}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: {
              xs: 1,
              sm: 2,
              md: 3,
            },
            minWidth: 0,
          }}
        >
          {/* Mobile / tablet sidebar button */}

          <IconButton
            aria-label="Open navigation menu"
            onClick={onMenuClick}
            sx={{
              display: "inline-flex",
              "@media (min-width: 901px)": {
                display: "none",
              },
              color: "#142033",
              flexShrink: 0,
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Language Selector */}

          <Box>
            <Box
              onClick={handleLanguageMenuOpen}
              role="button"
              tabIndex={0}
              aria-label="Select language"
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  event.preventDefault();
                  setLanguageAnchor(event.currentTarget);
                }
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                cursor: "pointer",
                userSelect: "none",
                whiteSpace: "nowrap",
              }}
            >
              <LanguageIcon fontSize="small" />

              <Typography variant="body2">
                {language === "SI" ? "සිංහල" : "English"}
              </Typography>

              <KeyboardArrowDownIcon fontSize="small" />
            </Box>

            <Menu
              anchorEl={languageAnchor}
              open={Boolean(languageAnchor)}
              onClose={handleLanguageMenuClose}
            >
              <MenuItem
                selected={language === "EN"}
                onClick={() => handleLanguageChange("EN")}
              >
                English
              </MenuItem>

              <MenuItem
                selected={language === "SI"}
                onClick={() => handleLanguageChange("SI")}
              >
                සිංහල
              </MenuItem>
            </Menu>
          </Box>

          {/* Live Clock */}

          <Box
            sx={{
              display: {
                xs: "none",
                sm: "flex",
              },
              alignItems: "center",
              gap: 0.7,
              whiteSpace: "nowrap",
            }}
          >
            <AccessTimeIcon
              fontSize="small"
              color="action"
            />

            <Typography
              variant="body2"
              sx={{
                fontFamily: "monospace",
              }}
            >
              {formattedTime}
            </Typography>
            <Typography variant="body2" sx={{display: {xs:"none", lg:"none", xl:"block"}, color:"#344054", whiteSpace:"nowrap"}}>{formattedDate}</Typography>
          </Box>
        </Box>

        {/* =====================================
            RIGHT SIDE
           ===================================== */}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: {
              xs: 1,
              sm: 1.5,
              md: 2,
            },
            minWidth: 0,
            flexShrink: 0,
          }}
        >
          {/* Peripheral connections: neutral until actual health checks are supplied. */}
          <Box
            role="group"
            aria-label="Hardware and local database connections"
            sx={{
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
              pr: { xs: 0.5, md: 1 },
              gap: { xs: 0.25, md: 1.25 },
            }}
          >
            {connectionItems.map((item) => (
              <Tooltip key={item.key} arrow title={`${t(item.label)}: ${t(connectionLabels[item.state])}`}>
                <Box
                  role="img"
                  aria-label={`${t(item.label)}: ${t(connectionLabels[item.state])}`}
                  sx={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: { xs: 27, md: 32 },
                    height: 32,
                    color: "#364a52",
                    borderRadius: 1,
                    "&:hover": { backgroundColor: "rgba(0,0,0,.05)" },
                  }}
                >
                  {item.icon}
                  <Typography component="span" sx={{display: {xs:"none", xl:"inline"}, fontSize:12, fontWeight:600, ml:.5, whiteSpace:"nowrap"}}>{t(item.label === "Local Database" ? "DB" : item.label === "Receipt Printer" ? "Printer" : item.label === "Barcode Scanner" ? "Scanner" : "Drawer")}</Typography>
                  <Box sx={{
                    position: "absolute",
                    right: {xs:1,xl:"auto"},
                    left: {xs:"auto",xl:20},
                    bottom: 3,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: connectionColors[item.state],
                    border: "1.5px solid #fff",
                  }} />
                </Box>
              </Tooltip>
            ))}
          </Box>

          {/* Sync Status */}

          <Box
            sx={{
              display: {
                xs: "flex",
              },
              alignItems: "center",
              gap: 0.7,
              px: { xs: 0.25, md: 0.5 },
              py: 0.5,
              borderRadius: 3,
              backgroundColor: "#dcf8e5",
              whiteSpace: "nowrap",
            }}
          >
            <SyncOutlinedIcon
              sx={{
                fontSize: 16,
                color: "#2e7d32",
              }}
            />

            <Typography
              variant="body2"
              sx={{
                display: { xs: "none", md: "block" },
                color: "#2e7d32",
                fontWeight: 700,
              }}
            >
              {t("Synced")}
            </Typography>
          </Box>

          {/* =====================================
              NOTIFICATIONS
             ===================================== */}

          <IconButton
            size="small"
            aria-label={
              hasNotifications
                ? `${unreadCount} unread notifications`
                : "Notifications"
            }
            onClick={handleNotificationOpen}
            sx={{
              position: "relative",
              flexShrink: 0,
            }}
          >
            <NotificationsNoneIcon />

            {hasNotifications && (
              <Box
                sx={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  backgroundColor: "#d32f2f",
                }}
              />
            )}
          </IconButton>

          {/* Notification Popover */}

          <Popover
            open={Boolean(notificationAnchor)}
            anchorEl={notificationAnchor}
            onClose={handleNotificationClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            slotProps={{
              paper: {
                sx: {
                  borderRadius: 2,
                  boxShadow:
                    "0 8px 30px rgba(0, 0, 0, 0.14)",
                },
              },
            }}
          >
            <Box
              sx={{
                width: 360,
                maxWidth: "calc(100vw - 24px)",
                maxHeight: 450,
                overflowY: "auto",
              }}
            >
              {/* Notification Header */}

              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  borderBottom: "1px solid #e0e0e0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                  }}
                >
                  {t("Notifications")}
                </Typography>

                <Typography
                  component="button"
                  type="button"
                  variant="caption"
                  onClick={handleMarkAllAsRead}
                  sx={{
                    cursor: "pointer",
                    border: "none",
                    background: "none",
                    color: "#008b30",
                    fontWeight: 600,
                    p: 0,
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  {t("Mark all as read")}
                </Typography>
              </Box>

              {/* Notification List */}

              {notifications.length === 0 ? (
                <Box
                  sx={{
                    p: 4,
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {t("No notifications")}
                  </Typography>
                </Box>
              ) : (
                notifications.map((notification) => (
                  <Box
                    key={notification.id}
                    onClick={() =>
                      handleNotificationRead(
                        notification.id
                      )
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();
                        handleNotificationRead(
                          notification.id
                        );
                      }
                    }}
                    sx={{
                      px: 2,
                      py: 1.5,
                      display: "flex",
                      gap: 1.5,
                      borderBottom:
                        "1px solid #eeeeee",
                      cursor: "pointer",
                      backgroundColor:
                        notification.read
                          ? "#ffffff"
                          : "#f7fcf8",
                      "&:hover": {
                        backgroundColor: "#f5f5f5",
                      },
                    }}
                  >
                    {/* Notification Icon */}

                    <Box
                      sx={{
                        flexShrink: 0,
                      }}
                    >
                      {notification.type === "warning" ? (
                        <WarningAmberIcon
                          sx={{
                            color: "#ed6c02",
                            fontSize: 22,
                          }}
                        />
                      ) : (
                        <InfoOutlinedIcon
                          sx={{
                            color: "#0288d1",
                            fontSize: 22,
                          }}
                        />
                      )}
                    </Box>

                    {/* Notification Content */}

                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: notification.read
                            ? 500
                            : 600,
                        }}
                      >
                        {t(notification.title)}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 0.3,
                        }}
                      >
                        {t(notification.message)}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {t(notification.time)}
                      </Typography>
                    </Box>

                    {!notification.read && (
                      <Box
                        sx={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          backgroundColor: "#008b30",
                          mt: 0.8,
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </Box>
                ))
              )}
            </Box>
          </Popover>

          {/* =====================================
              CURRENT USER
             ===================================== */}

          <Box
            onClick={handleUserMenuOpen}
            role="button"
            tabIndex={0}
            aria-label="Open user menu"
            onKeyDown={(event) => {
              if (
                event.key === "Enter" ||
                event.key === " "
              ) {
                event.preventDefault();
                setUserMenuAnchor(
                  event.currentTarget
                );
              }
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              cursor: "pointer",
              ml: {
                xs: 0,
                sm: 1,
              },
              minWidth: 0,
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: "#008b30",
                flexShrink: 0,
              }}
            >
              A
            </Avatar>

            <Box
              sx={{
                display: {
                  xs: "none",
                  md: "block",
                },
                minWidth: 0,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                }}
              >
                {t("Admin User")}
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                {t("Administrator")}
              </Typography>
            </Box>

            <KeyboardArrowDownIcon
              fontSize="small"
              sx={{
                display: {
                  xs: "none",
                  sm: "block",
                },
              }}
            />
          </Box>

          {/* =====================================
              USER MENU — IMPROVED POSITIONING
             ===================================== */}

          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  minWidth: 180,
                  maxWidth: "calc(100vw - 24px)",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow:
                    "0 8px 24px rgba(16, 24, 40, 0.12)",
                  overflow: "hidden",
                },
              },
              list: {
                sx: {
                  py: 0.5,
                },
              },
            }}
          >
            <MenuItem
              onClick={handleUserMenuClose}
              sx={{
                minHeight: 44,
                px: 2,
                fontSize: 14,
                fontWeight: 500,
                color: "#142033",
                "&:hover": {
                  backgroundColor: "#E8F3EC",
                },
              }}
            >
              {t("Profile")}
            </MenuItem>

            <MenuItem
              onClick={handleUserMenuClose}
              sx={{
                minHeight: 44,
                px: 2,
                fontSize: 14,
                fontWeight: 500,
                color: "#142033",
                "&:hover": {
                  backgroundColor: "#E8F3EC",
                },
              }}
            >
              {t("Logout")}
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

const translations: Record<string, string> = {
  "Synced": "සමමුහුර්තයි",
  "Notifications": "දැනුම්දීම්",
  "Mark all as read": "සියල්ල කියවූ ලෙස සලකුණු කරන්න",
  "No notifications": "දැනුම්දීම් නැත",
  "Admin User": "පරිපාලක",
  "Administrator": "පරිපාලක",
  "Profile": "පැතිකඩ",
  "Logout": "ඉවත් වන්න",
  "Local Database": "දේශීය දත්ත ගබඩාව",
  "Receipt Printer": "බිල්පත් මුද්‍රකය",
  "Barcode Scanner": "බාර්කෝඩ් කියවනය",
  "Cash Drawer": "මුදල් ලාච්චුව",
  "Connected": "සම්බන්ධයි",
  "Disconnected": "සම්බන්ධ නැත",
  "Checking": "පරීක්ෂා කරමින්",
  "Not checked": "පරීක්ෂා කර නැත",
  "DB": "දත්ත",
  "Printer": "මුද්‍රකය",
  "Scanner": "කියවනය",
  "Drawer": "ලාච්චුව",
  "Low Stock": "අඩු තොග",
  "Backup Completed": "උපස්ථය සම්පූර්ණයි",
  "Pending Sync": "සමමුහුර්ත කිරීමට ඇත",
  "Premium Ceylon Tea has only 5 units remaining.": "Premium Ceylon Tea ඒකක 5ක් පමණක් ඉතිරිව ඇත.",
  "POS data was successfully synchronized.": "විකුණුම් දත්ත සාර්ථකව සමමුහුර්ත කරන ලදී.",
  "2 transactions are waiting to be synchronized.": "ගනුදෙනු 2ක් සමමුහුර්ත කිරීමට ඇත.",
  "5 min ago": "මිනිත්තු 5කට පෙර",
  "15 min ago": "මිනිත්තු 15කට පෙර",
  "20 min ago": "මිනිත්තු 20කට පෙර"
};

export default Header;
