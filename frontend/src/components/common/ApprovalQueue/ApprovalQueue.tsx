
import { useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
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
  CheckCircleOutlined,
  HourglassEmptyOutlined,
  SearchOutlined,
  TaskAltOutlined,
  CancelOutlined,
} from "@mui/icons-material";

import ApprovalRequestCard from
  "../ApprovalRequestCard";

import type {
  ApprovalRequest,
  ApprovalRequestType,
} from "../ApprovalRequestCard";

// ============================================
// TYPES
// ============================================

export type ApprovalQueueStatusFilter =
  | "all"
  | "pending"
  | "approved"
  | "rejected";

export interface ApprovalQueueProps {
  requests: ApprovalRequest[];
  canApprove?: boolean;
  loading?: boolean;
  error?: string | null;
  processingIds?: string[];
  pageSize?: number;
  title?: string;
  onApprove?: (
    request: ApprovalRequest
  ) => void | Promise<void>;
  onReject?: (
    request: ApprovalRequest,
    reason: string
  ) => void | Promise<void>;
  onOpenReference?: (
    request: ApprovalRequest
  ) => void;
}

// ============================================
// CONFIGURATION
// ============================================

const TYPE_LABELS: Record<
  ApprovalRequestType,
  string
> = {
  refund: "Refund",
  discount: "Discount",
  "price-override": "Price Override",
  "inventory-adjustment": "Inventory Adjustment",
  other: "Other",
};

// ============================================
// COMPONENT
// ============================================

export default function ApprovalQueue({
  requests,
  canApprove = false,
  loading = false,
  error = null,
  processingIds = [],
  pageSize = 6,
  title = "Approval Queue",
  onApprove,
  onReject,
  onOpenReference,
}: ApprovalQueueProps) {
  const [statusFilter, setStatusFilter] =
    useState<ApprovalQueueStatusFilter>("all");

  const [typeFilter, setTypeFilter] =
    useState("all");

  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] =
    useState(pageSize);

  // ==========================================
  // SUMMARY COUNTS
  // ==========================================

  const counts = useMemo(
    () => ({
      pending: requests.filter(
        (request) => request.status === "pending"
      ).length,
      approved: requests.filter(
        (request) => request.status === "approved"
      ).length,
      rejected: requests.filter(
        (request) => request.status === "rejected"
      ).length,
    }),
    [requests]
  );

  // ==========================================
  // FILTERING
  // ==========================================

  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase();

    return requests
      .filter((request) => {
        const matchesStatus =
          statusFilter === "all" ||
          request.status === statusFilter;

        const matchesType =
          typeFilter === "all" ||
          request.type === typeFilter;

        const searchable = [
          request.id,
          request.title,
          request.requesterName,
          request.requesterId,
          request.reference ?? "",
          request.reason,
          TYPE_LABELS[request.type],
        ]
          .join(" ")
          .toLowerCase();

        return (
          matchesStatus &&
          matchesType &&
          (!term || searchable.includes(term))
        );
      })
      .sort(
        (a, b) =>
          new Date(b.requestedAt).getTime() -
          new Date(a.requestedAt).getTime()
      );
  }, [requests, search, statusFilter, typeFilter]);

  const displayedRequests =
    filteredRequests.slice(0, visibleCount);

  const resetPagination = () => {
    setVisibleCount(pageSize);
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <Stack spacing={3}>
      {/* HEADER */}
      <Box>
        <Typography
          variant="h5"
          sx={{ fontWeight: 700 }}
        >
          {title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          Review and manage POS authorization requests.
        </Typography>
      </Box>

      {/* SUMMARY CARDS */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(3, 1fr)",
          },
          gap: 2,
        }}
      >
        <Paper
          variant="outlined"
          sx={{ p: 2 }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center" }}
          >
            <HourglassEmptyOutlined color="warning" />

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Pending
            </Typography>
          </Stack>

          <Typography
            variant="h4"
            sx={{ fontWeight: 700, mt: 1 }}
          >
            {counts.pending}
          </Typography>
        </Paper>

        <Paper
          variant="outlined"
          sx={{ p: 2 }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center" }}
          >
            <TaskAltOutlined color="success" />

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Approved
            </Typography>
          </Stack>

          <Typography
            variant="h4"
            sx={{ fontWeight: 700, mt: 1 }}
          >
            {counts.approved}
          </Typography>
        </Paper>

        <Paper
          variant="outlined"
          sx={{ p: 2 }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center" }}
          >
            <CancelOutlined color="error" />

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Rejected
            </Typography>
          </Stack>

          <Typography
            variant="h4"
            sx={{ fontWeight: 700, mt: 1 }}
          >
            {counts.rejected}
          </Typography>
        </Paper>
      </Box>

      {/* FILTERS */}
      <Paper
        variant="outlined"
        sx={{ p: 2 }}
      >
        <Stack spacing={2}>
          <Tabs
            value={statusFilter}
            onChange={(_, value: ApprovalQueueStatusFilter) => {
              setStatusFilter(value);
              resetPagination();
            }}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All" value="all" />

            <Tab
              label={`Pending (${counts.pending})`}
              value="pending"
            />

            <Tab
              label={`Approved (${counts.approved})`}
              value="approved"
            />

            <Tab
              label={`Rejected (${counts.rejected})`}
              value="rejected"
            />
          </Tabs>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Search approval requests..."
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
              sx={{ minWidth: 180 }}
            >
              <Select
                value={typeFilter}
                onChange={(event) => {
                  setTypeFilter(event.target.value);
                  resetPagination();
                }}
                displayEmpty
                aria-label="Filter approval type"
              >
                <MenuItem value="all">
                  All Request Types
                </MenuItem>

                {(
                  Object.entries(TYPE_LABELS) as [
                    ApprovalRequestType,
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
        </Stack>
      </Paper>

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
            py: 5,
          }}
        >
          <CircularProgress size={32} />
        </Box>
      )}

      {/* EMPTY */}
      {!loading &&
        filteredRequests.length === 0 && (
          <Paper
            variant="outlined"
            sx={{
              p: 5,
              textAlign: "center",
            }}
          >
            <CheckCircleOutlined
              sx={{
                fontSize: 44,
                color: "text.disabled",
                mb: 1,
              }}
            />

            <Typography
              variant="body2"
              color="text.secondary"
            >
              No approval requests found.
            </Typography>
          </Paper>
        )}

      {/* REQUEST CARDS */}
      {!loading &&
        displayedRequests.length > 0 && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                lg: "repeat(2, minmax(0, 1fr))",
              },
              gap: 2,
              alignItems: "start",
            }}
          >
            {displayedRequests.map((request) => (
              <ApprovalRequestCard
                key={request.id}
                request={request}
                canApprove={canApprove}
                processing={processingIds.includes(
                  request.id
                )}
                onApprove={onApprove}
                onReject={onReject}
                onOpenReference={onOpenReference}
              />
            ))}
          </Box>
        )}

      {/* LOAD MORE */}
      {!loading &&
        visibleCount < filteredRequests.length && (
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
  );
}
