
import { useMemo, useState } from "react";

import {
  Alert,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import {
  ApprovalOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  ErrorOutlined,
  InfoOutlined,
  Inventory2Outlined,
  MarkEmailReadOutlined,
  NotificationsNoneOutlined,
  PaymentsOutlined,
  SearchOutlined,
  SyncProblemOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";

// ============================================
// TYPES
// ============================================

export type NotificationCategory =
  | "inventory"
  | "sync"
  | "approval"
  | "payment"
  | "system"
  | "other";

export type NotificationSeverity =
  | "info"
  | "success"
  | "warning"
  | "error";

export interface POSNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  timestamp: string;
  read: boolean;
  reference?: string;
}

export interface NotificationCenterProps {
  notifications: POSNotification[];
  loading?: boolean;
  error?: string | null;
  pageSize?: number;
  title?: string;
  onMarkRead?: (id: string) => void;
  onMarkUnread?: (id: string) => void;
  onMarkAllRead?: () => void;
  onDelete?: (id: string) => void;
  onOpenNotification?: (notification: POSNotification) => void;
}

// ============================================
// CONFIGURATION
// ============================================

const CATEGORY_LABELS: Record<
  NotificationCategory,
  string
> = {
  inventory: "Inventory",
  sync: "Synchronization",
  approval: "Approvals",
  payment: "Payments",
  system: "System",
  other: "Other",
};

const SEVERITY_COLORS: Record<
  NotificationSeverity,
  "info" | "success" | "warning" | "error"
> = {
  info: "info",
  success: "success",
  warning: "warning",
  error: "error",
};

function getNotificationIcon(
  category: NotificationCategory,
  severity: NotificationSeverity
) {
  if (severity === "error") {
    return <ErrorOutlined color="error" />;
  }

  if (severity === "warning") {
    return <WarningAmberOutlined color="warning" />;
  }

  switch (category) {
    case "inventory":
      return <Inventory2Outlined color="info" />;
    case "sync":
      return <SyncProblemOutlined color="info" />;
    case "approval":
      return <ApprovalOutlined color="info" />;
    case "payment":
      return <PaymentsOutlined color="info" />;
    case "system":
      return <InfoOutlined color="info" />;
    default:
      return <NotificationsNoneOutlined color="action" />;
  }
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

// ============================================
// COMPONENT
// ============================================

export default function NotificationCenter({
  notifications,
  loading = false,
  error = null,
  pageSize = 10,
  title = "Notification Center",
  onMarkRead,
  onMarkUnread,
  onMarkAllRead,
  onDelete,
  onOpenNotification,
}: NotificationCenterProps) {
  const [tab, setTab] = useState<
    "all" | "unread" | "read"
  >("all");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [visibleCount, setVisibleCount] =
    useState(pageSize);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  // ==========================================
  // FILTER AND SORT
  // ==========================================

  const filteredNotifications = useMemo(() => {
    const term = search.trim().toLowerCase();

    return notifications
      .filter((notification) => {
        const matchesTab =
          tab === "all" ||
          (tab === "unread" && !notification.read) ||
          (tab === "read" && notification.read);

        const matchesCategory =
          category === "all" ||
          notification.category === category;

        const searchable = [
          notification.title,
          notification.message,
          notification.reference ?? "",
          CATEGORY_LABELS[notification.category],
        ]
          .join(" ")
          .toLowerCase();

        return (
          matchesTab &&
          matchesCategory &&
          (!term || searchable.includes(term))
        );
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime()
      );
  }, [notifications, tab, search, category]);

  const displayedNotifications =
    filteredNotifications.slice(0, visibleCount);

  const resetPagination = () => {
    setVisibleCount(pageSize);
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <Paper
      variant="outlined"
      sx={{ p: { xs: 2, md: 3 } }}
    >
      <Stack spacing={2.5}>
        {/* HEADER */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700 }}
            >
              {title}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              {unreadCount} unread notifications
            </Typography>
          </Box>

          {onMarkAllRead && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<MarkEmailReadOutlined />}
              disabled={unreadCount === 0 || loading}
              onClick={onMarkAllRead}
            >
              Mark All Read
            </Button>
          )}
        </Box>

        {/* TABS */}
        <Tabs
          value={tab}
          onChange={(_, value: "all" | "unread" | "read") => {
            setTab(value);
            resetPagination();
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All" value="all" />

          <Tab
            value="unread"
            label={
              <Badge
                badgeContent={unreadCount}
                color="primary"
                max={99}
                sx={{ pr: 1 }}
              >
                Unread
              </Badge>
            }
          />

          <Tab label="Read" value="read" />
        </Tabs>

        {/* SEARCH AND CATEGORY */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Search notifications..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              resetPagination();
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />

          <FormControl
            size="small"
            sx={{ minWidth: 170 }}
          >
            <Select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                resetPagination();
              }}
              displayEmpty
              aria-label="Filter notification category"
            >
              <MenuItem value="all">
                All Categories
              </MenuItem>

              {(
                Object.entries(CATEGORY_LABELS) as [
                  NotificationCategory,
                  string,
                ][]
              ).map(([value, label]) => (
                <MenuItem
                  key={value}
                  value={value}
                >
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* ERROR */}
        {error && (
          <Alert severity="error">{error}</Alert>
        )}

        {/* LOADING */}
        {loading && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: 4,
            }}
          >
            <CircularProgress size={30} />
          </Box>
        )}

        {/* EMPTY */}
        {!loading &&
          filteredNotifications.length === 0 && (
            <Stack
              spacing={1}
              sx={{
                py: 5,
                alignItems: "center",
              }}
            >
              <NotificationsNoneOutlined
                sx={{
                  fontSize: 42,
                  color: "text.disabled",
                }}
              />

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "center" }}
              >
                No notifications found.
              </Typography>
            </Stack>
          )}

        {/* NOTIFICATION LIST */}
        {!loading &&
          displayedNotifications.length > 0 && (
            <Stack
              spacing={0}
              divider={<Divider flexItem />}
            >
              {displayedNotifications.map(
                (notification) => (
                  <Box
                    key={notification.id}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 2,
                      py: 2,
                      px: 1,
                      borderRadius: 1,
                      bgcolor: notification.read
                        ? "transparent"
                        : "action.hover",
                    }}
                  >
                    {/* ICON */}
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {getNotificationIcon(
                        notification.category,
                        notification.severity
                      )}
                    </Box>

                    {/* CONTENT */}
                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 1,
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: notification.read
                              ? 500
                              : 700,
                          }}
                        >
                          {notification.title}
                        </Typography>

                        <Chip
                          size="small"
                          variant="outlined"
                          color={
                            SEVERITY_COLORS[
                              notification.severity
                            ]
                          }
                          label={notification.severity}
                        />
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        {notification.message}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 1 }}
                      >
                        {formatTimestamp(
                          notification.timestamp
                        )}
                        {notification.reference
                          ? ` · ${notification.reference}`
                          : ""}
                      </Typography>

                      {/* ACTIONS */}
                      <Stack
                        direction="row"
                        sx={{
                          mt: 1,
                          flexWrap: "wrap",
                          gap: 1,
                        }}
                      >
                        {!notification.read && onMarkRead && (
                          <Button
                            size="small"
                            onClick={() =>
                              onMarkRead(notification.id)
                            }
                            startIcon={
                              <CheckCircleOutlined />
                            }
                          >
                            Mark Read
                          </Button>
                        )}

                        {notification.read && onMarkUnread && (
                          <Button
                            size="small"
                            onClick={() =>
                              onMarkUnread(notification.id)
                            }
                          >
                            Mark Unread
                          </Button>
                        )}

                        {onOpenNotification && (
                          <Button
                            size="small"
                            onClick={() =>
                              onOpenNotification(notification)
                            }
                          >
                            Open
                          </Button>
                        )}

                        {onDelete && (
                          <Button
                            size="small"
                            color="error"
                            onClick={() =>
                              onDelete(notification.id)
                            }
                            startIcon={<DeleteOutlined />}
                          >
                            Delete
                          </Button>
                        )}
                      </Stack>
                    </Box>
                  </Box>
                )
              )}
            </Stack>
          )}

        {/* LOAD MORE */}
        {!loading &&
          visibleCount <
            filteredNotifications.length && (
            <Button
              variant="outlined"
              onClick={() =>
                setVisibleCount(
                  (previous) => previous + pageSize
                )
              }
            >
              Load More
            </Button>
          )}
      </Stack>
    </Paper>
  );
}
