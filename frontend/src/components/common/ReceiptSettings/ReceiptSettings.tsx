
import { useEffect, useRef, useState } from "react";

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
  CloudUploadOutlined,
  RestartAltOutlined,
  SaveOutlined,
} from "@mui/icons-material";

import type {
  ReceiptSettingsData,
  ReceiptSettingsPaperSize,
} from "./receipt-settings-models";

import {
  areReceiptSettingsEqual,
  DEFAULT_RECEIPT_SETTINGS,
  validateReceiptSettings,
} from "./receipt-settings.utils";

export interface ReceiptSettingsProps {
  value: ReceiptSettingsData;

  onChange: (value: ReceiptSettingsData) => void;

  onSave: (
    value: ReceiptSettingsData
  ) => Promise<void> | void;

  onLogoSelected?: (
    file: File
  ) => Promise<string | void> | string | void;

  disabled?: boolean;
  saving?: boolean;

  title?: string;
  showResetButton?: boolean;
}

function ReceiptSettings({
  value,
  onChange,
  onSave,
  onLogoSelected,
  disabled = false,
  saving = false,
  title = "Receipt Settings",
  showResetButton = true,
}: ReceiptSettingsProps) {
  const [savedValue, setSavedValue] =
    useState<ReceiptSettingsData>(() => ({
      ...value,
    }));

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [logoPreview, setLogoPreview] =
    useState<string | null>(null);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const validation = validateReceiptSettings(value);

  const hasChanges = !areReceiptSettingsEqual(
    value,
    savedValue
  );

  const isDisabled = disabled || saving;

  const updateField = <
    K extends keyof ReceiptSettingsData
  >(
    key: K,
    fieldValue: ReceiptSettingsData[K]
  ) => {
    if (isDisabled) return;

    onChange({
      ...value,
      [key]: fieldValue,
    });

    setSuccessMessage("");
    setErrorMessage("");
  };

  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const handleLogoUpload = async (
    file: File | undefined
  ) => {
    if (!file || isDisabled) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage(
        "Please select an image file."
      );
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage(
        "Logo size must not exceed 2 MB."
      );
      return;
    }

    if (!onLogoSelected) {
      setErrorMessage(
        "Logo upload is not configured."
      );
      return;
    }

    const previewUrl =
      URL.createObjectURL(file);

    setLogoPreview(previewUrl);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const uploadedUrl =
        await onLogoSelected(file);

      if (
        typeof uploadedUrl === "string" &&
        uploadedUrl.trim()
      ) {
        updateField("logoUrl", uploadedUrl);
        setLogoPreview(null);
      }
    } catch {
      setErrorMessage(
        "Failed to upload the business logo."
      );
      setLogoPreview(null);
    }
  };

  const handleSave = async () => {
    if (isDisabled || !hasChanges) return;

    if (!validation.valid) {
      setErrorMessage(
        "Please correct the highlighted fields."
      );
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    try {
      await onSave(value);

      setSavedValue({ ...value });

      setSuccessMessage(
        "Receipt settings saved successfully."
      );
    } catch {
      setErrorMessage(
        "Failed to save receipt settings."
      );
    }
  };

  const handleReset = () => {
    if (isDisabled) return;

    onChange({
      ...DEFAULT_RECEIPT_SETTINGS,
    });

    setLogoPreview(null);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const toggle = (
    key: keyof Pick<
      ReceiptSettingsData,
      | "showLogo"
      | "showBarcode"
      | "showCustomer"
      | "showCashier"
      | "showItemDiscounts"
      | "showPaymentReferences"
    >,
    label: string
  ) => (
    <FormControlLabel
      key={key}
      control={
        <Switch
          checked={value[key]}
          disabled={isDisabled}
          onChange={(event) =>
            updateField(
              key,
              event.target.checked
            )
          }
        />
      }
      label={label}
    />
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          mb: 3,
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
          sx={{ mb: 2 }}
          onClose={() => setErrorMessage("")}
        >
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccessMessage("")}
        >
          {successMessage}
        </Alert>
      )}

      <Stack spacing={3}>
        <Box>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, mb: 2 }}
          >
            Business Information
          </Typography>

          <Stack spacing={2}>
            <TextField
              fullWidth
              required
              label="Business Name"
              value={value.businessName}
              disabled={isDisabled}
              error={Boolean(
                validation.errors.businessName
              )}
              helperText={
                validation.errors.businessName
              }
              onChange={(event) =>
                updateField(
                  "businessName",
                  event.target.value
                )
              }
            />

            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Business Address"
              value={value.address}
              disabled={isDisabled}
              onChange={(event) =>
                updateField(
                  "address",
                  event.target.value
                )
              }
            />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr 1fr",
                },
                gap: 2,
              }}
            >
              <TextField
                label="Phone Number"
                value={value.phone}
                disabled={isDisabled}
                onChange={(event) =>
                  updateField(
                    "phone",
                    event.target.value
                  )
                }
              />

              <TextField
                label="Email"
                value={value.email}
                disabled={isDisabled}
                error={Boolean(
                  validation.errors.email
                )}
                helperText={
                  validation.errors.email
                }
                onChange={(event) =>
                  updateField(
                    "email",
                    event.target.value
                  )
                }
              />
            </Box>

            <TextField
              fullWidth
              label="Tax Registration Number"
              value={value.taxRegistrationNumber}
              disabled={isDisabled}
              onChange={(event) =>
                updateField(
                  "taxRegistrationNumber",
                  event.target.value
                )
              }
            />
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, mb: 2 }}
          >
            Business Logo
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              flexWrap: "wrap",
            }}
          >
            {(logoPreview || value.logoUrl) && (
              <Box
                component="img"
                src={
                  logoPreview ||
                  value.logoUrl
                }
                alt="Business logo"
                sx={{
                  width: 100,
                  height: 100,
                  objectFit: "contain",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  p: 1,
                }}
              />
            )}

            <Box>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={(event) => {
                  void handleLogoUpload(
                    event.target.files?.[0]
                  );

                  event.target.value = "";
                }}
              />

              <Button
                variant="outlined"
                startIcon={
                  <CloudUploadOutlined />
                }
                disabled={
                  isDisabled || !onLogoSelected
                }
                onClick={() =>
                  fileInputRef.current?.click()
                }
              >
                Upload Logo
              </Button>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: "block",
                  mt: 1,
                }}
              >
                PNG, JPG or WebP. Maximum 2 MB.
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider />

        <Box>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, mb: 2 }}
          >
            Receipt Layout
          </Typography>

          <Stack spacing={2}>
            <TextField
              select
              fullWidth
              label="Default Paper Size"
              value={value.paperSize}
              disabled={isDisabled}
              onChange={(event) =>
                updateField(
                  "paperSize",
                  event.target
                    .value as ReceiptSettingsPaperSize
                )
              }
            >
              <MenuItem value="58mm">
                58 mm Thermal Receipt
              </MenuItem>

              <MenuItem value="80mm">
                80 mm Thermal Receipt
              </MenuItem>

              <MenuItem value="a4">
                A4 Invoice
              </MenuItem>
            </TextField>

            <TextField
              fullWidth
              required
              label="Receipt Title"
              value={value.receiptTitle}
              disabled={isDisabled}
              error={Boolean(
                validation.errors.receiptTitle
              )}
              helperText={
                validation.errors.receiptTitle
              }
              onChange={(event) =>
                updateField(
                  "receiptTitle",
                  event.target.value
                )
              }
            />

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Footer Message"
              value={value.footerMessage}
              disabled={isDisabled}
              onChange={(event) =>
                updateField(
                  "footerMessage",
                  event.target.value
                )
              }
            />
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, mb: 2 }}
          >
            Receipt Visibility
          </Typography>

          <Stack spacing={1}>
            {toggle(
              "showLogo",
              "Show Business Logo"
            )}

            {toggle(
              "showBarcode",
              "Show Receipt Barcode"
            )}

            {toggle(
              "showCustomer",
              "Show Customer Details"
            )}

            {toggle(
              "showCashier",
              "Show Cashier Name"
            )}

            {toggle(
              "showItemDiscounts",
              "Show Item Discounts"
            )}

            {toggle(
              "showPaymentReferences",
              "Show Payment References"
            )}
          </Stack>
        </Box>

        <Divider />

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          {showResetButton && (
            <Button
              variant="outlined"
              color="inherit"
              startIcon={
                <RestartAltOutlined />
              }
              disabled={isDisabled}
              onClick={handleReset}
            >
              Restore Defaults
            </Button>
          )}

          <Button
            variant="contained"
            startIcon={<SaveOutlined />}
            disabled={
              isDisabled ||
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

export default ReceiptSettings;
