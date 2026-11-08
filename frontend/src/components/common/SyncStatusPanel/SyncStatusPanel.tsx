
import { useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  CheckCircleOutlined,
  CloudDoneOutlined,
  CloudOffOutlined,
  ErrorOutlineOutlined,
  HistoryOutlined,
  RefreshOutlined,
  SyncOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";

// ============================================
// TYPES
// ============================================

export type SyncConnectionStatus =
  | "online"
  | "offline"
  | "checking";

export type SyncProcessStatus =
  | "idle"
  | "syncing"
  | "completed"
  | "failed";

export type SyncRecordStatus =
  | "pending"
  | "syncing"
  | "synced"
  | "failed"
  | "conflict";

export interface SyncRecord {
  id: string;
  entityType: string;
  reference: string;
  status: SyncRecordStatus;
  createdAt: string;
  error?: string;
  attempts?: number;
}

export interface SyncActivity {
  id: string;
  message: string;
  timestamp: string;
  severity: "info" | "success" | "warning" | "error";
}

export interface SyncStatusPanelProps {
  deviceName?: string;
  connectionStatus: SyncConnectionStatus;
  syncStatus: SyncProcessStatus;
  progress?: number;
  lastSuccessfulSync?: string | null;
  records: SyncRecord[];
  activities?: SyncActivity[];
  loading?: boolean;
  error?: string | null;
  processingIds?: string[];
  onSyncNow?: () => void | Promise<void>;
  onRetryRecord?: (record: SyncRecord) => void | Promise<void>;
  onRetryAll?: () => void | Promise<void>;
  onResolveConflict?: (record: SyncRecord) => void;
}

// ============================================
// HELPERS
// ============================================

function formatDate(value?: string | null): string {
  if (!value) return "Never";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusColor(
  status: SyncRecordStatus
): "default" | "info" | "success" | "warning" | "error" {
  switch (status) {
    case "pending":
      return "warning";
    case "syncing":
      return "info";
    case "synced":
      return "success";
    case "failed":
      return "error";
    case "conflict":
      return "warning";
  }
}

// ============================================
// COMPONENT
// ============================================

export default function SyncStatusPanel({
  deviceName = "POS Terminal",
  connectionStatus,
  syncStatus,
  progress = 0,
  lastSuccessfulSync = null,
  records,
  activities = [],
  loading = false,
  error = null,
  processingIds = [],
  onSyncNow,
  onRetryRecord,
  onRetryAll,
  onResolveConflict,
}: SyncStatusPanelProps) {
  const [actionError, setActionError] = useState<
    string | null
  >(null);

  const [localProcessing, setLocalProcessing] =
    useState<string | null>(null);

  const pendingCount = records.filter(
    (record) =>
      record.status === "pending" ||
      record.status === "syncing"
  ).length;

  const failedCount = records.filter(
    (record) => record.status === "failed"
  ).length;

  const conflictCount = records.filter(
    (record) => record.status === "conflict"
  ).length;

  const isOnline = connectionStatus === "online";
  const isSyncing = syncStatus === "syncing";

  const isBusy =
    isSyncing || localProcessing !== null;

  const safeProgress = Math.max(
    0,
    Math.min(100, progress)
  );

  // ==========================================
  // ASYNC ACTION HANDLER
  // ==========================================

  const runAction = async (
    key: string,
    callback?: () => void | Promise<void>
  ) => {
    if (!callback || isBusy) return;

    setLocalProcessing(key);
    setActionError(null);

    try {
      await callback();
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error
          ? caughtError.message
          : "Synchronization operation failed."
      );
    } finally {
      setLocalProcessing(null);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
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
              Synchronization Center
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              {deviceName}
            </Typography>
          </Box>

          <Chip
            icon={
              isOnline ? (
                <CloudDoneOutlined />
              ) : (
                <CloudOffOutlined />
              )
            }
            color={
              connectionStatus === "online"
                ? "success"
                : connectionStatus === "offline"
                ? "warning"
                : "default"
            }
            label={
              connectionStatus.charAt(0).toUpperCase() +
              connectionStatus.slice(1)
            }
            variant="outlined"
          />
        </Box>

        {/* SUMMARY */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(3, minmax(0, 1fr))",
            },
            gap: 1.5,
          }}
        >
          {[
            {
              label: "Pending",
              value: pendingCount,
              color: "warning.main",
            },
            {
              label: "Failed",
              value: failedCount,
              color: "error.main",
            },
            {
              label: "Conflicts",
              value: conflictCount,
              color: "info.main",
            },
          ].map((item) => (
            <Paper
              key={item.label}
              variant="outlined"
              sx={{ p: 2 }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
              >
                {item.label}
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: item.color,
                }}
              >
                {item.value}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* SYNC PROGRESS */}
        <Paper
          variant="outlined"
          sx={{ p: 2 }}
        >
          <Stack spacing={2}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700 }}
              >
                Synchronization Status
              </Typography>

              <Chip
                size="small"
                color={
                  syncStatus === "completed"
                    ? "success"
                    : syncStatus === "failed"
                    ? "error"
                    : syncStatus === "syncing"
                    ? "info"
                    : "default"
                }
                label={syncStatus}
              />
            </Box>

            <LinearProgress
              variant="determinate"
              value={safeProgress}
              sx={{
                height: 8,
                borderRadius: 2,
              }}
            />

            <Typography
              variant="caption"
              color="text.secondary"
            >
              Progress: {safeProgress}%
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Last successful sync:{" "}
              {formatDate(lastSuccessfulSync)}
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
            >
              <Button
                variant="contained"
                startIcon={<SyncOutlined />}
                disabled={
                  !isOnline ||
                  isBusy ||
                  !onSyncNow
                }
                onClick={() =>
                  void runAction("sync", onSyncNow)
                }
              >
                Sync Now
              </Button>

              <Button
                variant="outlined"
                startIcon={<RefreshOutlined />}
                disabled={
                  !isOnline ||
                  isBusy ||
                  failedCount === 0 ||
                  !onRetryAll
                }
                onClick={() =>
                  void runAction("retry-all", onRetryAll)
                }
              >
                Retry All Failed
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* ERRORS */}
        {error && (
          <Alert severity="error">{error}</Alert>
        )}

        {actionError && (
          <Alert
            severity="error"
            onClose={() => setActionError(null)}
          >
            {actionError}
          </Alert>
        )}

        {/* LOADING */}
        {loading && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: 3,
            }}
          >
            <CircularProgress size={28} />
          </Box>
        )}

        {/* RECORDS */}
        {!loading && (
          <Stack spacing={2}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700 }}
            >
              Synchronization Records
            </Typography>

            {records.length === 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
              >
                No synchronization records.
              </Typography>
            )}

            {records.map((record) => {
              const recordBusy =
                processingIds.includes(record.id) ||
                localProcessing === record.id;

              return (
                <Paper
                  key={record.id}
                  variant="outlined"
                  sx={{ p: 2 }}
                >
                  <Stack spacing={1.5}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 2,
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700 }}
                        >
                          {record.entityType} ·{" "}
                          {record.reference}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {record.id} ·{" "}
                          {formatDate(record.createdAt)}
                        </Typography>
                      </Box>

                      <Chip
                        size="small"
                        color={getStatusColor(record.status)}
                        label={record.status}
                      />
                    </Box>

                    {record.error && (
                      <Alert severity="warning">
                        {record.error}
                      </Alert>
                    )}

                    {record.attempts !== undefined && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Attempts: {record.attempts}
                      </Typography>
                    )}

                    {record.status === "failed" &&
                      onRetryRecord && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<RefreshOutlined />}
                          disabled={
                            !isOnline ||
                            isBusy ||
                            recordBusy
                          }
                          onClick={() =>
                            void runAction(
                              record.id,
                              () => onRetryRecord(record)
                            )
                          }
                        >
                          Retry Record
                        </Button>
                      )}

                    {record.status === "conflict" &&
                      onResolveConflict && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          startIcon={
                            <WarningAmberOutlined />
                          }
                          disabled={isBusy || recordBusy}
                          onClick={() =>
                            onResolveConflict(record)
                          }
                        >
                          Resolve Conflict
                        </Button>
                      )}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}

        {/* ACTIVITY HISTORY */}
        {activities.length > 0 && (
          <>
            <Divider />

            <Stack spacing={1.5}>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: "center" }}
              >
                <HistoryOutlined color="action" />

                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700 }}
                >
                  Recent Sync Activity
                </Typography>
              </Stack>

              {activities.map((activity) => (
                <Box
                  key={activity.id}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.5,
                  }}
                >
                  {activity.severity === "success" ? (
                    <CheckCircleOutlined
                      color="success"
                      fontSize="small"
                    />
                  ) : activity.severity === "error" ? (
                    <ErrorOutlineOutlined
                      color="error"
                      fontSize="small"
                    />
                  ) : (
                    <WarningAmberOutlined
                      color="warning"
                      fontSize="small"
                    />
                  )}

                  <Box>
                    <Typography variant="body2">
                      {activity.message}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {formatDate(activity.timestamp)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  );
}
