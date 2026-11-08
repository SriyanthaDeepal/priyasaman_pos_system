
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
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import LanguageIcon from "@mui/icons-material/Language";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

/* ==========================================
   TYPES
   ========================================== */

interface HeaderProps {
  onMenuClick?: () => void;
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

function Header({ onMenuClick }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(
    () => new Date()
  );

  const [language, setLanguage] = useState<Language>("EN");

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

  const formattedTime = currentTime.toLocaleTimeString(
    "en-GB",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
  );

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
    setLanguage(selectedLanguage);
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
                {language}
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
          {/* Sync Status */}

          <Box
            sx={{
              display: {
                xs: "none",
                sm: "flex",
              },
              alignItems: "center",
              gap: 0.7,
              px: 1.5,
              py: 0.5,
              borderRadius: 3,
              backgroundColor: "#e8f5e9",
              whiteSpace: "nowrap",
            }}
          >
            <CloudDoneIcon
              sx={{
                fontSize: 16,
                color: "#2e7d32",
              }}
            />

            <Typography
              variant="body2"
              sx={{
                color: "#2e7d32",
                fontWeight: 500,
              }}
            >
              Synced
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
                  Notifications
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
                  Mark all as read
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
                    No notifications
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
                        {notification.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 0.3,
                        }}
                      >
                        {notification.message}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {notification.time}
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
                Admin User
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Administrator
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
              Profile
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
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
