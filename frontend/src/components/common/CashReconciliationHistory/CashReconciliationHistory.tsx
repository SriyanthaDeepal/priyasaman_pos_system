
import { useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import {
  CheckCircleOutlined,
  FactCheckOutlined,
  HighlightOffOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";

// ============================================
// TYPES
// ============================================

export type ReconciliationStatus =
  | "balanced"
  | "shortage"
  | "surplus";

export type ReconciliationReviewStatus =
  | "pending"
  | "approved"
  | "rejected";

export type ReconciliationCountType =
  | "mid-shift"
  | "shift-closing";

export interface ReconciliationDenomination {
  value: number;
  type: "note" | "coin";
  quantity: number;
  total: number;
}

export interface CashReconciliationRecord {
  id: string;
  reference: string;

  shiftId: string;
  terminalId: string;
  terminalName?: string;

  cashierId: string;
  cashierName: string;

  countedAt: string;
  countType: ReconciliationCountType;

  expectedCash: number;
  countedCash: number;

  discrepancy: number;
  discrepancyStatus: ReconciliationStatus;

  reviewStatus: ReconciliationReviewStatus;

  denominations: ReconciliationDenomination[];

  notes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewReason?: string;
}

export interface ReconciliationReviewPayload {
  reconciliationId: string;
  decision: "approved" | "rejected";
  reason: string;
}

export interface CashReconciliationHistoryProps {
  records: CashReconciliationRecord[];

  loading?: boolean;
  processing?: boolean;
  error?: string | null;

  title?: string;
  canReview?: boolean;

  onReview?: (
    payload: ReconciliationReviewPayload
  ) => void | Promise<void>;
}

// ============================================
// HELPERS
// ============================================

const roundMoney = (value: number): number =>
  Math.round(value * 100) / 100;

const formatMoney = (value: number): string =>
  `Rs. ${value.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatSignedMoney = (value: number): string => {
  const rounded = roundMoney(value);

  if (rounded > 0) {
    return `+ ${formatMoney(rounded)}`;
  }

  if (rounded < 0) {
    return `− ${formatMoney(Math.abs(rounded))}`;
  }

  return formatMoney(0);
};

const formatDateTime = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDiscrepancyColor = (
  status: ReconciliationStatus
): "success" | "warning" | "error" => {
  if (status === "shortage") return "error";
  if (status === "surplus") return "warning";
  return "success";
};

const getReviewColor = (
  status: ReconciliationReviewStatus
): "default" | "success" | "error" => {
  if (status === "approved") return "success";
  if (status === "rejected") return "error";
  return "default";
};

// ============================================
// COMPONENT
// ============================================

export default function CashReconciliationHistory({
  records,
  loading = false,
  processing = false,
  error = null,
  title = "Cash Reconciliation History",
  canReview = false,
  onReview,
}: CashReconciliationHistoryProps) {
  const [search, setSearch] = useState("");

  const [discrepancyFilter, setDiscrepancyFilter] =
    useState<"all" | ReconciliationStatus>("all");

  const [reviewFilter, setReviewFilter] =
    useState<"all" | ReconciliationReviewStatus>("all");

  const [countTypeFilter, setCountTypeFilter] =
    useState<"all" | ReconciliationCountType>("all");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [selectedRecord, setSelectedRecord] =
    useState<CashReconciliationRecord | null>(null);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewDecision, setReviewDecision] =
    useState<"approved" | "rejected">("approved");
  const [reviewReason, setReviewReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] =
    useState<string | null>(null);

  const busy = processing || submitting;

  // ==========================================
  // FILTER RECORDS
  // ==========================================

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records
      .filter((record) => {
        if (
          discrepancyFilter !== "all" &&
          record.discrepancyStatus !== discrepancyFilter
        ) {
          return false;
        }

        if (
          reviewFilter !== "all" &&
          record.reviewStatus !== reviewFilter
        ) {
          return false;
        }

        if (
          countTypeFilter !== "all" &&
          record.countType !== countTypeFilter
        ) {
          return false;
        }

        if (startDate || endDate) {
          const date = new Date(record.countedAt);

          if (Number.isNaN(date.getTime())) return false;

          if (startDate) {
            const start = new Date(
              `${startDate}T00:00:00`
            );

            if (date < start) return false;
          }

          if (endDate) {
            const end = new Date(
              `${endDate}T23:59:59.999`
            );

            if (date > end) return false;
          }
        }

        if (!query) return true;

        return [
          record.reference,
          record.shiftId,
          record.cashierName,
          record.terminalName ?? "",
          record.terminalId,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort(
        (a, b) =>
          new Date(b.countedAt).getTime() -
          new Date(a.countedAt).getTime()
      );
  }, [
    records,
    search,
    discrepancyFilter,
    reviewFilter,
    countTypeFilter,
    startDate,
    endDate,
  ]);

  // ==========================================
  // SUMMARY
  // ==========================================

  const summary = useMemo(
    () => ({
      total: filteredRecords.length,
      balanced: filteredRecords.filter(
        (record) =>
          record.discrepancyStatus === "balanced"
      ).length,
      shortages: filteredRecords.filter(
        (record) =>
          record.discrepancyStatus === "shortage"
      ).length,
      surpluses: filteredRecords.filter(
        (record) =>
          record.discrepancyStatus === "surplus"
      ).length,
    }),
    [filteredRecords]
  );

  const pageCount = Math.max(
    1,
    Math.ceil(filteredRecords.length / rowsPerPage)
  );

  const safePage = Math.min(page, pageCount - 1);

  const paginatedRecords = filteredRecords.slice(
    safePage * rowsPerPage,
    safePage * rowsPerPage + rowsPerPage
  );

  // ==========================================
  // REVIEW
  // ==========================================

  const openReview = (
    record: CashReconciliationRecord,
    decision: "approved" | "rejected"
  ) => {
    setSelectedRecord(record);
    setReviewDecision(decision);
    setReviewReason("");
    setLocalError(null);
    setReviewOpen(true);
  };

  const handleReview = async () => {
    if (
      !selectedRecord ||
      !canReview ||
      !onReview ||
      busy
    ) {
      return;
    }

    if (selectedRecord.reviewStatus !== "pending") {
      setLocalError(
        "Only pending reconciliations can be reviewed."
      );
      return;
    }

    if (
      reviewDecision === "rejected" &&
      !reviewReason.trim()
    ) {
      setLocalError(
        "A reason is required when rejecting a reconciliation."
      );
      return;
    }

    setSubmitting(true);
    setLocalError(null);

    try {
      await onReview({
        reconciliationId: selectedRecord.id,
        decision: reviewDecision,
        reason: reviewReason.trim(),
      });

      setReviewOpen(false);
      setSelectedRecord(null);
      setReviewReason("");
    } catch (caughtError) {
      setLocalError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to review reconciliation."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // RESET FILTERS
  // ==========================================

  const resetFilters = () => {
    setSearch("");
    setDiscrepancyFilter("all");
    setReviewFilter("all");
    setCountTypeFilter("all");
    setStartDate("");
    setEndDate("");
    setPage(0);
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <Paper
      variant="outlined"
      sx={{ p: 3, borderRadius: 2 }}
    >
      <Stack spacing={3}>
        {/* HEADER */}

        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={1.5}>
            <FactCheckOutlined color="primary" />

            <Typography
              variant="h6"
              sx={{ fontWeight: 700 }}
            >
              {title}
            </Typography>
          </Stack>

          <Chip
            size="small"
            label={`${filteredRecords.length} Records`}
            variant="outlined"
          />
        </Stack>

        {error && (
          <Alert severity="error">{error}</Alert>
        )}

        {localError && !reviewOpen && (
          <Alert
            severity="error"
            onClose={() => setLocalError(null)}
          >
            {localError}
          </Alert>
        )}

        {/* SUMMARY */}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 2,
          }}
        >
          {[
            {
              label: "Total Counts",
              value: summary.total,
              color: "text.primary",
            },
            {
              label: "Balanced",
              value: summary.balanced,
              color: "success.main",
            },
            {
              label: "Shortages",
              value: summary.shortages,
              color: "error.main",
            },
            {
              label: "Surpluses",
              value: summary.surpluses,
              color: "warning.main",
            },
          ].map((item) => (
            <Paper
              key={item.label}
              variant="outlined"
              sx={{ p: 2, borderRadius: 2 }}
            >
              <Typography
                variant="body2"
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

        {/* FILTERS */}

        <Stack
          direction={{ xs: "column", md: "row" }}
          sx={{ gap: 2 }}
        >
          <TextField
            size="small"
            label="Search"
            placeholder="Reference, shift, cashier..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            sx={{ flex: 2 }}
          />

          <TextField
            select
            size="small"
            label="Discrepancy"
            value={discrepancyFilter}
            onChange={(event) => {
              setDiscrepancyFilter(
                event.target.value as
                  | "all"
                  | ReconciliationStatus
              );
              setPage(0);
            }}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="balanced">Balanced</MenuItem>
            <MenuItem value="shortage">Shortage</MenuItem>
            <MenuItem value="surplus">Surplus</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            label="Review Status"
            value={reviewFilter}
            onChange={(event) => {
              setReviewFilter(
                event.target.value as
                  | "all"
                  | ReconciliationReviewStatus
              );
              setPage(0);
            }}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </TextField>

          <TextField
            select
            size="small"
            label="Count Type"
            value={countTypeFilter}
            onChange={(event) => {
              setCountTypeFilter(
                event.target.value as
                  | "all"
                  | ReconciliationCountType
              );
              setPage(0);
            }}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="mid-shift">
              Mid-shift
            </MenuItem>
            <MenuItem value="shift-closing">
              Shift Closing
            </MenuItem>
          </TextField>
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{ gap: 2 }}
        >
          <TextField
            label="From Date"
            type="date"
            size="small"
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value);
              setPage(0);
            }}
            slotProps={{
              inputLabel: { shrink: true },
            }}
          />

          <TextField
            label="To Date"
            type="date"
            size="small"
            value={endDate}
            onChange={(event) => {
              setEndDate(event.target.value);
              setPage(0);
            }}
            slotProps={{
              inputLabel: { shrink: true },
            }}
          />

          <Button onClick={resetFilters}>
            Reset Filters
          </Button>
        </Stack>

        {/* TABLE */}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Reference</TableCell>
                <TableCell>Counted At</TableCell>
                <TableCell>Cashier</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">
                  Expected
                </TableCell>
                <TableCell align="right">
                  Counted
                </TableCell>
                <TableCell align="right">
                  Difference
                </TableCell>
                <TableCell>Review</TableCell>
                <TableCell align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    align="center"
                  >
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : paginatedRecords.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    align="center"
                  >
                    <Typography
                      color="text.secondary"
                      sx={{ py: 3 }}
                    >
                      No reconciliation records found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRecords.map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>
                      {record.reference}
                    </TableCell>

                    <TableCell>
                      {formatDateTime(
                        record.countedAt
                      )}
                    </TableCell>

                    <TableCell>
                      {record.cashierName}
                    </TableCell>

                    <TableCell>
                      {record.countType === "mid-shift"
                        ? "Mid-shift"
                        : "Shift Closing"}
                    </TableCell>

                    <TableCell align="right">
                      {formatMoney(
                        record.expectedCash
                      )}
                    </TableCell>

                    <TableCell align="right">
                      {formatMoney(
                        record.countedCash
                      )}
                    </TableCell>

                    <TableCell align="right">
                      <Chip
                        size="small"
                        color={getDiscrepancyColor(
                          record.discrepancyStatus
                        )}
                        label={formatSignedMoney(
                          record.discrepancy
                        )}
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        color={getReviewColor(
                          record.reviewStatus
                        )}
                        label={record.reviewStatus}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Stack
                        direction="row"
                        sx={{
                          justifyContent: "center",
                          gap: 0.5,
                        }}
                      >
                        <Button
                          size="small"
                          startIcon={
                            <VisibilityOutlined />
                          }
                          onClick={() =>
                            setSelectedRecord(record)
                          }
                        >
                          View
                        </Button>

                        {canReview &&
                          onReview &&
                          record.reviewStatus ===
                            "pending" && (
                            <>
                              <Button
                                size="small"
                                color="success"
                                onClick={() =>
                                  openReview(
                                    record,
                                    "approved"
                                  )
                                }
                              >
                                Approve
                              </Button>

                              <Button
                                size="small"
                                color="error"
                                onClick={() =>
                                  openReview(
                                    record,
                                    "rejected"
                                  )
                                }
                              >
                                Reject
                              </Button>
                            </>
                          )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredRecords.length}
          page={safePage}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, nextPage) =>
            setPage(nextPage)
          }
          onRowsPerPageChange={(event) => {
            setRowsPerPage(
              Number(event.target.value)
            );
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Stack>

      {/* DETAILS DIALOG */}

      <Dialog
        open={Boolean(selectedRecord) && !reviewOpen}
        onClose={() => setSelectedRecord(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Reconciliation Details
        </DialogTitle>

        <DialogContent>
          {selectedRecord && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography>
                <strong>Reference:</strong>{" "}
                {selectedRecord.reference}
              </Typography>

              <Typography>
                <strong>Cashier:</strong>{" "}
                {selectedRecord.cashierName}
              </Typography>

              <Typography>
                <strong>Shift:</strong>{" "}
                {selectedRecord.shiftId}
              </Typography>

              <Typography>
                <strong>Terminal:</strong>{" "}
                {selectedRecord.terminalName ||
                  selectedRecord.terminalId}
              </Typography>

              <Typography>
                <strong>Count Type:</strong>{" "}
                {selectedRecord.countType}
              </Typography>

              <Typography>
                <strong>Expected:</strong>{" "}
                {formatMoney(
                  selectedRecord.expectedCash
                )}
              </Typography>

              <Typography>
                <strong>Counted:</strong>{" "}
                {formatMoney(
                  selectedRecord.countedCash
                )}
              </Typography>

              <Typography>
                <strong>Difference:</strong>{" "}
                {formatSignedMoney(
                  selectedRecord.discrepancy
                )}
              </Typography>

              <Typography>
                <strong>Review Status:</strong>{" "}
                {selectedRecord.reviewStatus}
              </Typography>

              {selectedRecord.reviewedBy && (
                <Typography>
                  <strong>Reviewed By:</strong>{" "}
                  {selectedRecord.reviewedBy}
                </Typography>
              )}

              {selectedRecord.reviewedAt && (
                <Typography>
                  <strong>Reviewed At:</strong>{" "}
                  {formatDateTime(
                    selectedRecord.reviewedAt
                  )}
                </Typography>
              )}

              {selectedRecord.reviewReason && (
                <Typography>
                  <strong>Review Reason:</strong>{" "}
                  {selectedRecord.reviewReason}
                </Typography>
              )}

              <Divider />

              <Typography
                sx={{ fontWeight: 700 }}
              >
                Denomination Breakdown
              </Typography>

              {selectedRecord.denominations.length ===
              0 ? (
                <Typography color="text.secondary">
                  No denomination details recorded.
                </Typography>
              ) : (
                selectedRecord.denominations.map(
                  (line) => (
                    <Stack
                      key={`${line.type}-${line.value}`}
                      direction="row"
                      sx={{
                        justifyContent:
                          "space-between",
                      }}
                    >
                      <Typography variant="body2">
                        {formatMoney(line.value)} ×{" "}
                        {line.quantity}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600 }}
                      >
                        {formatMoney(line.total)}
                      </Typography>
                    </Stack>
                  )
                )
              )}

              {selectedRecord.notes && (
                <>
                  <Divider />
                  <Typography>
                    <strong>Notes:</strong>{" "}
                    {selectedRecord.notes}
                  </Typography>
                </>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setSelectedRecord(null)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* REVIEW DIALOG */}

      <Dialog
        open={reviewOpen}
        onClose={() => {
          if (!busy) {
            setReviewOpen(false);
            setSelectedRecord(null);
          }
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {reviewDecision === "approved"
            ? "Approve Reconciliation"
            : "Reject Reconciliation"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {selectedRecord && (
              <Alert
                severity={
                  getDiscrepancyColor(
                    selectedRecord.discrepancyStatus
                  )
                }
              >
                Discrepancy:{" "}
                {formatSignedMoney(
                  selectedRecord.discrepancy
                )}
              </Alert>
            )}

            {localError && (
              <Alert severity="error">
                {localError}
              </Alert>
            )}

            <TextField
              label={
                reviewDecision === "rejected"
                  ? "Rejection Reason"
                  : "Review Notes (Optional)"
              }
              multiline
              minRows={3}
              fullWidth
              required={
                reviewDecision === "rejected"
              }
              disabled={busy}
              value={reviewReason}
              onChange={(event) =>
                setReviewReason(event.target.value)
              }
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            disabled={busy}
            onClick={() => {
              setReviewOpen(false);
              setSelectedRecord(null);
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color={
              reviewDecision === "approved"
                ? "success"
                : "error"
            }
            disabled={busy}
            startIcon={
              reviewDecision === "approved" ? (
                <CheckCircleOutlined />
              ) : (
                <HighlightOffOutlined />
              )
            }
            onClick={() => {
              void handleReview();
            }}
          >
            {busy
              ? "Processing..."
              : reviewDecision === "approved"
                ? "Confirm Approval"
                : "Confirm Rejection"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
