
import { useRef, useState } from "react";
import type { ChangeEvent } from "react";

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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import {
  UploadFileOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  ErrorOutlined,
} from "@mui/icons-material";

import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// ------------------------------
// Types
// ------------------------------

export type ImportCell = string | number | boolean | null;
export type ImportRow = Record<string, ImportCell>;

export interface ImportColumn {
  key: string;
  label: string;
  required?: boolean;
}

export interface ImportButtonProps {
  columns: ImportColumn[];
  onImport: (rows: ImportRow[]) => Promise<void> | void;
  validateRow?: (row: ImportRow, index: number) => string[];
  label?: string;
  title?: string;
  maxFileSizeMB?: number;
  previewLimit?: number;
  disabled?: boolean;
}

interface ParsedRow {
  data: ImportRow;
  errors: string[];
  rowNumber: number;
}

interface PdfTextItem {
  str: string;
  x: number;
  y: number;
}

// ------------------------------
// Helpers
// ------------------------------

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function normalizeCell(value: unknown): ImportCell {
  if (value === null || value === undefined) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  return String(value);
}

function getColumnIndexes(
  headers: unknown[],
  columns: ImportColumn[]
): number[] {
  const normalized = headers.map(normalizeHeader);

  return columns.map((column) =>
    normalized.findIndex(
      (header) =>
        header === normalizeHeader(column.label) ||
        header === normalizeHeader(column.key)
    )
  );
}

