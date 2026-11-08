
import { useState } from "react";

import {
  Alert,
  Box,
  Button,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import {
  PrintOutlined,
  RestartAltOutlined,
  SaveOutlined,
} from "@mui/icons-material";

import type {
  PrinterConnectionType,
  PrinterEncoding,
  PrinterPaperSize,
  PrinterSettingsData,
} from "./printer-settings-models";

import {
  arePrinterSettingsEqual,
  DEFAULT_PRINTER_SETTINGS,
  validatePrinterSettings,
} from "./printer-settings-models";

export interface PrinterSettingsProps {
  value: PrinterSettingsData;
  savedValue: PrinterSettingsData;

  onChange: (value: PrinterSettingsData) => void;

  onSave: (
    value: PrinterSettingsData
  ) => Promise<void> | void;

  onTestPrint?: (
    value: PrinterSettingsData
  ) => Promise<void> | void;

  disabled?: boolean;
  saving?: boolean;
  testing?: boolean;

  title?: string;
}

function PrinterSettings({
  value,
  savedValue,
  onChange,
  onSave,
  onTestPrint,
  disabled = false,
  saving = false,
  testing = false,
  title = "Printer Settings",
}: PrinterSettingsProps) {
  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const validation =
    validatePrinterSettings(value);

  const hasChanges =
    !arePrinterSettingsEqual(
      value,
      savedValue
    );

  const busy = disabled || saving || testing;

  const update = <
    K extends keyof PrinterSettingsData
  >(
    key: K,
    nextValue: PrinterSettingsData[K]
  ) => {
    if (busy) return;

    onChange({
      ...value,
      [key]: nextValue,
    });

    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSave = async () => {
    if (busy || !hasChanges) return;

    if (!validation.valid) {
      setErrorMessage(
        "Please correct the invalid settings."
      );
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    try {
      await onSave(value);

      setSuccessMessage(
        "Printer settings saved successfully."
      );
    } catch {
      setErrorMessage(
        "Failed to save printer settings."
      );
    }
  };

  const handleTest = async () => {
    if (
      busy ||
      !onTestPrint ||
      !validation.valid
    ) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    try {
      await onTestPrint(value);

      setSuccessMessage(
        "Test print request completed."
      );
    } catch {
      setErrorMessage(
        "Test printing failed or was cancelled."
      );
    }
  };

  const resetDefaults = () => {
    if (busy) return;

    onChange({
      ...DEFAULT_PRINTER_SETTINGS,
    });

    setErrorMessage("");
    setSuccessMessage("");
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
      }}
    >
      <Stack spacing={3}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 700 }}
          >
            {title}
          </Typography>

          <Typography
            variant="caption"
            color={
              hasChanges
                ? "warning.main"
                : "success.main"
            }
          >
            {hasChanges
              ? "Unsaved changes"
              : "No changes"}
          </Typography>
        </Box>

        {errorMessage && (
          <Alert
            severity="error"
            onClose={() => setErrorMessage("")}
          >
            {errorMessage}
          </Alert>
        )}

        {successMessage && (
          <Alert
            severity="success"
            onClose={() => setSuccessMessage("")}
          >
            {successMessage}
          </Alert>
        )}

        <Box>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, mb: 2 }}
          >
            Printer Connection
          </Typography>

          <Stack spacing={2}>
            <TextField
              fullWidth
              required
              label="Printer Name"
              value={value.printerName}
              disabled={busy}
              error={Boolean(
                validation.errors.printerName
              )}
              helperText={
                validation.errors.printerName
              }
              onChange={(event) =>
                update(
                  "printerName",
                  event.target.value
                )
              }
            />

            <TextField
              select
              fullWidth
              label="Connection Type"
              value={value.connectionType}
              disabled={busy}
              onChange={(event) =>
                update(
                  "connectionType",
                  event.target
                    .value as PrinterConnectionType
                )
              }
            >
              <MenuItem value="system">
                System / Browser Printer
              </MenuItem>

              <MenuItem value="usb">
                USB Thermal Printer
              </MenuItem>

              <MenuItem value="bluetooth">
                Bluetooth Thermal Printer
              </MenuItem>

              <MenuItem value="network">
                Network Printer
              </MenuItem>
            </TextField>

            {(value.connectionType === "usb" ||
              value.connectionType ===
                "bluetooth") && (
              <>
                <TextField
                  fullWidth
                  label="Device Identifier (Optional)"
                  value={value.deviceId}
                  disabled={busy}
                  onChange={(event) =>
                    update(
                      "deviceId",
                      event.target.value
                    )
                  }
                  helperText={
                    "A device adapter will provide " +
                    "this identifier when connected."
                  }
                />

                <Alert severity="info">
                  Hardware discovery and connection
                  will be implemented through a
                  separate printer adapter.
                </Alert>
              </>
            )}

            {value.connectionType ===
              "network" && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "2fr 1fr",
                  },
                  gap: 2,
                }}
              >
                <TextField
                  label="IP Address / Hostname"
                  value={value.networkHost}
                  disabled={busy}
                  error={Boolean(
                    validation.errors.networkHost
                  )}
                  helperText={
                    validation.errors.networkHost
                  }
                  onChange={(event) =>
                    update(
                      "networkHost",
                      event.target.value
                    )
                  }
                />

                <TextField
                  label="Port"
                  type="number"
                  value={value.networkPort}
                  disabled={busy}
                  error={Boolean(
                    validation.errors.networkPort
                  )}
                  helperText={
                    validation.errors.networkPort
                  }
                  onChange={(event) =>
                    update(
                      "networkPort",
                      Number(event.target.value)
                    )
                  }
                />
              </Box>
            )}
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, mb: 2 }}
          >
            Print Layout
          </Typography>

          <Stack spacing={2}>
            <TextField
              select
              fullWidth
              label="Paper Size"
              value={value.paperSize}
              disabled={busy}
              onChange={(event) =>
                update(
                  "paperSize",
                  event.target
                    .value as PrinterPaperSize
                )
              }
            >
              <MenuItem value="58mm">
                58 mm Thermal
              </MenuItem>

              <MenuItem value="80mm">
                80 mm Thermal
              </MenuItem>

              <MenuItem value="a4">
                A4
              </MenuItem>
            </TextField>

            <TextField
              fullWidth
              label="Number of Copies"
              type="number"
              value={value.copies}
              disabled={busy}
              slotProps={{
                htmlInput: {
                  min: 1,
                  max: 5,
                  step: 1,
                },
              }}
              error={Boolean(
                validation.errors.copies
              )}
              helperText={
                validation.errors.copies
              }
              onChange={(event) =>
                update(
                  "copies",
                  Number(event.target.value)
                )
              }
            />

            <TextField
              select
              fullWidth
              label="Character Encoding"
              value={value.encoding}
              disabled={busy}
              onChange={(event) =>
                update(
                  "encoding",
                  event.target
                    .value as PrinterEncoding
                )
              }
              helperText={
                "Actual support depends on " +
                "the printer and driver."
              }
            >
              <MenuItem value="utf8">
                UTF-8
              </MenuItem>

              <MenuItem value="cp437">
                CP437
              </MenuItem>

              <MenuItem value="cp858">
                CP858
              </MenuItem>
            </TextField>
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, mb: 2 }}
          >
            Printing Preferences
          </Typography>

          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={value.autoPrint}
                  disabled={busy}
                  onChange={(event) =>
                    update(
                      "autoPrint",
                      event.target.checked
                    )
                  }
                />
              }
              label="Print automatically after checkout"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={value.autoCut}
                  disabled={busy}
                  onChange={(event) =>
                    update(
                      "autoCut",
                      event.target.checked
                    )
                  }
                />
              }
              label="Automatically cut receipt paper"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={value.openCashDrawer}
                  disabled={busy}
                  onChange={(event) =>
                    update(
                      "openCashDrawer",
                      event.target.checked
                    )
                  }
                />
              }
              label="Open cash drawer after checkout"
            />
          </Stack>

          <Typography
            variant="caption"
            color="text.secondary"
          >
            Paper cutting and cash drawer commands
            require compatible printer hardware.
          </Typography>
        </Box>

        <Divider />

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<RestartAltOutlined />}
            disabled={busy}
            onClick={resetDefaults}
          >
            Restore Defaults
          </Button>

          <Button
            variant="outlined"
            startIcon={<PrintOutlined />}
            disabled={
              busy ||
              !validation.valid ||
              !onTestPrint
            }
            onClick={() => {
              void handleTest();
            }}
          >
            {testing
              ? "Testing..."
              : "Test Print"}
          </Button>

          <Button
            variant="contained"
            startIcon={<SaveOutlined />}
            disabled={
              busy ||
              !hasChanges ||
              !validation.valid
            }
            onClick={() => {
              void handleSave();
            }}
          >
            {saving
              ? "Saving..."
              : "Save Settings"}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}

export default PrinterSettings;