function validateHeaders(
  headers: unknown[],
  columns: ImportColumn[]
): number[] {
  const indexes = getColumnIndexes(headers, columns);

  const missing = columns.filter(
    (column, index) =>
      column.required && indexes[index] === -1
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required columns: ${missing
        .map((column) => column.label)
        .join(", ")}`
    );
  }

  return indexes;
}

// ------------------------------
// CSV / Excel Parser
// ------------------------------

async function parseSpreadsheet(
  file: File
): Promise<unknown[][]> {
  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: false,
  });

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("The file contains no worksheets.");
  }

  return XLSX.utils.sheet_to_json<unknown[]>(
    workbook.Sheets[sheetName],
    {
      header: 1,
      defval: "",
      blankrows: false,
      raw: false,
    }
  );
}

// ------------------------------
// PDF Parser
// ------------------------------

// Supports simple text-based PDFs with consistent table columns.
// It does not perform OCR on scanned documents.

async function parsePDF(
  file: File,
  columns: ImportColumn[]
): Promise<unknown[][]> {
  const buffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
  });

  try {
    const pdf = await loadingTask.promise;
    const allRows: unknown[][] = [];

    let headerPositions: number[] | null = null;
    let headerLabels: string[] = [];

    for (
      let pageNumber = 1;
      pageNumber <= pdf.numPages;
      pageNumber++
    ) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();

      const items: PdfTextItem[] = content.items
        .filter(
          (
            item
          ): item is typeof item & {
            str: string;
            transform: number[];
          } => "str" in item && "transform" in item
        )
        .map((item) => ({
          str: item.str.trim(),
          x: item.transform[4],
          y: item.transform[5],
        }))
        .filter((item) => item.str.length > 0);

      // Group text by vertical position.
      const groups: PdfTextItem[][] = [];

      for (const item of items) {
        const existing = groups.find(
          (group) =>
            Math.abs(group[0].y - item.y) < 3
        );

        if (existing) {
          existing.push(item);
        } else {
          groups.push([item]);
        }
      }

      groups.sort(
        (a, b) => b[0].y - a[0].y
      );

      for (const group of groups) {
        group.sort(
          (a, b) => a.x - b.x
        );

        const joined = group.map(
          (item) => item.str
        );

        // Identify table headers.
        const matches = columns.filter((column) =>
          joined.some(
            (text) =>
              normalizeHeader(text) ===
                normalizeHeader(column.label) ||
              normalizeHeader(text) ===
                normalizeHeader(column.key)
          )
        );

        const requiredCount = columns.filter(
          (column) => column.required
        ).length;

        const isHeader =
          matches.length >=
          Math.max(2, requiredCount);

        if (isHeader) {
          headerPositions = group.map(
            (item) => item.x
          );

          headerLabels = joined;

          if (allRows.length === 0) {
            allRows.push(headerLabels);
          }

          continue;
        }

        if (
          !headerPositions ||
          headerLabels.length === 0
        ) {
          continue;
        }

        // Skip common PDF metadata.
        const combined = joined
          .join(" ")
          .toLowerCase();

        if (
          combined.startsWith("generated") ||
          combined.startsWith("page ") ||
          combined.startsWith("total records")
        ) {
          continue;
        }

        const row = new Array(
          headerLabels.length
        ).fill("");

        for (const item of group) {
          let closestIndex = 0;
          let closestDistance = Infinity;

          headerPositions.forEach(
            (x, index) => {
              const distance = Math.abs(
                item.x - x
              );

              if (
                distance < closestDistance
              ) {
                closestDistance = distance;
                closestIndex = index;
              }
            }
          );

          row[closestIndex] =
            row[closestIndex]
              ? `${row[closestIndex]} ${item.str}`
              : item.str;
        }

        if (
          row.some(
            (value) =>
              String(value).trim() !== ""
          )
        ) {
          allRows.push(row);
        }
      }
    }

    if (allRows.length < 2) {
      throw new Error(
        "No recognizable table was found in the PDF. " +
          "Use a text-based PDF with a clear table header."
      );
    }

    validateHeaders(
      allRows[0],
      columns
    );

    return allRows;
  } finally {
    // Cleanup through the PDF loading task.
    await loadingTask.destroy();
  }
}

// ------------------------------
// Component
// ------------------------------

function ImportButton({
  columns,
  onImport,
  validateRow,
  label = "Import",
  title = "Import Records",
  maxFileSizeMB = 5,
  previewLimit = 10,
  disabled = false,
}: ImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [error, setError] = useState("");
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);

  const isBusy = parsing || importing;

  const validRows = rows.filter(
    (row) => row.errors.length === 0
  );

  const invalidRows = rows.filter(
    (row) => row.errors.length > 0
  );

  const reset = () => {
    setFileName("");
    setRows([]);
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (isBusy) return;

    setOpen(false);
    reset();
  };

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    reset();

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() ?? "";

    if (
      !["csv", "xlsx", "xls", "pdf"].includes(
        extension
      )
    ) {
      setError(
        "Please select a CSV, Excel, or PDF file."
      );
      return;
    }

    if (
      file.size >
      maxFileSizeMB * 1024 * 1024
    ) {
      setError(
        `File size must not exceed ${maxFileSizeMB} MB.`
      );
      return;
    }

    setParsing(true);

    try {
      const matrix =
        extension === "pdf"
          ? await parsePDF(file, columns)
          : await parseSpreadsheet(file);

      if (matrix.length < 2) {
        throw new Error(
          "The file must contain a header and at least one row."
        );
      }

      const columnIndexes =
        validateHeaders(
          matrix[0],
          columns
        );

      const parsed: ParsedRow[] = matrix
        .slice(1)
        .map((cells, index) => {
          const data: ImportRow = {};
          const errors: string[] = [];

          columns.forEach(
            (column, columnIndex) => {
              const fileColumnIndex =
                columnIndexes[columnIndex];

              const value =
                fileColumnIndex >= 0
                  ? normalizeCell(
                      cells[fileColumnIndex]
                    )
                  : null;

              data[column.key] = value;

              if (
                column.required &&
                (value === null ||
                  String(value).trim() === "")
              ) {
                errors.push(
                  `${column.label} is required`
                );
              }
            }
          );

          if (validateRow) {
            errors.push(
              ...validateRow(data, index)
            );
          }

          return {
            data,
            errors,
            rowNumber: index + 2,
          };
        });

      setRows(parsed);
      setFileName(file.name);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to read the selected file."
      );
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (
      isBusy ||
      invalidRows.length > 0 ||
      validRows.length === 0
    ) {
      return;
    }

    setImporting(true);
    setError("");

    try {
      await onImport(
        validRows.map((row) => row.data)
      );

      setOpen(false);
      reset();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Import failed."
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<UploadFileOutlined />}
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        {label}
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
          }}
        >
          {title}

          <Button
            color="inherit"
            onClick={handleClose}
            disabled={isBusy}
            startIcon={<CloseOutlined />}
          >
            Close
          </Button>
        </DialogTitle>

        <Divider />

        <DialogContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2.5,
            }}
          >
            {/* Upload Area */}
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderStyle: "dashed",
                borderRadius: 2,
                textAlign: "center",
              }}
            >
              <UploadFileOutlined
                sx={{
                  fontSize: 44,
                  color: "text.secondary",
                  mb: 1,
                }}
              />

              <Typography sx={{ mb: 1 }}>
                Select a CSV, Excel, or PDF file
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: "block",
                  mb: 2,
                }}
              >
                CSV, XLSX, XLS, PDF · Maximum{" "}
                {maxFileSizeMB} MB
              </Typography>

              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.pdf"
                hidden
                onChange={(event) => {
                  void handleFileChange(event);
                }}
              />

              <Button
                variant="outlined"
                disabled={isBusy}
                onClick={() =>
                  inputRef.current?.click()
                }
              >
                Choose File
              </Button>

              {parsing && (
                <Box sx={{ mt: 2 }}>
                  <CircularProgress size={22} />

                  <Typography
                    variant="body2"
                    sx={{ mt: 1 }}
                  >
                    Reading file...
                  </Typography>
                </Box>
              )}

              {fileName && (
                <Typography
                  variant="body2"
                  sx={{ mt: 1.5 }}
                >
                  Selected: {fileName}
                </Typography>
              )}
            </Paper>

            {/* Error Message */}
            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}

            {/* Preview */}
            {rows.length > 0 && (
              <>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  <Chip
                    label={`${rows.length} total`}
                    variant="outlined"
                  />

                  <Chip
                    icon={
                      <CheckCircleOutlined />
                    }
                    label={`${validRows.length} valid`}
                    color="success"
                    variant="outlined"
                  />

                  <Chip
                    icon={<ErrorOutlined />}
                    label={`${invalidRows.length} invalid`}
                    color={
                      invalidRows.length > 0
                        ? "error"
                        : "default"
                    }
                    variant="outlined"
                  />
                </Box>

                {invalidRows.length > 0 && (
                  <Alert severity="warning">
                    Fix invalid rows before importing.
                    {invalidRows
                      .slice(0, 5)
                      .map(
                        (row) =>
                          ` Row ${row.rowNumber}: ${row.errors.join(
                            ", "
                          )}.`
                      )}
                  </Alert>
                )}

                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600 }}
                >
                  Data Preview
                </Typography>

                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ maxHeight: 340 }}
                >
                  <Table
                    size="small"
                    stickyHeader
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          Row
                        </TableCell>

                        {columns.map(
                          (column) => (
                            <TableCell
                              key={column.key}
                            >
                              {column.label}
                            </TableCell>
                          )
                        )}

                        <TableCell>
                          Status
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {rows
                        .slice(0, previewLimit)
                        .map((row) => (
                          <TableRow
                            key={row.rowNumber}
                          >
                            <TableCell>
                              {row.rowNumber}
                            </TableCell>

                            {columns.map(
                              (column) => (
                                <TableCell
                                  key={column.key}
                                >
                                  {String(
                                    row.data[
                                      column.key
                                    ] ?? ""
                                  )}
                                </TableCell>
                              )
                            )}

                            <TableCell>
                              <Chip
                                size="small"
                                label={
                                  row.errors.length ===
                                  0
                                    ? "Valid"
                                    : "Invalid"
                                }
                                color={
                                  row.errors.length ===
                                  0
                                    ? "success"
                                    : "error"
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {rows.length >
                  previewLimit && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Showing first{" "}
                    {previewLimit} of{" "}
                    {rows.length} records.
                  </Typography>
                )}
              </>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button
            color="inherit"
            onClick={handleClose}
            disabled={isBusy}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            startIcon={
              importing ? (
                <CircularProgress
                  size={16}
                  color="inherit"
                />
              ) : (
                <UploadFileOutlined />
              )
            }
            disabled={
              isBusy ||
              rows.length === 0 ||
              invalidRows.length > 0
            }
            onClick={() =>
              void handleImport()
            }
          >
            {importing
              ? "Importing..."
              : `Import ${validRows.length} Records`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ImportButton;
